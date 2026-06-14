import { createContext, useState, useContext, useCallback } from 'react';
import {
  getTasksByBoardRequest,
  getTaskByIdRequest,
  createTaskRequest,
  updateTaskRequest,
  deleteTaskRequest,
  moveTaskRequest,
  reorderTasksRequest,
} from '../services/taskService';

/**
 * TaskContext
 * Centralises all task state for the active board.
 *
 * Shape:
 *  tasksByColumn  – { [columnId]: Task[] }  ordered by position, used by BoardView
 *  activeTask     – Task | null             the task open in the detail modal
 *  loading        – boolean
 *  error          – string | null
 *
 * The context owns the single source of truth for task order.
 * All drag-and-drop handlers apply optimistic updates here so the UI
 * never lags, then call the API to persist; on failure they roll back.
 */
const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasksByColumn, setTasksByColumn] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Helper ───────────────────────────────────────────────────────────────
  const withLoading = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch ────────────────────────────────────────────────────────────────

  /**
   * Load all tasks for a board and populate tasksByColumn.
   * Called every time BoardView mounts (alongside fetchBoardById in BoardContext).
   * @param {string} boardId
   */
  const fetchTasksByBoard = useCallback(async (boardId) => {
    return withLoading(async () => {
      const data = await getTasksByBoardRequest(boardId);
      setTasksByColumn(data.tasksByColumn || {});
      return data;
    });
  }, []);

  /**
   * Load full task detail (comments, activity log) into activeTask.
   * @param {string} boardId
   * @param {string} taskId
   */
  const fetchTaskById = useCallback(async (boardId, taskId) => {
    return withLoading(async () => {
      const data = await getTaskByIdRequest(boardId, taskId);
      setActiveTask(data.task);
      return data.task;
    });
  }, []);

  // ── Create ───────────────────────────────────────────────────────────────

  /**
   * Create a task and append it to the correct column bucket optimistically.
   * @param {string} boardId
   * @param {{ title, columnId, description?, priority?, dueDate?, assignedTo? }} formData
   */
  const createTask = async (boardId, formData) => {
    return withLoading(async () => {
      const data = await createTaskRequest(boardId, formData);
      const task = data.task;
      setTasksByColumn((prev) => ({
        ...prev,
        [task.column]: [...(prev[task.column] || []), task],
      }));
      return task;
    });
  };

  // ── Update ───────────────────────────────────────────────────────────────

  /**
   * Update task metadata and refresh both the column bucket and activeTask.
   * @param {string} boardId
   * @param {string} taskId
   * @param {object} updates
   */
  const updateTask = async (boardId, taskId, updates) => {
    return withLoading(async () => {
      const data = await updateTaskRequest(boardId, taskId, updates);
      const updated = data.task;

      setTasksByColumn((prev) => {
        const columnId = updated.column.toString?.() ?? updated.column;
        return {
          ...prev,
          [columnId]: (prev[columnId] || []).map((t) =>
            t._id === taskId ? updated : t
          ),
        };
      });

      if (activeTask?._id === taskId) setActiveTask(updated);
      return updated;
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  /**
   * Archive a task and remove it from the column bucket.
   * @param {string} boardId
   * @param {string} taskId
   * @param {string} columnId  – needed to locate the bucket
   */
  const deleteTask = async (boardId, taskId, columnId) => {
    return withLoading(async () => {
      await deleteTaskRequest(boardId, taskId);
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || []).filter((t) => t._id !== taskId),
      }));
      if (activeTask?._id === taskId) setActiveTask(null);
    });
  };

  // ── Phase 5: Drag-and-drop ────────────────────────────────────────────────

  /**
   * Handle a @hello-pangea/dnd `onDragEnd` result.
   *
   * This is the single entry point for ALL drag events (same-column and
   * cross-column). It:
   *  1. Applies an optimistic state update so the board re-renders instantly
   *  2. Calls the backend to persist the new order
   *  3. Rolls back on API failure
   *
   * @param {object} result   – the raw DropResult from @hello-pangea/dnd
   * @param {string} boardId
   */
  const handleDragEnd = async (result, boardId) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any column — do nothing
    if (!destination) return;

    // Dropped back in the same spot — do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const isSameColumn = sourceColId === destColId;

    // ── Build optimistic state ─────────────────────────────────────────────
    const prev = tasksByColumn;
    const sourceItems = [...(prev[sourceColId] || [])];
    const destItems = isSameColumn ? sourceItems : [...(prev[destColId] || [])];

    // Remove from source
    const [movedTask] = sourceItems.splice(source.index, 1);

    // Insert at destination
    if (isSameColumn) {
      sourceItems.splice(destination.index, 0, movedTask);
    } else {
      destItems.splice(destination.index, 0, { ...movedTask, column: destColId });
    }

    // Apply optimistic update immediately
    setTasksByColumn((p) => ({
      ...p,
      [sourceColId]: sourceItems,
      [destColId]: isSameColumn ? sourceItems : destItems,
    }));

    // ── Persist to backend ─────────────────────────────────────────────────
    try {
      if (isSameColumn) {
        await reorderTasksRequest(
          boardId,
          sourceColId,
          sourceItems.map((t) => t._id)
        );
      } else {
        await moveTaskRequest(boardId, draggableId, {
          destinationColumnId: destColId,
          orderedTaskIds: destItems.map((t) => t._id),
        });
      }
    } catch {
      // Roll back: restore previous state
      setTasksByColumn(prev);
    }
  };

  // ── Expose a way to clear tasks when navigating away ─────────────────────
  const clearTasks = () => {
    setTasksByColumn({});
    setActiveTask(null);
    setError(null);
  };

  const value = {
    // State
    tasksByColumn,
    activeTask,
    loading,
    error,
    // Actions
    fetchTasksByBoard,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    handleDragEnd,
    clearTasks,
    // Direct setters
    setActiveTask,
    setTasksByColumn,
    setError,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

/**
 * Convenience hook for consuming TaskContext.
 * @throws if used outside TaskProvider
 */
export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within a TaskProvider');
  return ctx;
};

export default TaskContext;
