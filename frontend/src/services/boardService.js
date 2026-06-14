import api from '../api/axios';

/**
 * Board service.
 * Wraps all board-related API calls. Consumed by BoardContext and
 * individual board components — components never call axios directly.
 */

/**
 * Create a new board.
 * @param {{ title: string, description?: string, visibility?: string, coverColor?: string }} data
 */
export const createBoardRequest = async (data) => {
  const res = await api.post('/boards', data);
  return res.data;
};

/**
 * Fetch all boards for the authenticated user.
 * Returns { personalBoards, collaborativeBoards }.
 * @param {{ archived?: boolean }} params
 */
export const getBoardsRequest = async (params = {}) => {
  const res = await api.get('/boards', { params });
  return res.data;
};

/**
 * Fetch a single board by ID (includes its columns).
 * @param {string} boardId
 */
export const getBoardByIdRequest = async (boardId) => {
  const res = await api.get(`/boards/${boardId}`);
  return res.data;
};

/**
 * Update board metadata.
 * @param {string} boardId
 * @param {{ title?: string, description?: string, visibility?: string, coverColor?: string }} data
 */
export const updateBoardRequest = async (boardId, data) => {
  const res = await api.put(`/boards/${boardId}`, data);
  return res.data;
};

/**
 * Archive (soft-delete) or permanently delete a board.
 * @param {string} boardId
 * @param {{ permanent?: boolean }} options
 */
export const deleteBoardRequest = async (boardId, { permanent = false } = {}) => {
  const res = await api.delete(`/boards/${boardId}`, {
    params: permanent ? { permanent: 'true' } : {},
  });
  return res.data;
};

/**
 * Invite a user to a board by email.
 * @param {string} boardId
 * @param {string} email
 */
export const inviteMemberRequest = async (boardId, email) => {
  const res = await api.post(`/boards/${boardId}/invite`, { email });
  return res.data;
};

/**
 * Remove a member from a board.
 * @param {string} boardId
 * @param {string} memberId
 */
export const removeMemberRequest = async (boardId, memberId) => {
  const res = await api.delete(`/boards/${boardId}/members/${memberId}`);
  return res.data;
};

/**
 * List all members of a board.
 * @param {string} boardId
 */
export const getBoardMembersRequest = async (boardId) => {
  const res = await api.get(`/boards/${boardId}/members`);
  return res.data;
};
