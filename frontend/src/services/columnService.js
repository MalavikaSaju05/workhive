import api from '../api/axios';

/**
 * Column service.
 * Wraps all column-related API calls. Consumed by BoardContext.
 */

/**
 * Fetch all columns for a board, sorted by order.
 * @param {string} boardId
 */
export const getColumnsRequest = async (boardId) => {
  const res = await api.get(`/boards/${boardId}/columns`);
  return res.data;
};

/**
 * Create a new column on a board.
 * @param {string} boardId
 * @param {string} title
 */
export const createColumnRequest = async (boardId, title) => {
  const res = await api.post(`/boards/${boardId}/columns`, { title });
  return res.data;
};

/**
 * Rename a column.
 * @param {string} boardId
 * @param {string} columnId
 * @param {string} title
 */
export const updateColumnRequest = async (boardId, columnId, title) => {
  const res = await api.put(`/boards/${boardId}/columns/${columnId}`, { title });
  return res.data;
};

/**
 * Delete a column.
 * @param {string} boardId
 * @param {string} columnId
 */
export const deleteColumnRequest = async (boardId, columnId) => {
  const res = await api.delete(`/boards/${boardId}/columns/${columnId}`);
  return res.data;
};

/**
 * Persist a new column order after a drag-and-drop reorder.
 * @param {string} boardId
 * @param {string[]} orderedIds  – full array of column IDs in new order
 */
export const reorderColumnsRequest = async (boardId, orderedIds) => {
  const res = await api.put(`/boards/${boardId}/columns/reorder`, { orderedIds });
  return res.data;
};
