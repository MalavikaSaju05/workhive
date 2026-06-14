import api from '../api/axios';

/**
 * Task service.
 * Wraps all task-related API calls. Consumed by BoardContext.
 */

/**
 * Fetch tasks for a board, with optional search & filters (Phase 9).
 * @param {string} boardId
 * @param {{ search?, status?, priority?, assignedTo?, dueBefore?, dueAfter? }} [params]
 */
export const getTasksRequest = async (boardId, params = {}) => {
  const res = await api.get(`/boards/${boardId}/tasks`, { params });
  return res.data;
};

/**
 * Create a new task in a column.
 * @param {string} boardId
 * @param {{ title, description?, column, priority?, dueDate?, assignedTo? }} taskData
 */
export const createTaskRequest = async (boardId, taskData) => {
  const res = await api.post(`/boards/${boardId}/tasks`, taskData);
  return res.data;
};

/**
 * Fetch a single task with comments and activity log.
 * @param {string} boardId
 * @param {string} taskId
 */
export const getTaskByIdRequest = async (boardId, taskId) => {
  const res = await api.get(`/boards/${boardId}/tasks/${taskId}`);
  return res.data;
};

/**
 * Update task fields (title, description, priority, due date, assignee, status).
 * @param {string} boardId
 * @param {string} taskId
 * @param {object} updates
 */
export const updateTaskRequest = async (boardId, taskId, updates) => {
  const res = await api.put(`/boards/${boardId}/tasks/${taskId}`, updates);
  return res.data;
};

/**
 * Delete a task.
 * @param {string} boardId
 * @param {string} taskId
 */
export const deleteTaskRequest = async (boardId, taskId) => {
  const res = await api.delete(`/boards/${boardId}/tasks/${taskId}`);
  return res.data;
};

/**
 * Move a task to a different column and/or position (Phase 5).
 * @param {string} boardId
 * @param {string} taskId
 * @param {{ column: string, position: number }} target
 */
export const moveTaskRequest = async (boardId, taskId, target) => {
  const res = await api.put(`/boards/${boardId}/tasks/${taskId}/move`, target);
  return res.data;
};

/**
 * Add a comment to a task (Phase 7).
 * @param {string} boardId
 * @param {string} taskId
 * @param {string} text
 */
export const addCommentRequest = async (boardId, taskId, text) => {
  const res = await api.post(`/boards/${boardId}/tasks/${taskId}/comments`, { text });
  return res.data;
};

/**
 * Edit a comment (author only).
 * @param {string} boardId
 * @param {string} taskId
 * @param {string} commentId
 * @param {string} text
 */
export const updateCommentRequest = async (boardId, taskId, commentId, text) => {
  const res = await api.put(
    `/boards/${boardId}/tasks/${taskId}/comments/${commentId}`,
    { text }
  );
  return res.data;
};

/**
 * Delete a comment (author only).
 * @param {string} boardId
 * @param {string} taskId
 * @param {string} commentId
 */
export const deleteCommentRequest = async (boardId, taskId, commentId) => {
  const res = await api.delete(`/boards/${boardId}/tasks/${taskId}/comments/${commentId}`);
  return res.data;
};
