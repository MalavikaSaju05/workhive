const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// @route   GET /api/notifications
// @desc    Get the current user's notifications (most recent first)
//          Query: ?limit=30&unreadOnly=true
// @access  Private
router.get('/', getNotifications);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
// NOTE: must be defined BEFORE /:id/read to avoid Express treating
//       "read-all" as a dynamic :id segment.
router.put('/read-all', markAllAsRead);

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private (recipient only)
router.put('/:id/read', markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private (recipient only)
router.delete('/:id', deleteNotification);

module.exports = router;
