/**
 * Lightweight date helpers — no external library dependency.
 */

/**
 * formatDistanceToNow
 * Returns a human-readable relative time string.
 * e.g. "just now", "5 minutes ago", "2 days ago"
 */
export const formatDistanceToNow = (date) => {
  if (!date) return '';
  const now  = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60)      return 'just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * formatDate
 * Returns a formatted date string.
 * e.g. "Jun 11, 2026"
 */
export const formatDate = (date, opts = {}) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...opts,
  });
};

/**
 * isOverdue
 * Returns true if the date is in the past (not today).
 */
export const isOverdue = (date) => {
  if (!date) return false;
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d < new Date();
};

/**
 * toInputDate
 * Converts a date to the format required by <input type="date">
 */
export const toInputDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};