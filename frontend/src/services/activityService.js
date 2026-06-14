import api from '../api/axios';

/**
 * Activity service (Phase 8).
 * Fetches the board-wide activity timeline.
 */

/**
 * Fetch the activity timeline for a board, most recent first.
 * @param {string} boardId
 * @param {number} [limit=50]
 */
export const getBoardActivityRequest = async (boardId, limit = 50) => {
  const res = await api.get(`/boards/${boardId}/activity`, { params: { limit } });
  return res.data;
};
