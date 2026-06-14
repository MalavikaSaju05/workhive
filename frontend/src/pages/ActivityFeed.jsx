import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, UserPlus, ArrowRight, Pencil, Trash2,
  MessageSquare, Flag, Calendar, ChevronLeft,
  RefreshCw, Filter, X,
} from 'lucide-react';
import { getBoardActivityFeedRequest } from '../services/activityService';
import { getBoardByIdRequest } from '../services/boardService';
import { formatDistanceToNow } from '../components/utils/dateUtils';

// ── Action display config (matches ActivityLog.jsx ACTION_CONFIG) ─────────────
const ACTION_CONFIG = {
  task_created:     { icon: Clock,          color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'created' },
  task_updated:     { icon: Pencil,         color: 'text-gray-500',    bg: 'bg-gray-50',    label: 'updated' },
  task_deleted:     { icon: Trash2,         color: 'text-red-500',     bg: 'bg-red-50',     label: 'archived' },
  task_assigned:    { icon: UserPlus,       color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'assigned' },
  task_moved:       { icon: ArrowRight,     color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'moved' },
  comment_added:    { icon: MessageSquare,  color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'commented on' },
  comment_edited:   { icon: Pencil,        color: 'text-gray-500',    bg: 'bg-gray-50',    label: 'edited comment on' },
  comment_deleted:  { icon: Trash2,        color: 'text-red-400',     bg: 'bg-red-50',     label: 'deleted comment on' },
  priority_changed: { icon: Flag,          color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'changed priority of' },
  due_date_changed: { icon: Calendar,      color: 'text-cyan-500',    bg: 'bg-cyan-50',    label: 'updated due date of' },
  status_changed:   { icon: ArrowRight,    color: 'text-indigo-500',  bg: 'bg-indigo-50',  label: 'changed status of' },
};

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'task_created',     label: 'Task created' },
  { value: 'task_updated',     label: 'Task updated' },
  { value: 'task_moved',       label: 'Task moved' },
  { value: 'comment_added',    label: 'Comment added' },
  { value: 'priority_changed', label: 'Priority changed' },
  { value: 'due_date_changed', label: 'Due date changed' },
  { value: 'task_assigned',    label: 'Task assigned' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const metaDetail = (action, meta) => {
  if (action === 'task_moved' && meta?.toColumnTitle)
    return `→ ${meta.toColumnTitle}`;
  if (action === 'priority_changed' && meta?.from && meta?.to)
    return `${PRIORITY_LABELS[meta.from] || meta.from} → ${PRIORITY_LABELS[meta.to] || meta.to}`;
  if (action === 'comment_added' && meta?.preview)
    return `"${meta.preview}${meta.preview.length >= 80 ? '…' : ''}"`;
  return null;
};

const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const avatarBg = (name = '') => {
  const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const FeedSkeleton = () => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-start gap-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-1.5 pt-1">
          <div className="h-3 w-2/3 rounded bg-gray-100" />
          <div className="h-2.5 w-1/3 rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

// ── Single feed entry ─────────────────────────────────────────────────────────
const FeedEntry = ({ entry }) => {
  const cfg    = ACTION_CONFIG[entry.action] || ACTION_CONFIG.task_updated;
  const Icon   = cfg.icon;
  const detail = metaDetail(entry.action, entry.meta);

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Action icon */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-secondary leading-snug">
          {/* User avatar + name */}
          {entry.user && (
            <span className="inline-flex items-center gap-1.5 mr-1">
              <span
                className={`h-5 w-5 inline-flex items-center justify-center rounded-full text-white text-[9px] font-semibold ${avatarBg(entry.user.name)}`}
              >
                {initials(entry.user.name)}
              </span>
              <span className="font-semibold">{entry.user.name}</span>
            </span>
          )}
          <span className="text-secondary/60">{cfg.label} </span>
          <span className="font-medium">"{entry.task?.title}"</span>
          {detail && (
            <span className="ml-1 text-secondary/40 italic text-xs">{detail}</span>
          )}
        </p>
        <p className="text-xs text-secondary/40 mt-0.5">
          {formatDistanceToNow(entry.timestamp)}
        </p>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

/**
 * ActivityFeed
 * Displays the aggregated activity timeline for a board.
 *
 * @route /board/:boardId/activity
 */
const ActivityFeed = () => {
  const { boardId } = useParams();
  const navigate    = useNavigate();

  const [board,   setBoard]   = useState(null);
  const [feed,    setFeed]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,   setError]   = useState('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  const LIMIT = 30;

  const fetchFeed = useCallback(
    async ({ replace = true, skip = 0 } = {}) => {
      replace ? setLoading(true) : setLoadingMore(true);
      setError('');
      try {
        const params = { limit: LIMIT, skip };
        if (actionFilter) params.action = actionFilter;
        if (memberFilter) params.userId = memberFilter;

        const data = await getBoardActivityFeedRequest(boardId, params);
        setFeed((prev) => replace ? data.feed : [...prev, ...data.feed]);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load activity feed');
      } finally {
        replace ? setLoading(false) : setLoadingMore(false);
      }
    },
    [boardId, actionFilter, memberFilter]
  );

  // Load board meta once
  useEffect(() => {
    getBoardByIdRequest(boardId)
      .then(({ board }) => setBoard(board))
      .catch(() => navigate('/dashboard'));
  }, [boardId, navigate]);

  // Reload feed on filter change
  useEffect(() => {
    fetchFeed({ replace: true, skip: 0 });
  }, [fetchFeed]);

  const loadMore = () =>
    fetchFeed({ replace: false, skip: feed.length });

  const clearFilters = () => {
    setActionFilter('');
    setMemberFilter('');
  };

  const hasActiveFilters = actionFilter || memberFilter;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/board/${boardId}`)}
              className="rounded-lg p-1.5 text-secondary/40 hover:bg-accent hover:text-primary transition-colors"
              title="Back to board"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-secondary">Activity Feed</h1>
              {board && (
                <p className="text-xs text-secondary/40">
                  <Link to={`/board/${boardId}`} className="hover:text-primary">
                    {board.title}
                  </Link>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchFeed({ replace: true, skip: 0 })}
            className="rounded-lg p-1.5 text-secondary/40 hover:bg-accent hover:text-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Action filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-secondary/40 flex-shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Member filter — only for collaborative boards */}
          {board?.visibility === 'collaborative' && board?.members?.length > 0 && (
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All members</option>
              {board.members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-secondary/60 hover:bg-gray-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}

          {!loading && (
            <span className="ml-auto text-xs text-secondary/40">
              {total} {total === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {/* ── Feed ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <FeedSkeleton />
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-secondary">No activity yet</p>
            <p className="mt-1 text-xs text-secondary/40">
              {hasActiveFilters
                ? 'Try clearing your filters to see all activity.'
                : 'Activity will appear here as work happens on the board.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-white shadow-sm border border-border divide-y divide-border px-4">
              {feed.map((entry) => (
                <FeedEntry key={`${entry._id}-${entry.timestamp}`} entry={entry} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-secondary/70 transition hover:bg-white hover:border-primary/30 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : `Load more (${total - feed.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ActivityFeed;
