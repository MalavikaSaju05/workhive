const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Column = require('../models/Column');
const Board = require('../models/Board');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { emitToBoard } = require('../config/socket');
const { ApiError } = require('../middleware/errorMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify the requesting user is a member of the given board.
 * Returns the board document if access is granted, throws ApiError otherwise.
 */
const assertBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, 'Board not found');
  if (!board.hasMember(userId)) {
    throw new ApiError(403, 'You do not have access to this board');
  }
  return board;
};

/**
 * Maps a column title to a task status value for analytics purposes
 * (Phase 11). Falls back to 'todo' for custom column names.
 */
const statusFromColumnTitle = (title = '') => {
  const normalized = title.trim().toLowerCase();
  if (normalized === 'done') return 'done';
  if (normalized === 'in progress') return 'in_progress';
  return 'todo';
};

/**
 * Maps a task status value back to the conventional column title used to
 * represent it ("To Do", "In Progress", "Done").
 */
const COLUMN_TITLE_FOR_STATUS = {
  todo: 'to do',
  in_progress: 'in progress',
  done: 'done',
};

/**
 * Finds the column on a board whose title corresponds to the given status
 * (e.g. status "done" -> the column titled "Done"). Used so that changing
 * a task's status from the Task Details modal also moves it into the
 * matching column, mirroring drag-and-drop behaviour.
 *
 * Returns null if no column with a matching title exists (e.g. on boards
 * with custom column names), in which case the task's status is updated
 * but it stays in its current column.
 *
 * @param {string} boardId
 * @param {'todo'|'in_progress'|'done'} status
 */
const findColumnForStatus = async (boardId, status) => {
  const targetTitle = COLUMN_TITLE_FOR_STATUS[status];
  if (!targetTitle) return null;

  const columns = await Column.find({ board: boardId });
  return columns.find((c) => c.title.trim().toLowerCase() === targetTitle) || null;
};

/**
 * Pushes an entry onto a task's embedded activityLog array (Phase 8) and
 * mirrors it into the board-level Activity collection for the team
 * activity timeline. The task-level push is synchronous (part of the
 * document being saved); the board-level log is fire-and-forget.
 */
const logActivity = (task, board, action, userId, message = '') => {
  task.activityLog.push({ action, user: userId, message });
  Activity.log({ board: board._id || board, task: task._id, action, user: userId, message });
};

