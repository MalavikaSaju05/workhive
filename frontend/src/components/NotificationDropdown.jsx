import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
  deleteNotificationRequest,
} from '../services/notificationService';

const TYPE_ICONS = {
  task_assigned: '📌',
  new_comment: '💬',
  due_date_reminder: '⏰',
  board_invitation: '👥',
};

const POLL_INTERVAL_MS = 30 * 1000;

const formatTimestamp = (ts) => {
  const date = new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * NotificationDropdown (Phase 10)
 *
 * Bell icon in the navbar with an unread-count badge. Clicking it opens a
 * dropdown listing recent notifications. Polls the server every 30s for
 * new notifications.
 *
 * - Clicking a notification marks it as read and navigates to its `link`
 *   (if present), e.g. the relevant board.
 * - "Mark all as read" clears the unread badge.
 * - Each notification can be individually dismissed (deleted).
 */
const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsRequest({ limit: 20 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      /* fail silently — notifications are non-critical */
    }
  };

  // Initial load + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) fetchNotifications();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationReadRequest(notification._id);
      } catch {
        /* ignore */
      }
    }

    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsReadRequest();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const wasUnread = notifications.find((n) => n._id === id)?.isRead === false;
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await deleteNotificationRequest(id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-secondary/70 transition-colors hover:bg-accent hover:text-secondary"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-2xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-secondary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-secondary/40">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 ${
                    !n.isRead ? 'bg-accent/30' : ''
                  }`}
                >
                  <span className="mt-0.5 text-base">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.isRead ? 'font-medium text-secondary' : 'text-secondary/70'}`}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-secondary/40">{formatTimestamp(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  <button
                    onClick={(e) => handleDelete(e, n._id)}
                    className="flex-shrink-0 rounded p-0.5 text-secondary/30 transition-colors hover:text-secondary/60"
                    aria-label="Dismiss"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
