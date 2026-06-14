const mongoose = require('mongoose');

/**
 * Column Schema
 * Represents a status column within a Board (e.g. "To Do", "In Progress", "Done").
 *
 * Columns are ordered via the `order` field (0-based integer).
 * When a column is deleted, tasks that belong to it should either be
 * moved or removed — that logic lives in the column controller.
 *
 * Fields:
 *  - title:  Column heading (required)
 *  - board:  Parent board reference (required)
 *  - order:  Zero-based position index used for rendering columns left→right
 *  - createdAt / updatedAt: Managed by Mongoose timestamps
 */
const columnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Column title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [60, 'Column title cannot exceed 60 characters'],
    },

    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Column must belong to a board'],
    },

    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// All columns for a board are fetched together and sorted by order
columnSchema.index({ board: 1, order: 1 });

module.exports = mongoose.model('Column', columnSchema);
