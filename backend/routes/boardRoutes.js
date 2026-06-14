const express = require('express');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  removeMember,
  getBoardMembers,
} = require('../controllers/boardController');
const { getBoardActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const {
  createBoardValidation,
  updateBoardValidation,
} = require('../validations/boardValidation');
const activityRoutes = require('./activityRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

// All board routes require authentication
router.use(protect);

// ── Board CRUD ────────────────────────────────────────────────────────────────

// @route   POST /api/boards
// @desc    Create a new board (personal or collaborative)
// @access  Private
router.post('/', createBoardValidation, createBoard);

// @route   GET /api/boards
// @desc    Get all boards the logged-in user has access to
// @access  Private
router.get('/', getBoards);

// @route   GET /api/boards/:id
// @desc    Get a single board (with columns) by ID
// @access  Private (members only)
router.get('/:id', getBoardById);

// @route   PUT /api/boards/:id
// @desc    Update board metadata (title, description, visibility, coverColor)
// @access  Private (owner only)
router.put('/:id', updateBoardValidation, updateBoard);

// @route   DELETE /api/boards/:id
// @desc    Archive (or permanently delete) a board
//          Pass ?permanent=true for a hard delete
// @access  Private (owner only)
router.delete('/:id', deleteBoard);

// ── Member Management ─────────────────────────────────────────────────────────

// @route   POST /api/boards/:id/invite
// @desc    Invite a user to a collaborative board by email
// @access  Private (owner only)
router.post('/:id/invite', inviteMember);

// @route   DELETE /api/boards/:id/members/:memberId
// @desc    Remove a member from a board
// @access  Private (owner, or the member removing themselves)
router.delete('/:id/members/:memberId', removeMember);

// @route   GET /api/boards/:id/members
// @desc    List all members of a board
// @access  Private (members only)
router.get('/:id/members', getBoardMembers);

// @route   GET /api/boards/:id/activity
// @desc    Get the board's activity timeline (Phase 8)
// @access  Private (members only)
router.use('/:id/activity', activityRoutes);

// @route   GET /api/boards/:id/analytics
// @desc    Get the board's analytics (Phase 11)
// @access  Private (members only)
router.use('/:id/analytics', analyticsRoutes);

// ── Activity Timeline (Phase 8) ────────────────────────────────────────────────

// @route   GET /api/boards/:id/activity
// @desc    Get the board's activity timeline (most recent first)
//          Query: ?limit=50
// @access  Private (members only)
router.get('/:id/activity', getBoardActivity);

module.exports = router;
