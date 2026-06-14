import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';

import BoardHeader from '../components/Board/BoardHeader';
import KanbanColumn from '../components/Column/KanbanColumn';
import AddColumnForm from '../components/Column/AddColumnForm';
import CreateTaskModal from '../modals/CreateTaskModal';
import TaskDetailModal from '../modals/TaskDetailModal';
import { ToastContainer, useToast } from '../components/Common/Toast';

import * as boardApi  from '../api/boardApi';
import * as columnApi from '../api/columnApi';
import * as taskApi   from '../api/taskApi';
import { useAuth } from '../context/AuthContext';

/**
 * BoardPage
 *
 * The main Kanban board view. Wires together:
 *  - Board data fetch (title, members)
 *  - Column CRUD
 *  - Task CRUD (via taskApi directly — no hook needed here)
 *  - Drag-and-drop (Phase 5) via @hello-pangea/dnd
 *  - Task detail modal (Phase 4 task view + Phase 6/7 assign & comments)
 *  - Create task modal
 *  - Toast notifications
 *
 * State shape:
 *  board    - full board document (with owner, members)
 *  columns  - sorted array of column documents
 *  tasks    - flat array of ALL tasks for the board
 *  taskMap  - { [columnId]: Task[] } — derived, never stored directly
 */
const BoardPage = () => {
  const { boardId }   = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [board,   setBoard]   = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [createColumnId, setCreateColumnId] = useState(null); // open CreateTaskModal
  const [selectedTaskId, setSelectedTaskId] = useState(null); // open TaskDetailModal

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [boardRes, columnRes, taskRes] = await Promise.all([
          boardApi.getBoardById(boardId),
          columnApi.getColumnsByBoard(boardId),
          taskApi.getTasksByBoard(boardId),
        ]);
        setBoard(boardRes.data.board);
        setColumns(columnRes.data.columns.sort((a, b) => a.order - b.order));
        setTasks(taskRes.data.tasks);
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          showToast('Board not found or access denied.', 'error');
          navigate('/dashboard');
        } else {
          showToast('Failed to load board.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [boardId]);

  // ─── Derived: tasks per column ────────────────────────────────────────────
  const getColumnTasks = (columnId) =>
    tasks
      .filter((t) => t.column === columnId || t.column?._id === columnId)
      .sort((a, b) => a.position - b.position);

  // ─── Board actions ────────────────────────────────────────────────────────
  const handleRenameBoard = async (newTitle) => {
    try {
      const { data } = await boardApi.updateBoard(boardId, { title: newTitle });
      setBoard(data.board);
      showToast('Board renamed.', 'success');
    } catch {
      showToast('Failed to rename board.', 'error');
    }
  };

  const handleInviteMember = async (email) => {
    try {
      const { data } = await boardApi.inviteMember(boardId, email);
      setBoard(data.board);
      showToast(`${email} added to board.`, 'success');
      return { success: true, message: 'Member invited successfully!' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to invite member.';
      return { success: false, message: msg };
    }
  };

  // ─── Column actions ───────────────────────────────────────────────────────
  const handleAddColumn = async (title) => {
    try {
      const { data } = await columnApi.createColumn({ title, boardId, order: columns.length });
      setColumns((prev) => [...prev, data.column]);
      showToast('Column added.', 'success');
      return { success: true };
    } catch {
      showToast('Failed to add column.', 'error');
      return { success: false };
    }
  };

  const handleRenameColumn = async (id, title) => {
    try {
      const { data } = await columnApi.updateColumn(id, { title });
      setColumns((prev) => prev.map((c) => c._id === id ? data.column : c));
    } catch {
      showToast('Failed to rename column.', 'error');
    }
  };

  const handleDeleteColumn = async (id) => {
    const colTasks = getColumnTasks(id);
    if (colTasks.length > 0) {
      if (!window.confirm(`This column has ${colTasks.length} task(s). Deleting it will also delete all tasks. Continue?`)) return;
    }
    try {
      await columnApi.deleteColumn(id);
      setColumns((prev) => prev.filter((c) => c._id !== id));
      setTasks((prev) => prev.filter((t) => (t.column?._id || t.column) !== id));
      showToast('Column deleted.', 'success');
    } catch {
      showToast('Failed to delete column.', 'error');
    }
  };

  // ─── Task actions ─────────────────────────────────────────────────────────
  const handleCreateTask = async (payload) => {
    try {
      const { data } = await taskApi.createTask(payload);
      setTasks((prev) => [...prev, data.task]);
      showToast('Task created.', 'success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create task.';
      showToast(msg, 'error');
      return { success: false };
    }
  };

  const handleTaskUpdate = useCallback((updated) => {
    setTasks((prev) => prev.map((t) => t._id === updated._id ? updated : t));
  }, []);

  const handleTaskDelete = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    setSelectedTaskId(null);
  }, []);

  // ─── Drag and Drop (Phase 5) ──────────────────────────────────────────────
  /**
   * onDragEnd
   * Called by DragDropContext when a drag is completed.
   *
   * Algorithm:
   *  1. Identify source column/index and destination column/index.
   *  2. Optimistically reorder `tasks` state immediately so the UI
   *     snaps to the new position without waiting for the API.
   *  3. Fire PATCH /api/tasks/:id/move in the background.
   *  4. On failure, show error toast (UI already updated; a refresh
   *     will restore server state).
   */
  const onDragEnd = useCallback(async (result) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColId = source.droppableId;
    const destColId   = destination.droppableId;
    const destIndex   = destination.index;

    // Build optimistic new tasks array
    setTasks((prev) => {
      const moving = prev.find((t) => t._id === draggableId);
      if (!moving) return prev;

      // Remove from source
      const withoutMoving = prev.filter((t) => t._id !== draggableId);

      // Get destination siblings (after removal)
      const destSiblings = withoutMoving
        .filter((t) => (t.column?._id || t.column) === destColId)
        .sort((a, b) => a.position - b.position);

      // Compute new float position
      let newPosition;
      if (destSiblings.length === 0)              newPosition = 1000;
      else if (destIndex === 0)                   newPosition = destSiblings[0].position / 2;
      else if (destIndex >= destSiblings.length)  newPosition = destSiblings[destSiblings.length - 1].position + 1000;
      else newPosition = (destSiblings[destIndex - 1].position + destSiblings[destIndex].position) / 2;

      const updated = {
        ...moving,
        column:   destColId,
        position: newPosition,
      };

      return [...withoutMoving, updated];
    });

    // Persist to backend
    try {
      await taskApi.moveTask(draggableId, { columnId: destColId, position: destIndex });
    } catch {
      showToast('Failed to save task position. Refresh to sync.', 'error');
    }
  }, [showToast]);

  // ─── Board members (owner + members merged for AssigneeSelector) ──────────
  const boardMembers = board
    ? [board.owner, ...(board.members || [])].filter(Boolean)
    : [];

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
        <div className="flex gap-4 p-6 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-64 h-96 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Board header */}
      <BoardHeader
        board={board}
        currentUser={user}
        onRename={handleRenameBoard}
        onInvite={handleInviteMember}
      />

      {/* Kanban area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full items-start">

            {/* Columns */}
            {columns.map((column) => (
              <KanbanColumn
                key={column._id}
                column={column}
                tasks={getColumnTasks(column._id)}
                onAddTask={(colId) => setCreateColumnId(colId)}
                onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {/* Add column button */}
            <AddColumnForm onAdd={handleAddColumn} />
          </div>
        </div>
      </DragDropContext>

      {/* ── Create task modal ── */}
      {createColumnId && (
        <CreateTaskModal
          columnId={createColumnId}
          boardId={boardId}
          boardMembers={boardMembers}
          onClose={() => setCreateColumnId(null)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* ── Task detail modal ── */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          boardMembers={boardMembers}
          currentUser={user}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default BoardPage;