import api from '../api/axios';

/**
 * Notification service (Phase 10).
 * Wraps all notification-related API calls.
 */

/**
 * Fetch the current user's notifications.
 * @param {{ limit?: number, unreadOnly?: boolean }} [params]
 * @returns {Promise<{ unreadCount: number, notifications: object[] }>}
 */
export const getNotificationsRequest = async (params = {}) => {
  const res = await api.get('/notifications', { params });
  return res.data;
};

/**
 * Mark a single notification as read.
 * @param {string} id
 */
export const markNotificationReadRequest = async (id) => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
};

/**
 * Mark all of the current user's notifications as read.
 */
export const markAllNotificationsReadRequest = async () => {
  const res = await api.put('/notifications/read-all');
  return res.data;
};

/**
 * Delete a notification.
 * @param {string} id
 */
export const deleteNotificationRequest = async (id) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};
