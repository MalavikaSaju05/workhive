const Notification = require('../models/Notification');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get the current user's notifications, most recent first
 * @route   GET /api/notifications
 * @access  Private
 *
 * Query params:
 *  - limit: max number of entries to return (default 30, max 100)
 *  - unreadOnly: 'true' to return only unread notifications
 *
 * Response:
 * {
 *   "success": true,
 *   "unreadCount": 3,
 *   "notifications": [ { "_id", "type", "message", "link", "isRead", "createdAt" } ]
 * }
 */
const getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const filter = { user: req.user._id };
    if (req.query.unreadOnly === 'true') filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (recipient only)
 *
 * Response:
 * { "success": true, "notification": { ... } }
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }
    if (notification.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You do not have access to this notification');
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark all of the current user's notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 *
 * Response:
 * { "success": true, "message": "All notifications marked as read" }
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (recipient only)
 *
 * Response:
 * { "success": true, "message": "Notification deleted" }
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }
    if (notification.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You do not have access to this notification');
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
