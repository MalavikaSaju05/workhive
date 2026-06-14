const mongoose = require('mongoose');

/**
 * Notification Schema (Phase 10)
 *
 * Per-user notification feed. Created whenever an event happens that the
 * recipient should be informed about (task assigned, new comment, due date
 * reminder, board invitation).
 *
 * Fields:
 *  - user:    the recipient of the notification
 *  - type:    short machine-readable category (see enum)
 *  - message: human-readable text shown in the notification dropdown
 *  - link:    optional frontend route to navigate to when clicked
 *             (e.g. "/board/<boardId>")
 *  - isRead:  whether the recipient has seen/dismissed this notification
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['task_assigned', 'new_comment', 'due_date_reminder', 'board_invitation'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Fetch a user's notifications, most recent first; quickly count unread
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

/**
 * Convenience static for creating a notification without repeating
 * boilerplate across controllers. Failures are logged but never break
 * the primary request (notifications are a side effect).
 */
notificationSchema.statics.send = async function ({ user, type, message, link = '' }) {
  try {
    // Avoid notifying users about their own actions
    return await this.create({ user, type, message, link });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
