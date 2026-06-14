import { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import {
  createBoardRequest,
  getBoardsRequest,
  getBoardByIdRequest,
  updateBoardRequest,
  deleteBoardRequest,
  inviteMemberRequest,
  removeMemberRequest,
} from '../services/boardService';
import {
  createColumnRequest,
  updateColumnRequest,
  deleteColumnRequest,
  reorderColumnsRequest,
} from '../services/columnService';
import {
  getTasksRequest,
  createTaskRequest,
  updateTaskRequest as updateTaskApi,
  deleteTaskRequest as deleteTaskApi,
  moveTaskRequest as moveTaskApi,
  addCommentRequest,
  updateCommentRequest,
  deleteCommentRequest,
} from '../services/taskService';
import { getBoardActivityRequest } from '../services/activityService';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

/**
 * BoardContext centralises all board, column, task, and activity state.
 *
 * Shape:
 *  - personalBoards / collaborativeBoards  dashboard lists
 *  - activeBoard          the board currently open in BoardView
 *  - columns              ordered columns array for the active board
 *  - tasksByColumn         { [columnId]: Task[] } — sorted by position (Phase 4/5)
 *  - searchFilters         { search, status, priority, assignedTo } (Phase 9)
 *  - activities            board-wide activity timeline (Phase 8)
 *  - loading / error
 */
const BoardContext = createContext(null);

const DEFAULT_FILTERS = { search: '', status: '', priority: '', assignedTo: '' };

export const BoardProvider = ({ children }) => {
  const [personalBoards, setPersonalBoards] = useState([]);
  const [collaborativeBoards, setCollaborativeBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasksByColumn, setTasksByColumn] = useState({});
  const [searchFilters, setSearchFilters] = useState(DEFAULT_FILTERS);
  const [activities, setActivities] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user: currentUser } = useAuth();
  const activeBoardIdRef = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

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

  /**
   * Group a flat task list by column ID, sorted by position within each group.
   */
  const groupTasksByColumn = (tasks) => {
    const grouped = {};
    [...tasks]
      .sort((a, b) => a.position - b.position)
      .forEach((task) => {
        const colId = task.column;
        if (!grouped[colId]) grouped[colId] = [];
        grouped[colId].push(task);
      });
    return grouped;
  };

  /**
   * Maps a column title to a task status value, mirroring the backend's
   * statusFromColumnTitle(). Used to keep a task's `status` field in sync
   * with its column when it's dragged to a different column (Phase 5),
   * so the Task Details modal shows the correct status without a refetch.
   *
   * @param {string} title
   * @returns {'todo'|'in_progress'|'done'}
   */
  const statusFromColumnTitle = (title = '') => {
    const normalized = title.trim().toLowerCase();
    if (normalized === 'done') return 'done';
    if (normalized === 'in progress') return 'in_progress';
    return 'todo';
  };

  // ── Board Actions ────────────────────────────────────────────────────────────

  const fetchBoards = useCallback(async () => {
    return withLoading(async () => {
      const data = await getBoardsRequest();
      setPersonalBoards(data.personalBoards);
      setCollaborativeBoards(data.collaborativeBoards);
    });
  }, []);

  /**
   * Load a single board, its columns, and its tasks (grouped by column).
   * @param {string} boardId
   */
  const fetchBoardById = useCallback(async (boardId) => {
    return withLoading(async () => {
      const data = await getBoardByIdRequest(boardId);
      setActiveBoard(data.board);
      setColumns(data.columns);

      const taskData = await getTasksRequest(boardId);
      setTasksByColumn(groupTasksByColumn(taskData.tasks));

      // Phase 12: switch real-time rooms — leave the previous board (if any)
      // and join this one so we receive live updates from other members.
      const socket = getSocket();
      if (socket) {
        if (activeBoardIdRef.current && activeBoardIdRef.current !== boardId) {
          socket.emit('board:leave', { boardId: activeBoardIdRef.current });
        }
        socket.emit('board:join', { boardId });
      }
      activeBoardIdRef.current = boardId;
      setOnlineUsers([]);

      return data;
    });
  }, []);

  /**
   * Re-fetch tasks for the active board using the current search filters
   * (Phase 9). Does not toggle the global loading state so the board stays
   * interactive while typing in the search box.
   */
  const fetchTasks = useCallback(async (boardId, filters = searchFilters) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.assignedTo) params.assignedTo = filters.assignedTo;

    try {
      const data = await getTasksRequest(boardId, params);
      setTasksByColumn(groupTasksByColumn(data.tasks));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    }
  }, [searchFilters]);

  /**
   * Update search/filter state and immediately refetch tasks (Phase 9).
   * @param {string} boardId
   * @param {object} updates  – partial filters to merge
   */
  const updateSearchFilters = async (boardId, updates) => {
    const next = { ...searchFilters, ...updates };
    setSearchFilters(next);
    await fetchTasks(boardId, next);
  };

  const clearSearchFilters = async (boardId) => {
    setSearchFilters(DEFAULT_FILTERS);
    await fetchTasks(boardId, DEFAULT_FILTERS);
  };

  const createBoard = async (formData) => {
    return withLoading(async () => {
      const data = await createBoardRequest(formData);
      const board = data.board;
      if (board.visibility === 'personal') {
        setPersonalBoards((prev) => [board, ...prev]);
      } else {
        setCollaborativeBoards((prev) => [board, ...prev]);
      }
      return board;
    });
  };

  const updateBoard = async (boardId, updates) => {
    return withLoading(async () => {
      const data = await updateBoardRequest(boardId, updates);
      const updated = data.board;
      const updateList = (list) => list.map((b) => (b._id === boardId ? updated : b));
      setPersonalBoards(updateList);
      setCollaborativeBoards(updateList);
      if (activeBoard?._id === boardId) setActiveBoard(updated);
      return updated;
    });
  };

  const deleteBoard = async (boardId) => {
    return withLoading(async () => {
      await deleteBoardRequest(boardId);
      setPersonalBoards((prev) => prev.filter((b) => b._id !== boardId));
      setCollaborativeBoards((prev) => prev.filter((b) => b._id !== boardId));
      if (activeBoard?._id === boardId) setActiveBoard(null);
    });
  };

  // ── Member Actions ───────────────────────────────────────────────────────────

  const inviteMember = async (boardId, email) => {
    return withLoading(async () => {
      const data = await inviteMemberRequest(boardId, email);
      if (activeBoard?._id === boardId) setActiveBoard(data.board);
      return data;
    });
  };

  const removeMember = async (boardId, memberId) => {
    return withLoading(async () => {
      const data = await removeMemberRequest(boardId, memberId);
      if (activeBoard?._id === boardId) setActiveBoard(data.board);
      return data;
    });
  };

  // ── Column Actions ───────────────────────────────────────────────────────────

  const createColumn = async (boardId, title) => {
    return withLoading(async () => {
      const data = await createColumnRequest(boardId, title);
      setColumns((prev) => [...prev, data.column]);
      setTasksByColumn((prev) => ({ ...prev, [data.column._id]: [] }));
      return data.column;
    });
  };

  const updateColumn = async (boardId, columnId, title) => {
    return withLoading(async () => {
      const data = await updateColumnRequest(boardId, columnId, title);
      setColumns((prev) => prev.map((c) => (c._id === columnId ? data.column : c)));
      return data.column;
    });
  };

  const deleteColumn = async (boardId, columnId) => {
    return withLoading(async () => {
      await deleteColumnRequest(boardId, columnId);
      setColumns((prev) => prev.filter((c) => c._id !== columnId));
      setTasksByColumn((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    });
  };

  const reorderColumns = async (boardId, reorderedColumns) => {
    setColumns(reorderedColumns);
    try {
      await reorderColumnsRequest(boardId, reorderedColumns.map((c) => c._id));
    } catch (err) {
      const data = await getBoardByIdRequest(boardId);
      setColumns(data.columns);
    }
  };

  // ── Task Actions (Phase 4, 5, 6) ────────────────────────────────────────────

  /**
   * Create a task in a column and append it to local state.
   * @param {string} boardId
   * @param {{ title, description?, column, priority?, dueDate?, assignedTo? }} taskData
   */
  const createTask = async (boardId, taskData) => {
    return withLoading(async () => {
      const data = await createTaskRequest(boardId, taskData);
      const task = data.task;
      setTasksByColumn((prev) => ({
        ...prev,
        [task.column]: [...(prev[task.column] || []), task],
      }));
      return task;
    });
  };

  /**
   * Update a task's fields and patch it in local state.
   * @param {string} boardId
   * @param {string} taskId
   * @param {object} updates
   */
  const updateTask = async (boardId, taskId, updates) => {
    return withLoading(async () => {
      // Capture the task's column/position before the update so we can
      // detect whether it moved and adjust sibling positions accordingly.
      let previousColumnId = null;
      let previousPosition = null;
      Object.entries(tasksByColumn).forEach(([colId, tasks]) => {
        const found = tasks.find((t) => t._id === taskId);
        if (found) {
          previousColumnId = colId;
          previousPosition = found.position;
        }
      });

      const data = await updateTaskApi(boardId, taskId, updates);
      const updated = data.task;
      const moved = previousColumnId !== null && previousColumnId !== updated.column;

      setTasksByColumn((prev) => {
        const next = {};

        Object.entries(prev).forEach(([colId, tasks]) => {
          let columnTasks = tasks.filter((t) => t._id !== taskId);

          if (moved && colId === previousColumnId) {
            // Close the gap left behind in the source column
            columnTasks = columnTasks.map((t) =>
              t.position > previousPosition ? { ...t, position: t.position - 1 } : t
            );
          }

          next[colId] = columnTasks;
        });

        const destTasks = [...(next[updated.column] || [])];
        if (moved) {
          // Make room at the end of the destination column (matches the
          // backend, which appends moved tasks to the end)
          destTasks.forEach((t) => {
            if (t.position >= updated.position) t.position += 1;
          });
        }
        destTasks.push(updated);
        next[updated.column] = destTasks.sort((a, b) => a.position - b.position);

        return next;
      });

      return updated;
    });
  };

  /**
   * Delete a task and remove it from local state.
   * @param {string} boardId
   * @param {string} taskId
   * @param {string} columnId
   */
  const deleteTask = async (boardId, taskId, columnId) => {
    return withLoading(async () => {
      await deleteTaskApi(boardId, taskId);
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || []).filter((t) => t._id !== taskId),
      }));
    });
  };

  /**
   * Move a task to a new column/position (Phase 5). Performs an optimistic
   * local reorder, then persists to the server; rolls back on failure.
   *
   * @param {string} boardId
   * @param {string} taskId
   * @param {string} sourceColumnId
   * @param {string} destColumnId
   * @param {number} destPosition
   */
  const moveTask = async (boardId, taskId, sourceColumnId, destColumnId, destPosition) => {
    const previousState = tasksByColumn;

    // Look up the destination column's title so we can keep `status` in
    // sync with the column it's being dropped into (e.g. dropping into
    // "Done" should set status to "done"), matching backend behaviour.
    const destColumn = columns.find((c) => c._id === destColumnId);
    const newStatus = destColumn ? statusFromColumnTitle(destColumn.title) : undefined;

    // Optimistic update
    setTasksByColumn((prev) => {
      const next = { ...prev };
      const sourceList = [...(next[sourceColumnId] || [])];
      const taskIndex = sourceList.findIndex((t) => t._id === taskId);
      if (taskIndex === -1) return prev;

      const [task] = sourceList.splice(taskIndex, 1);
      const updatedTask = {
        ...task,
        column: destColumnId,
        status: newStatus || task.status,
      };

      const destList =
        sourceColumnId === destColumnId ? sourceList : [...(next[destColumnId] || [])];
      destList.splice(destPosition, 0, updatedTask);

      next[sourceColumnId] = sourceList;
      next[destColumnId] = destList;
      return next;
    });

    try {
      await moveTaskApi(boardId, taskId, { column: destColumnId, position: destPosition });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to move task');
      setTasksByColumn(previousState);
    }
  };

  // ── Comment Actions (Phase 7) ────────────────────────────────────────────────

  /**
   * Add a comment to a task and patch the task's comments in local state.
   * @param {string} boardId
   * @param {string} taskId
   * @param {string} columnId
   * @param {string} text
   */
  const addComment = async (boardId, taskId, columnId, text) => {
    return withLoading(async () => {
      const data = await addCommentRequest(boardId, taskId, text);
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || []).map((t) =>
          t._id === taskId ? { ...t, comments: data.comments } : t
        ),
      }));
      return data.comments;
    });
  };

  const updateComment = async (boardId, taskId, columnId, commentId, text) => {
    return withLoading(async () => {
      const data = await updateCommentRequest(boardId, taskId, commentId, text);
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || []).map((t) =>
          t._id === taskId ? { ...t, comments: data.comments } : t
        ),
      }));
      return data.comments;
    });
  };

  const deleteComment = async (boardId, taskId, columnId, commentId) => {
    return withLoading(async () => {
      const data = await deleteCommentRequest(boardId, taskId, commentId);
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || []).map((t) =>
          t._id === taskId ? { ...t, comments: data.comments } : t
        ),
      }));
      return data.comments;
    });
  };

  // ── Activity Actions (Phase 8) ───────────────────────────────────────────────

  /**
   * Load the board-wide activity timeline.
   * @param {string} boardId
   * @param {number} [limit]
   */
  const fetchActivity = useCallback(async (boardId, limit) => {
    try {
      const data = await getBoardActivityRequest(boardId, limit);
      setActivities(data.activities);
      return data.activities;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity');
      return [];
    }
  }, []);

  // ── Real-time event listeners (Phase 12) ────────────────────────────────────

  /**
   * Subscribe to live updates for the active board. Re-runs whenever the
   * socket connection changes (e.g. after login). Listeners check
   * `activeBoardIdRef` so events for a board the user has since navigated
   * away from are ignored.
   */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const isActiveBoard = (boardId) => activeBoardIdRef.current === boardId;

    const handleTaskCreated = ({ task, userId }) => {
      if (userId === currentUser?._id) return; // we already updated optimistically
      setTasksByColumn((prev) => ({
        ...prev,
        [task.column]: [...(prev[task.column] || []), task],
      }));
    };

    const handleTaskUpdated = ({ task, userId }) => {
      if (userId === currentUser?._id) return;
      setTasksByColumn((prev) => ({
        ...prev,
        [task.column]: (prev[task.column] || []).map((t) =>
          t._id === task._id ? task : t
        ),
      }));
    };

    const handleTaskDeleted = ({ taskId, columnId, userId }) => {
      if (userId === currentUser?._id) return;
      setTasksByColumn((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || []).filter((t) => t._id !== taskId),
      }));
    };

    const handleTaskMoved = ({ task, userId }) => {
      if (userId === currentUser?._id) return;
      setTasksByColumn((prev) => {
        const next = {};
        Object.keys(prev).forEach((colId) => {
          next[colId] = prev[colId].filter((t) => t._id !== task._id);
        });
        next[task.column] = [...(next[task.column] || [])];
        const insertAt = Math.min(task.position, next[task.column].length);
        next[task.column].splice(insertAt, 0, task);
        return next;
      });
    };

    const handleCommentChange = ({ taskId, comments, userId }) => {
      if (userId === currentUser?._id) return;
      setTasksByColumn((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((colId) => {
          next[colId] = next[colId].map((t) =>
            t._id === taskId ? { ...t, comments } : t
          );
        });
        return next;
      });
    };

    const handleColumnCreated = ({ column, userId }) => {
      if (userId === currentUser?._id) return;
      setColumns((prev) =>
        prev.some((c) => c._id === column._id) ? prev : [...prev, column]
      );
      setTasksByColumn((prev) => ({ ...prev, [column._id]: prev[column._id] || [] }));
    };

    const handleColumnUpdated = ({ column, userId }) => {
      if (userId === currentUser?._id) return;
      setColumns((prev) => prev.map((c) => (c._id === column._id ? column : c)));
    };

    const handleColumnDeleted = ({ columnId, userId }) => {
      if (userId === currentUser?._id) return;
      setColumns((prev) => prev.filter((c) => c._id !== columnId));
      setTasksByColumn((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    };

    const handleColumnsReordered = ({ columns: reordered, userId }) => {
      if (userId === currentUser?._id) return;
      setColumns(reordered);
    };

    const handlePresenceUpdate = ({ boardId, users }) => {
      if (!isActiveBoard(boardId)) return;
      setOnlineUsers(users);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:moved', handleTaskMoved);
    socket.on('comment:added', handleCommentChange);
    socket.on('comment:updated', handleCommentChange);
    socket.on('comment:deleted', handleCommentChange);
    socket.on('column:created', handleColumnCreated);
    socket.on('column:updated', handleColumnUpdated);
    socket.on('column:deleted', handleColumnDeleted);
    socket.on('columns:reordered', handleColumnsReordered);
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:moved', handleTaskMoved);
      socket.off('comment:added', handleCommentChange);
      socket.off('comment:updated', handleCommentChange);
      socket.off('comment:deleted', handleCommentChange);
      socket.off('column:created', handleColumnCreated);
      socket.off('column:updated', handleColumnUpdated);
      socket.off('column:deleted', handleColumnDeleted);
      socket.off('columns:reordered', handleColumnsReordered);
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [currentUser?._id]);

  const value = {
    // State
    personalBoards,
    collaborativeBoards,
    activeBoard,
    columns,
    tasksByColumn,
    searchFilters,
    activities,
    onlineUsers,
    loading,
    error,
    // Board actions
    fetchBoards,
    fetchBoardById,
    createBoard,
    updateBoard,
    deleteBoard,
    // Member actions
    inviteMember,
    removeMember,
    // Column actions
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    // Task actions
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    // Search & filters (Phase 9)
    fetchTasks,
    updateSearchFilters,
    clearSearchFilters,
    // Comment actions
    addComment,
    updateComment,
    deleteComment,
    // Activity (Phase 8)
    fetchActivity,
    // Direct setters
    setColumns,
    setError,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

/**
 * Convenience hook for consuming BoardContext.
 * @throws if used outside of BoardProvider
 */
export const useBoard = () => {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used within a BoardProvider');
  return ctx;
};

export default BoardContext;
