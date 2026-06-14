import axiosInstance from './axios';

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const createTask       = (data)                  => axiosInstance.post('/tasks', data);
export const getTasksByBoard  = (boardId)               => axiosInstance.get(`/tasks/board/${boardId}`);
export const getMyAssignedTasks = (params = {})         => axiosInstance.get('/tasks/assigned', { params });
export const getTaskById      = (id)                    => axiosInstance.get(`/tasks/${id}`);
export const updateTask       = (id, data)              => axiosInstance.patch(`/tasks/${id}`, data);
export const deleteTask       = (id)                    => axiosInstance.delete(`/tasks/${id}`);
export const moveTask         = (id, data)              => axiosInstance.patch(`/tasks/${id}/move`, data);
export const assignTask       = (id, userId)            => axiosInstance.patch(`/tasks/${id}/assign`, { userId });

// ─── Comments ─────────────────────────────────────────────────────────────────
export const addComment       = (taskId, text)          => axiosInstance.post(`/tasks/${taskId}/comments`, { text });
export const editComment      = (taskId, commentId, text) => axiosInstance.patch(`/tasks/${taskId}/comments/${commentId}`, { text });
export const deleteComment    = (taskId, commentId)     => axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}`);