const TASK_POPULATE = [
  { path: 'assignedTo', select: 'name email avatar' },
  { path: 'createdBy', select: 'name email avatar' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Task CRUD (Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new task in a column
 * @route   POST /api/boards/:boardId/tasks
 * @access  Private (board members)
 *
 * Body:
 * {
 *   "title": "Design login page",
 *   "description": "...",
 *   "column": "<columnId>",
 *   "priority": "High",
 *   "dueDate": "2026-07-01",
 *   "assignedTo": "<userId>"
 * }
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const { title, description, column, priority, dueDate, assignedTo } = req.body;

    const columnDoc = await Column.findOne({ _id: column, board: boardId });
    if (!columnDoc) {
      throw new ApiError(404, 'Column not found on this board');
    }

    if (assignedTo && !board.hasMember(assignedTo)) {
      throw new ApiError(400, 'assignedTo must be a member of this board');
    }

    // New task goes to the end of the column
    const lastTask = await Task.findOne({ column }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = new Task({
      title,
      description: description || '',
      board: boardId,
      column,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      status: statusFromColumnTitle(columnDoc.title),
      position,
    });

    logActivity(task, board, 'task_created', req.user._id, `created the task "${title}"`);

    if (assignedTo) {
      logActivity(task, board, 'task_assigned', req.user._id, 'assigned the task to a teammate');
    }

    await task.save();
    await task.populate(TASK_POPULATE);

    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await Notification.send({
        user: assignedTo,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: "${task.title}"`,
        link: `/board/${boardId}`,
      });
    }

    emitToBoard(boardId, 'task:created', { task, userId: req.user._id.toString() });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tasks for a board, with optional search & filters (Phase 9)
 * @route   GET /api/boards/:boardId/tasks
 * @access  Private (board members)
 *
 * Query params (all optional, additive):
 *  - search:     matches against title/description (case-insensitive)
 *  - status:     'todo' | 'in_progress' | 'done'
 *  - priority:   'Low' | 'Medium' | 'High' | 'Critical'
 *  - assignedTo: userId — filter to tasks assigned to a specific user
 *  - dueBefore / dueAfter: ISO date strings — filter by due date range
 *
 * Response includes tasks grouped is NOT done here — the frontend groups
 * tasks by `column` for board rendering. This endpoint returns a flat,
 * sorted list.
 */
const getTasks = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    const { search, status, priority, assignedTo, dueBefore, dueAfter } = req.query;

    const filter = { board: boardId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const tasks = await Task.find(filter)
      .sort({ column: 1, position: 1 })
      .populate(TASK_POPULATE);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single task with full details (comments, activity log)
 * @route   GET /api/boards/:boardId/tasks/:taskId
 * @access  Private (board members)
 */
const getTaskById = async (req, res, next) => {
  try {
    const { boardId, taskId } = req.params;
    await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId })
      .populate(TASK_POPULATE)
      .populate('comments.user', 'name email avatar')
      .populate('activityLog.user', 'name email avatar');

    if (!task) throw new ApiError(404, 'Task not found');

    res.status(200).json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a task's fields (title, description, priority, due date,
 *          assignee, status). Logs activity entries for assignment changes
 *          and general edits.
 * @route   PUT /api/boards/:boardId/tasks/:taskId
 * @access  Private (board members)
 *
 * Body (all fields optional):
 * {
 *   "title": "...", "description": "...", "priority": "High",
 *   "dueDate": "2026-07-01", "assignedTo": "<userId>", "status": "in_progress"
 * }
 */
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId, taskId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId });
    if (!task) throw new ApiError(404, 'Task not found');

    const { title, description, priority, dueDate, assignedTo, status } = req.body;
    const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    if (status !== undefined && status !== task.status) {
      const previousColumnId = task.column.toString();
      task.status = status;

      // Mirror drag-and-drop behaviour: changing the status moves the task
      // into the column whose title matches the new status (e.g. "Done"),
      // if such a column exists on this board.
      const targetColumn = await findColumnForStatus(boardId, status);

      if (targetColumn && targetColumn._id.toString() !== previousColumnId) {
        // Close the gap left in the previous column
        await Task.updateMany(
          { column: previousColumnId, position: { $gt: task.position } },
          { $inc: { position: -1 } }
        );

        // Append to the end of the target column
        const lastInTarget = await Task.findOne({ column: targetColumn._id }).sort({
          position: -1,
        });
        const newPosition = lastInTarget ? lastInTarget.position + 1 : 0;

        task.column = targetColumn._id;
        task.position = newPosition;

        logActivity(
          task,
          board,
          'task_moved',
          req.user._id,
          `moved the task to "${targetColumn.title}"`
        );
      }
    }

    if (assignedTo !== undefined) {
      const newAssignee = assignedTo || null;
      if (newAssignee && !board.hasMember(newAssignee)) {
        throw new ApiError(400, 'assignedTo must be a member of this board');
      }
      task.assignedTo = newAssignee;
      if (newAssignee !== previousAssignee) {
        logActivity(
          task,
          board,
          'task_assigned',
          req.user._id,
          newAssignee ? 'reassigned the task to a teammate' : 'unassigned the task'
        );
      }
    }

    logActivity(task, board, 'task_updated', req.user._id, `updated the task "${task.title}"`);

    await task.save();
    await task.populate(TASK_POPULATE);

    if (
      assignedTo !== undefined &&
      assignedTo &&
      assignedTo.toString() !== previousAssignee &&
      assignedTo.toString() !== req.user._id.toString()
    ) {
      await Notification.send({
        user: assignedTo,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: "${task.title}"`,
        link: `/board/${boardId}`,
      });
    }

    emitToBoard(boardId, 'task:updated', { task, userId: req.user._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Task updated',
      task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a task and re-sequence the remaining tasks in its column
 * @route   DELETE /api/boards/:boardId/tasks/:taskId
 * @access  Private (board members)
 */
const deleteTask = async (req, res, next) => {
  try {
    const { boardId, taskId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId });
    if (!task) throw new ApiError(404, 'Task not found');

    const { column, position, title } = task;
    await task.deleteOne();

    // Close the gap left in the column's ordering
    await Task.updateMany(
      { column, position: { $gt: position } },
      { $inc: { position: -1 } }
    );

    await Activity.log({
      board: board._id,
      task: null,
      action: 'task_deleted',
      user: req.user._id,
      message: `deleted the task "${title}"`,
    });

    emitToBoard(boardId, 'task:deleted', {
      taskId,
      columnId: column.toString(),
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Move / Reorder (Phase 5 backend support)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Move a task to a different column and/or position
 * @route   PUT /api/boards/:boardId/tasks/:taskId/move
 * @access  Private (board members)
 *
 * Body: { "column": "<targetColumnId>", "position": 2 }
 */
const moveTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId, taskId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId });
    if (!task) throw new ApiError(404, 'Task not found');

    const { column: targetColumnId, position: targetPosition } = req.body;
    const sourceColumnId = task.column.toString();
    const movingToNewColumn = sourceColumnId !== targetColumnId.toString();

    const targetColumn = await Column.findOne({ _id: targetColumnId, board: boardId });
    if (!targetColumn) throw new ApiError(404, 'Target column not found on this board');

    if (movingToNewColumn) {
      // Close the gap in the source column
      await Task.updateMany(
        { column: sourceColumnId, position: { $gt: task.position } },
        { $inc: { position: -1 } }
      );

      // Make room in the target column at the target position
      await Task.updateMany(
        { column: targetColumnId, position: { $gte: targetPosition } },
        { $inc: { position: 1 } }
      );

      task.column = targetColumnId;
      task.status = statusFromColumnTitle(targetColumn.title);
      logActivity(task, board, 'task_moved', req.user._id, `moved the task to "${targetColumn.title}"`);
    } else if (targetPosition !== task.position) {
      // Reordering within the same column
      if (targetPosition > task.position) {
        await Task.updateMany(
          { column: sourceColumnId, position: { $gt: task.position, $lte: targetPosition } },
          { $inc: { position: -1 } }
        );
      } else {
        await Task.updateMany(
          { column: sourceColumnId, position: { $gte: targetPosition, $lt: task.position } },
          { $inc: { position: 1 } }
        );
      }
    }

    task.position = targetPosition;
    await task.save();
    await task.populate(TASK_POPULATE);

    emitToBoard(boardId, 'task:moved', { task, userId: req.user._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Task moved',
      task,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Comments (Phase 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Add a comment to a task
 * @route   POST /api/boards/:boardId/tasks/:taskId/comments
 * @access  Private (board members)
 *
 * Body: { "text": "Looks good, just fix the spacing." }
 */
const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId, taskId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId });
    if (!task) throw new ApiError(404, 'Task not found');

    task.comments.push({ user: req.user._id, text: req.body.text });
    logActivity(task, board, 'comment_added', req.user._id, 'added a comment');

    await task.save();
    await task.populate('comments.user', 'name email avatar');

    // Phase 10: notify the task's creator and assignee (excluding the
    // commenter) about the new comment
    const recipients = new Set();
    if (task.createdBy) recipients.add(task.createdBy.toString());
    if (task.assignedTo) recipients.add(task.assignedTo.toString());
    recipients.delete(req.user._id.toString());

    await Promise.all(
      [...recipients].map((userId) =>
        Notification.send({
          user: userId,
          type: 'new_comment',
          message: `${req.user.name} commented on "${task.title}"`,
          link: `/board/${boardId}`,
        })
      )
    );

    emitToBoard(boardId, 'comment:added', {
      taskId,
      comments: task.comments,
      userId: req.user._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comments: task.comments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Edit a comment on a task (author only)
 * @route   PUT /api/boards/:boardId/tasks/:taskId/comments/:commentId
 * @access  Private (comment author)
 *
 * Body: { "text": "Updated comment text" }
 */
const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { boardId, taskId, commentId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId });
    if (!task) throw new ApiError(404, 'Task not found');

    const comment = task.comments.id(commentId);
    if (!comment) throw new ApiError(404, 'Comment not found');

    if (comment.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only edit your own comments');
    }

    comment.text = req.body.text;
    logActivity(task, board, 'comment_updated', req.user._id, 'edited a comment');

    await task.save();
    await task.populate('comments.user', 'name email avatar');

    emitToBoard(boardId, 'comment:updated', {
      taskId,
      comments: task.comments,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Comment updated',
      comments: task.comments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a comment from a task (author only)
 * @route   DELETE /api/boards/:boardId/tasks/:taskId/comments/:commentId
 * @access  Private (comment author)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { boardId, taskId, commentId } = req.params;
    const board = await assertBoardAccess(boardId, req.user._id);

    const task = await Task.findOne({ _id: taskId, board: boardId });
    if (!task) throw new ApiError(404, 'Task not found');

    const comment = task.comments.id(commentId);
    if (!comment) throw new ApiError(404, 'Comment not found');

    if (comment.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only delete your own comments');
    }

    comment.deleteOne();
    logActivity(task, board, 'comment_deleted', req.user._id, 'deleted a comment');

    await task.save();
    await task.populate('comments.user', 'name email avatar');

    emitToBoard(boardId, 'comment:deleted', {
      taskId,
      comments: task.comments,
      userId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted',
      comments: task.comments,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  updateComment,
  deleteComment,
};
