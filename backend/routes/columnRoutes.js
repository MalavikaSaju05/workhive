const express = require('express');
const {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns,
} = require('../controllers/columnController');
const { protect } = require('../middleware/authMiddleware');
const { columnTitleValidation } = require('../validations/columnValidation');

// mergeParams: true lets this router access :boardId from the parent router
const router = express.Router({ mergeParams: true });

// All column routes require authentication
router.use(protect);

// @route   GET  /api/boards/:boardId/columns
// @desc    Get all columns for a board, sorted by order
// @access  Private (board members)
router.get('/', getColumns);

// @route   POST /api/boards/:boardId/columns
// @desc    Create a new column on a board
// @access  Private (board members)
router.post('/', columnTitleValidation, createColumn);

// @route   PUT /api/boards/:boardId/columns/reorder
// @desc    Bulk-reorder columns (drag-and-drop)
//          Body: { orderedIds: string[] }
// @access  Private (board members)
// NOTE: this route must be defined BEFORE /:columnId to avoid Express
//       treating "reorder" as a dynamic :columnId segment.
router.put('/reorder', reorderColumns);

// @route   PUT /api/boards/:boardId/columns/:columnId
// @desc    Rename a column
// @access  Private (board members)
router.put('/:columnId', columnTitleValidation, updateColumn);

// @route   DELETE /api/boards/:boardId/columns/:columnId
// @desc    Delete a column (re-sequences remaining columns)
// @access  Private (board members)
router.delete('/:columnId', deleteColumn);

module.exports = router;
