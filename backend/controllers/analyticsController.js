const mongoose = require('mongoose');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Board = require('../models/Board');
const { ApiError } = require('../middleware/errorMiddleware');

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

/**
 * @desc    Get analytics for a board: summary stats, tasks by status,
 *          tasks by priority, weekly productivity, and team activity.
 * @route   GET /api/boards/:id/analytics
 * @access  Private (board members)
 *
 * Response:
 * {
 *   "success": true,
 *   "stats": {
 *     "totalTasks": 12,
 *     "completedTasks": 5,
 *     "pendingTasks": 7,
 *     "overdueTasks": 2,
 *     "completionRate": 42
 *   },
 *   "tasksByStatus": [ { "status": "todo", "label": "To Do", "count": 4 }, ... ],
 *   "tasksByPriority": [ { "priority": "Low", "count": 3 }, ... ],
 *   "weeklyProductivity": [ { "date": "2026-06-07", "label": "Sun", "completed": 2 }, ... ],
 *   "teamActivity": [ { "user": { "_id", "name", "avatar" }, "count": 14 }, ... ]
 * }
 */
const getBoardAnalytics = async (req, res, next) => {
  try {
    const { id: boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) throw new ApiError(404, 'Board not found');
    if (!board.hasMember(req.user._id)) {
      throw new ApiError(403, 'You do not have access to this board');
    }

    const boardObjectId = new mongoose.Types.ObjectId(boardId);
    const now = new Date();

    // ── Summary stats ──────────────────────────────────────────────────────
    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ board: boardId }),
      Task.countDocuments({ board: boardId, status: 'done' }),
      Task.countDocuments({
        board: boardId,
        status: { $ne: 'done' },
        dueDate: { $ne: null, $lt: now },
      }),
    ]);

    const pendingTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // ── Tasks by status ───────────────────────────────────────────────────
    const statusAgg = await Task.aggregate([
      { $match: { board: boardObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));
    const tasksByStatus = STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: statusCounts[status] || 0,
    }));

    // ── Tasks by priority ─────────────────────────────────────────────────
    const priorityAgg = await Task.aggregate([
      { $match: { board: boardObjectId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const priorityCounts = Object.fromEntries(priorityAgg.map((p) => [p._id, p.count]));
    const tasksByPriority = PRIORITIES.map((priority) => ({
      priority,
      count: priorityCounts[priority] || 0,
    }));

    // ── Weekly productivity (tasks marked done in the last 7 days) ─────────
    // Approximated using `updatedAt` on tasks whose current status is "done".
    // This works well for typical boards where completion is the final edit.
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today => 7 days total
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const productivityAgg = await Task.aggregate([
      {
        $match: {
          board: boardObjectId,
          status: 'done',
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          completed: { $sum: 1 },
        },
      },
    ]);
    const productivityMap = Object.fromEntries(
      productivityAgg.map((p) => [p._id, p.completed])
    );

    const weeklyProductivity = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(sevenDaysAgo);
      day.setDate(day.getDate() + i);
      const dateKey = day.toISOString().slice(0, 10);
      weeklyProductivity.push({
        date: dateKey,
        label: day.toLocaleDateString(undefined, { weekday: 'short' }),
        completed: productivityMap[dateKey] || 0,
      });
    }

    // ── Team activity (event count per user, last 30 days) ──────────────────
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityAgg = await Activity.aggregate([
      { $match: { board: boardObjectId, timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          count: 1,
          user: { _id: '$user._id', name: '$user.name', avatar: '$user.avatar' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
      },
      tasksByStatus,
      tasksByPriority,
      weeklyProductivity,
      teamActivity: activityAgg,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBoardAnalytics };
