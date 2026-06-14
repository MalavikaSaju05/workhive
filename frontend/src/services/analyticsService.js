import api from '../api/axios';

/**
 * Analytics service (Phase 11).
 * Fetches aggregated stats and chart data for a board.
 */

/**
 * Fetch analytics for a board: summary stats, tasks by status/priority,
 * weekly productivity, and team activity.
 * @param {string} boardId
 */
export const getBoardAnalyticsRequest = async (boardId) => {
  const res = await api.get(`/boards/${boardId}/analytics`);
  return res.data;
};
