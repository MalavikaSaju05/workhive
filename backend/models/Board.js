const mongoose = require('mongoose');

/**
 * Board Schema
 * Represents a single Kanban-style board inside WorkHive.
 *
 * A board is either:
 *  - "personal"       – owned and used by one user only
 *  - "collaborative"  – shared among multiple members
 *
 * Fields:
 *  - title:       Display name of the board (required)
 *  - description: Optional short description
 *  - owner:       The user who created the board (ref → User)
 *  - visibility:  "personal" | "collaborative"
 *  - members:     Array of user refs who have access (always includes owner)
 *  - coverColor:  Optional hex colour used as the board card background
 *  - isArchived:  Soft-delete flag so boards can be hidden without data loss
 *  - createdAt / updatedAt: Managed by Mongoose timestamps
 */
const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board must have an owner'],
    },

    visibility: {
      type: String,
      enum: {
        values: ['personal', 'collaborative'],
        message: 'Visibility must be either "personal" or "collaborative"',
      },
      default: 'personal',
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    coverColor: {
      type: String,
      default: '#2563EB', // primary blue
      match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color'],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Speed up fetching all boards for a given owner or member
boardSchema.index({ owner: 1 });
boardSchema.index({ members: 1 });

/**
 * Pre-save hook: ensure the owner is always included in the members array.
 * This simplifies authorization checks — any member lookup covers the owner.
 */
boardSchema.pre('save', function (next) {
  const ownerStr = this.owner.toString();
  const alreadyMember = this.members.some((m) => m.toString() === ownerStr);
  if (!alreadyMember) {
    this.members.push(this.owner);
  }
  next();
});

/**
 * Instance helper: check whether a given userId is a member of this board.
 * The owner always counts as a member. Handles both populated and
 * unpopulated `owner`/`members` fields — after `.populate()`, these hold
 * full User documents instead of bare ObjectIds, so we read `._id` when
 * present before calling `.toString()`.
 *
 * @param {string|ObjectId} userId
 * @returns {boolean}
 */
boardSchema.methods.hasMember = function (userId) {
  const idStr = userId.toString();

  const ownerId = (this.owner && this.owner._id) || this.owner;
  if (ownerId && ownerId.toString() === idStr) return true;

  return this.members.some((m) => {
    const memberId = (m && m._id) || m;
    return memberId && memberId.toString() === idStr;
  });
};

module.exports = mongoose.model('Board', boardSchema);
