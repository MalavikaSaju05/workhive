const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  updateComment,
  deleteComment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const {
  createTaskValidation,
  updateTaskValidation,
  moveTaskValidation,
  commentValidation,
  taskQueryValidation,
} = require('../validations/taskValidation');

// mergeParams: true lets this router access :boardId from the parent router
const router = express.Router({ mergeParams: true });

// All task routes require authentication
router.use(protect);

// ── Task CRUD ─────────────────────────────────────────────────────────────────

// @route   GET /api/boards/:boardId/tasks
// @desc    Get tasks for a board, with optional search & filters (Phase 9)
//          Query: ?search=&status=&priority=&assignedTo=&dueBefore=&dueAfter=
// @access  Private (board members)
router.get('/', taskQueryValidation, getTasks);

// @route   POST /api/boards/:boardId/tasks
// @desc    Create a new task in a column
// @access  Private (board members)
router.post('/', createTaskValidation, createTask);

// @route   GET /api/boards/:boardId/tasks/:taskId
// @desc    Get a single task with comments and activity log
// @access  Private (board members)
router.get('/:taskId', getTaskById);

// @route   PUT /api/boards/:boardId/tasks/:taskId
// @desc    Update task fields (title, description, priority, due date,
//          assignee, status)
// @access  Private (board members)
router.put('/:taskId', updateTaskValidation, updateTask);

// @route   DELETE /api/boards/:boardId/tasks/:taskId
// @desc    Delete a task
// @access  Private (board members)
router.delete('/:taskId', deleteTask);

// ── Move / Reorder (Phase 5 backend support) ────────────────────────────────────

// @route   PUT /api/boards/:boardId/tasks/:taskId/move
// @desc    Move a task to a different column and/or position
//          Body: { column: "<columnId>", position: <number> }
// @access  Private (board members)
router.put('/:taskId/move', moveTaskValidation, moveTask);

// ── Comments (Phase 7) ───────────────────────────────────────────────────────────

// @route   POST /api/boards/:boardId/tasks/:taskId/comments
// @desc    Add a comment to a task
// @access  Private (board members)
router.post('/:taskId/comments', commentValidation, addComment);

// @route   PUT /api/boards/:boardId/tasks/:taskId/comments/:commentId
// @desc    Edit a comment (author only)
// @access  Private (comment author)
router.put('/:taskId/comments/:commentId', commentValidation, updateComment);

// @route   DELETE /api/boards/:boardId/tasks/:taskId/comments/:commentId
// @desc    Delete a comment (author only)
// @access  Private (comment author)
router.delete('/:taskId/comments/:commentId', deleteComment);

module.exports = router;
