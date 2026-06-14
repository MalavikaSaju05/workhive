const mongoose = require('mongoose');

/**
 * Activity Schema (Phase 8)
 *
 * Board-level activity feed. While each Task also keeps its own embedded
 * activityLog (for the Task Details Modal), this collection powers a
 * board-wide "Activity" timeline that includes events which aren't tied to
 * a single task — most notably member invitations — alongside task events.
 *
 * Fields:
 *  - board:     the board this activity belongs to
 *  - task:      optional reference to the related task (null for board-level
 *               events such as member invitations)
 *  - action:    type of event (see enum)
 *  - user:      the user who performed the action
 *  - message:   human-readable summary, e.g. "created the task \"Design login page\""
 *  - timestamp: when the event occurred
 */
const activitySchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'task_created',
        'task_updated',
        'task_deleted',
        'task_assigned',
        'task_moved',
        'comment_added',
        'comment_updated',
        'comment_deleted',
        'member_invited',
        'member_removed',
        'column_created',
        'column_updated',
        'column_deleted',
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

activitySchema.index({ board: 1, timestamp: -1 });

/**
 * Convenience static for logging an activity entry without repeating
 * boilerplate across controllers. Failures are swallowed (logged to
 * console) so that activity logging never breaks the primary request.
 */
activitySchema.statics.log = async function ({ board, task = null, action, user, message = '' }) {
  try {
    await this.create({ board, task, action, user, message });
  } catch (err) {
    console.error('Failed to record activity:', err.message);
  }
};

module.exports = mongoose.model('Activity', activitySchema);
