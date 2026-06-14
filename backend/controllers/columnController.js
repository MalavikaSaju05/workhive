const { validationResult } = require('express-validator');
const Column = require('../models/Column');
const Board = require('../models/Board');
const Activity = require('../models/Activity');
const { emitToBoard } = require('../config/socket');
const { ApiError } = require('../middleware/errorMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify the requesting user is a member of the board that owns the column.
 * Returns the board document if access is granted, throws ApiError otherwise.
 *
 * @param {string} boardId
 * @param {string|ObjectId} userId
 */
const assertBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, 'Board not found');
  if (!board.hasMember(userId)) {
    throw new ApiError(403, 'You do not have access to this board');
  }
  return board;
};

// ─────────────────────────────────────────────────────────────────────────────
// Column CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new column on a board
 * @route   POST /api/boards/:boardId/columns
 * @access  Private (board members)
 *
 * Body: { title: string }
 *
 * The new column is appended after the last existing column (highest order + 1).
 */
const createColumn = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    // Determine next order value
    const lastColumn = await Column.findOne({ board: boardId }).sort({ order: -1 });
    const nextOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await Column.create({
      title: req.body.title,
      board: boardId,
      order: nextOrder,
    });

    await Activity.log({
      board: boardId,
      action: 'column_created',
      user: req.user._id,
      message: `created the column "${column.title}"`,
    });

    emitToBoard(boardId, 'column:created', { column, userId: req.user._id.toString() });

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      column,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all columns for a board, sorted by order
 * @route   GET /api/boards/:boardId/columns
 * @access  Private (board members)
 */
const getColumns = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    const columns = await Column.find({ board: boardId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      columns,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a column's title
 * @route   PUT /api/boards/:boardId/columns/:columnId
 * @access  Private (board members)
 *
 * Body: { title: string }
 */
const updateColumn = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId, columnId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    const column = await Column.findOne({ _id: columnId, board: boardId });
    if (!column) throw new ApiError(404, 'Column not found');

    const previousTitle = column.title;
    column.title = req.body.title;
    await column.save();

    await Activity.log({
      board: boardId,
      action: 'column_updated',
      user: req.user._id,
      message: `renamed column "${previousTitle}" to "${column.title}"`,
    });

    emitToBoard(boardId, 'column:updated', { column, userId: req.user._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Column updated',
      column,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a column and re-sequence the remaining columns' order values
 * @route   DELETE /api/boards/:boardId/columns/:columnId
 * @access  Private (board members)
 *
 * Note: Phase 4 (Tasks) will extend this to also delete/move orphaned tasks.
 */
const deleteColumn = async (req, res, next) => {
  try {
    const { boardId, columnId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    const column = await Column.findOne({ _id: columnId, board: boardId });
    if (!column) throw new ApiError(404, 'Column not found');

    const deletedOrder = column.order;
    const deletedTitle = column.title;
    await column.deleteOne();

    // Phase 4: also remove any tasks that belonged to this column
    const Task = require('../models/Task');
    await Task.deleteMany({ column: columnId });

    // Shift down the order of all subsequent columns so there are no gaps
    await Column.updateMany(
      { board: boardId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    await Activity.log({
      board: boardId,
      action: 'column_deleted',
      user: req.user._id,
      message: `deleted the column "${deletedTitle}"`,
    });

    emitToBoard(boardId, 'column:deleted', { columnId, userId: req.user._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Column deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reorder columns (drag-and-drop)
 * @route   PUT /api/boards/:boardId/columns/reorder
 * @access  Private (board members)
 *
 * Body: { orderedIds: string[] }
 * orderedIds is the full array of column IDs in the new desired order.
 * Each column's `order` field is updated to match its index in the array.
 */
const reorderColumns = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new ApiError(400, 'orderedIds must be a non-empty array of column IDs');
    }

    // Bulk-write: update each column's order to match its index
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, board: boardId },
        update: { $set: { order: index } },
      },
    }));

    await Column.bulkWrite(bulkOps);

    const columns = await Column.find({ board: boardId }).sort({ order: 1 });

    emitToBoard(boardId, 'columns:reordered', { columns, userId: req.user._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Columns reordered',
      columns,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns,
};
