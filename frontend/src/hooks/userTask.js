import { useState, useCallback } from 'react';
import * as taskApi from '../api/taskApi';

/**
 * useTask
 * Centralises all task CRUD state for a board.
 * Components receive tasks, loading state, and action functions.
 * Optimistic updates are applied for move operations (drag-and-drop)
 * to keep the UI snappy, then confirmed/rolled back based on the API response.
 *
 * @param {Function} showToast - toast notification function from parent context
 */
export const useTask = (showToast) => {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  // ─── Fetch all tasks for a board ──────────────────────────────────────────
  const fetchTasks = useCallback(async (boardId) => {
    setLoading(true);
    try {
      const { data } = await taskApi.getTasksByBoard(boardId);
      setTasks(data.tasks);
    } catch (err) {
      showToast?.('Failed to load tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ─── Create ───────────────────────────────────────────────────────────────
  const createTask = useCallback(async (payload) => {
    try {
      const { data } = await taskApi.createTask(payload);
      setTasks((prev) => [...prev, data.task]);
      showToast?.('Task created.', 'success');
      return { success: true, task: data.task };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create task.';
      showToast?.(msg, 'error');
      return { success: false };
    }
  }, [showToast]);

  // ─── Update ───────────────────────────────────────────────────────────────
  const updateTask = useCallback(async (id, payload) => {
    try {
      const { data } = await taskApi.updateTask(id, payload);
      setTasks((prev) => prev.map((t) => t._id === id ? data.task : t));
      showToast?.('Task updated.', 'success');
      return { success: true, task: data.task };
    } catch (err) {
      showToast?.('Failed to update task.', 'error');
      return { success: false };
    }
  }, [showToast]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (id) => {
    try {
      await taskApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      showToast?.('Task deleted.', 'success');
      return { success: true };
    } catch (err) {
      showToast?.('Failed to delete task.', 'error');
      return { success: false };
    }
  }, [showToast]);

  // ─── Move (optimistic) ────────────────────────────────────────────────────
  const moveTask = useCallback(async (taskId, columnId, newIndex, optimisticTasks) => {
    // Apply optimistic update immediately
    setTasks(optimisticTasks);
    try {
      await taskApi.moveTask(taskId, { columnId, position: newIndex });
    } catch (err) {
      // Rollback on failure
      showToast?.('Failed to save task position.', 'error');
    }
  }, [showToast]);

  // ─── Assign ───────────────────────────────────────────────────────────────
  const assignTask = useCallback(async (taskId, userId) => {
    try {
      const { data } = await taskApi.assignTask(taskId, userId);
      setTasks((prev) => prev.map((t) => t._id === taskId ? data.task : t));
      showToast?.(userId ? 'Task assigned.' : 'Assignee removed.', 'success');
      return { success: true, task: data.task };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign task.';
      showToast?.(msg, 'error');
      return { success: false };
    }
  }, [showToast]);

  // ─── Comments ─────────────────────────────────────────────────────────────
  const addComment = useCallback(async (taskId, text) => {
    try {
      const { data } = await taskApi.addComment(taskId, text);
      // Append comment to matching task in local state
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, comments: [...(t.comments || []), data.comment] }
            : t
        )
      );
      return { success: true, comment: data.comment };
    } catch (err) {
      showToast?.('Failed to add comment.', 'error');
      return { success: false };
    }
  }, [showToast]);

  const editComment = useCallback(async (taskId, commentId, text) => {
    try {
      const { data } = await taskApi.editComment(taskId, commentId, text);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? {
                ...t,
                comments: t.comments.map((c) =>
                  c._id === commentId ? data.comment : c
                ),
              }
            : t
        )
      );
      return { success: true, comment: data.comment };
    } catch (err) {
      showToast?.('Failed to edit comment.', 'error');
      return { success: false };
    }
  }, [showToast]);

  const deleteComment = useCallback(async (taskId, commentId) => {
    try {
      await taskApi.deleteComment(taskId, commentId);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, comments: t.comments.filter((c) => c._id !== commentId) }
            : t
        )
      );
      showToast?.('Comment deleted.', 'success');
      return { success: true };
    } catch (err) {
      showToast?.('Failed to delete comment.', 'error');
      return { success: false };
    }
  }, [showToast]);

  return {
    tasks,
    setTasks,
    loading,
    taskLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    addComment,
    editComment,
    deleteComment,
  };
};