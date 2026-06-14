const { validationResult } = require('express-validator');
const Board = require('../models/Board');
const Column = require('../models/Column');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { ApiError } = require('../middleware/errorMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seed the three default columns for a freshly created board.
 * Runs after every board creation so users always start with a usable layout.
 *
 * @param {string|ObjectId} boardId
 */
const seedDefaultColumns = async (boardId) => {
  const defaults = ['To Do', 'In Progress', 'Done'];
  const docs = defaults.map((title, index) => ({ title, board: boardId, order: index }));
  await Column.insertMany(docs);
};

// ─────────────────────────────────────────────────────────────────────────────
// Board CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new board
 * @route   POST /api/boards
 * @access  Private
 *
 * Body: { title, description?, visibility?, coverColor? }
 *
 * On success the board is returned with its owner populated and
 * three default columns are created automatically.
 */
const createBoard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { title, description, visibility, coverColor } = req.body;

    const board = await Board.create({
      title,
      description,
      visibility: visibility || 'personal',
      coverColor,
      owner: req.user._id,
      members: [req.user._id],
    });

    // Seed To Do / In Progress / Done columns for every new board
    await seedDefaultColumns(board._id);

    const populated = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: populated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all boards the logged-in user has access to
 * @route   GET /api/boards
 * @access  Private
 *
 * Query params:
 *  - visibility: "personal" | "collaborative"   (optional filter)
 *  - archived:   "true"                          (include archived boards)
 *
 * Returns two lists:
 *  - personalBoards:      boards where visibility === "personal"
 *  - collaborativeBoards: boards where visibility === "collaborative"
 */
const getBoards = async (req, res, next) => {
  try {
    const { archived } = req.query;

    const filter = {
      members: req.user._id,
      isArchived: archived === 'true' ? true : false,
    };

    const boards = await Board.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ updatedAt: -1 });

    const personalBoards = boards.filter((b) => b.visibility === 'personal');
    const collaborativeBoards = boards.filter((b) => b.visibility === 'collaborative');

    res.status(200).json({
      success: true,
      personalBoards,
      collaborativeBoards,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single board by ID (with its columns)
 * @route   GET /api/boards/:id
 * @access  Private (members only)
 */
const getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    if (!board.hasMember(req.user._id)) {
      throw new ApiError(403, 'You do not have access to this board');
    }

    // Fetch the board's columns in order
    const columns = await Column.find({ board: board._id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      board,
      columns,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a board's title, description, visibility, or coverColor
 * @route   PUT /api/boards/:id
 * @access  Private (owner only)
 */
const updateBoard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const board = await Board.findById(req.params.id);

    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the board owner can update board settings');
    }

    const allowedFields = ['title', 'description', 'visibility', 'coverColor'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        board[field] = req.body[field];
      }
    });

    await board.save();

    const updated = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      board: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Soft-delete (archive) a board
 * @route   DELETE /api/boards/:id
 * @access  Private (owner only)
 *
 * We archive rather than hard-delete to preserve task history.
 * Pass ?permanent=true to permanently delete the board and all its columns.
 */
const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the board owner can delete this board');
    }

    if (req.query.permanent === 'true') {
      // Hard delete: remove board + all associated columns
      await Column.deleteMany({ board: board._id });
      await board.deleteOne();
      return res.status(200).json({ success: true, message: 'Board permanently deleted' });
    }

    // Soft delete: mark as archived
    board.isArchived = true;
    await board.save();

    res.status(200).json({ success: true, message: 'Board archived successfully' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Member Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Invite a member to a collaborative board by email
 * @route   POST /api/boards/:id/invite
 * @access  Private (owner only)
 *
 * Body: { email: string }
 */
const inviteMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    const board = await Board.findById(req.params.id);

    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the board owner can invite members');
    }

    if (board.visibility !== 'collaborative') {
      throw new ApiError(400, 'Only collaborative boards can have multiple members');
    }

    // Look up the invitee by email
    const invitee = await User.findOne({ email: email.toLowerCase().trim() });
    if (!invitee) {
      throw new ApiError(404, 'No user found with that email address');
    }

    // Prevent duplicate membership
    if (board.hasMember(invitee._id)) {
      throw new ApiError(409, 'This user is already a member of the board');
    }

    board.members.push(invitee._id);
    await board.save();

    // Phase 10: notify the invitee
    await Notification.send({
      user: invitee._id,
      type: 'board_invitation',
      message: `${req.user.name} added you to the board "${board.title}"`,
      link: `/board/${board._id}`,
    });

    await Activity.log({
      board: board._id,
      action: 'member_invited',
      user: req.user._id,
      message: `invited ${invitee.name} to the board`,
    });

    const updated = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(200).json({
      success: true,
      message: `${invitee.name} has been added to the board`,
      board: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove a member from a board
 * @route   DELETE /api/boards/:id/members/:memberId
 * @access  Private (owner only; a member can also remove themselves)
 */
const removeMember = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    const isOwner = board.owner.toString() === req.user._id.toString();
    const isSelf = req.params.memberId === req.user._id.toString();

    if (!isOwner && !isSelf) {
      throw new ApiError(403, 'You are not authorised to remove this member');
    }

    // Prevent removing the owner from their own board
    if (req.params.memberId === board.owner.toString()) {
      throw new ApiError(400, 'The board owner cannot be removed from the board');
    }

    const removedMember = await User.findById(req.params.memberId).select('name');

    board.members = board.members.filter(
      (m) => m.toString() !== req.params.memberId
    );

    await board.save();

    await Activity.log({
      board: board._id,
      action: 'member_removed',
      user: req.user._id,
      message: `removed ${removedMember?.name || 'a member'} from the board`,
    });

    const updated = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      board: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    List all members of a board
 * @route   GET /api/boards/:id/members
 * @access  Private (members only)
 */
const getBoardMembers = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id).populate(
      'members',
      'name email avatar createdAt'
    );

    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    if (!board.hasMember(req.user._id)) {
      throw new ApiError(403, 'You do not have access to this board');
    }

    res.status(200).json({
      success: true,
      members: board.members,
      total: board.members.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  removeMember,
  getBoardMembers,
};
