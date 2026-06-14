const mongoose = require('mongoose');

/**
 * Comment Subdocument (Phase 7)
 * Embedded inside Task. Each comment records the author, text, and
 * timestamps. Mongoose auto-generates an `_id` for each comment so
 * individual comments can be edited/deleted by reference.
 */
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

/**
 * Activity Log Subdocument (Phase 8)
 * Embedded inside Task. Records significant events for the task's
 * activity timeline, shown in the Task Details Modal.
 */
const activityLogSchema = new mongoose.Schema(
  {
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
  { _id: false }
);

/**
 * Task Schema (Phase 4)
 *
 * Fields:
 *  - board:    parent board (denormalized for fast board-wide queries/filters)
 *  - column:   the column this task currently belongs to
 *  - position: zero-based order within the column (used for drag & drop, Phase 5)
 *  - status:   'todo' | 'in_progress' | 'done' — kept independent of the
 *              column's title so analytics (Phase 11) remain stable even if
 *              column titles are renamed
 *  - comments / activityLog: embedded arrays for fast reads without joins
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    column: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    comments: [commentSchema],
    activityLog: [activityLogSchema],
  },
  {
    timestamps: true,
  }
);

// Helps fetch a column's tasks sorted by position, and board-wide queries
taskSchema.index({ column: 1, position: 1 });
taskSchema.index({ board: 1, status: 1 });
taskSchema.index({ board: 1, assignedTo: 1 });
taskSchema.index({ board: 1, priority: 1 });
// Text index supports Phase 9 search across title/description
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
