const Activity = require('../models/Activity');
const Board = require('../models/Board');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get the activity timeline for a board (most recent first)
 * @route   GET /api/boards/:boardId/activity
 * @access  Private (board members)
 *
 * Query params:
 *  - limit: max number of entries to return (default 50, max 200)
 *
 * Response:
 * {
 *   "success": true,
 *   "activities": [
 *     {
 *       "_id": "...",
 *       "action": "task_created",
 *       "user": { "_id": "...", "name": "...", "avatar": "" },
 *       "task": "<taskId>" | null,
 *       "message": "created the task \"Design login page\"",
 *       "timestamp": "2026-06-12T10:00:00.000Z"
 *     }
 *   ]
 * }
 */
const getBoardActivity = async (req, res, next) => {
  try {
    const { id: boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) throw new ApiError(404, 'Board not found');
    if (!board.hasMember(req.user._id)) {
      throw new ApiError(403, 'You do not have access to this board');
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const activities = await Activity.find({ board: boardId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      activities,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBoardActivity };
