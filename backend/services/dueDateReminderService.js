const Task = require('../models/Task');
const Notification = require('../models/Notification');

/**
 * Due Date Reminder Job (Phase 10)
 *
 * Periodically scans for tasks that are due within the next 24 hours
 * (and not yet done) and sends a `due_date_reminder` notification to the
 * assignee (or the creator, if unassigned) — but only once per task, by
 * checking for an existing reminder notification first.
 *
 * This runs as a simple `setInterval` rather than a full cron library to
 * keep the dependency footprint small; for production, consider
 * node-cron or an external scheduler.
 */
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // run hourly

const checkDueDateReminders = async () => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const dueSoonTasks = await Task.find({
      status: { $ne: 'done' },
      dueDate: { $gte: now, $lte: windowEnd },
    });

    for (const task of dueSoonTasks) {
      const recipient = task.assignedTo || task.createdBy;
      if (!recipient) continue;

      // Avoid duplicate reminders: skip if one already exists for this task
      const existing = await Notification.findOne({
        user: recipient,
        type: 'due_date_reminder',
        link: `/board/${task.board}`,
        message: { $regex: escapeRegExp(task.title) },
      });
      if (existing) continue;

      await Notification.send({
        user: recipient,
        type: 'due_date_reminder',
        message: `"${task.title}" is due soon`,
        link: `/board/${task.board}`,
      });
    }
  } catch (err) {
    console.error('Due date reminder job failed:', err.message);
  }
};

/**
 * Escapes special regex characters in a string so it can be safely used
 * inside a MongoDB $regex filter.
 */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Starts the recurring due-date reminder check. Call once on server startup.
 */
const startDueDateReminderJob = () => {
  // Run once shortly after startup, then on the regular interval
  setTimeout(checkDueDateReminders, 10 * 1000);
  setInterval(checkDueDateReminders, CHECK_INTERVAL_MS);
};

module.exports = { startDueDateReminderJob, checkDueDateReminders };
