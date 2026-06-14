import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useBoard } from '../context/BoardContext';
import Navbar from '../components/Navbar';
import ColumnHeader from '../components/column/ColumnHeader';
import AddColumnButton from '../components/column/AddColumnButton';
import TaskCard from '../components/task/TaskCard';
import CreateTaskModal from '../components/task/CreateTaskModal';
import TaskDetailsModal from '../components/task/TaskDetailsModal';
import SearchFilterBar from '../components/task/SearchFilterBar';
import { getSocket } from '../services/socket';

// ── Skeleton for column loading state ────────────────────────────────────────
const ColumnSkeleton = () => (
  <div className="min-w-[260px] animate-pulse rounded-2xl bg-gray-100 p-4">
    <div className="mb-3 h-4 w-1/2 rounded bg-gray-200" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="mb-2 h-16 rounded-xl bg-gray-200" />
    ))}
  </div>
);

/**
 * BoardView
 * The main board page — shows the board name, description, member avatars,
 * a search/filter bar (Phase 9), and a horizontal scroll area with all the
 * board's columns. Each column holds a drag-and-drop list of task cards
 * (Phase 4/5).
 *
 * @route /board/:id
 */
const BoardView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBoard, columns, tasksByColumn, loading, error, fetchBoardById, moveTask, onlineUsers } =
    useBoard();

  const [createTaskColumnId, setCreateTaskColumnId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    if (id) fetchBoardById(id);
  }, [id, fetchBoardById]);

  // Leave the real-time room when navigating away from the board entirely
  useEffect(() => {
    return () => {
      const socket = getSocket();
      if (socket && id) socket.emit('board:leave', { boardId: id });
    };
  }, [id]);

  // Members eligible for assignment — exclude the current board's owner
  // duplication since `members` already includes the owner (Board model
  // pre-save hook ensures this).
  const members = activeBoard?.members || [];

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sameColumn = source.droppableId === destination.droppableId;
    const samePosition = sameColumn && source.index === destination.index;
    if (samePosition) return;

    moveTask(
      activeBoard._id,
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index
    );
  };

  if (loading && !activeBoard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(3)].map((_, i) => <ColumnSkeleton key={i} />)}
          </div>
        </main>
      </div>
    );
  }

  if (error && !activeBoard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      {activeBoard && (
        <>
          {/* Board header bar */}
          <div
            className="border-b border-border bg-white px-4 py-3 sm:px-6 lg:px-8"
            style={{ borderTopColor: activeBoard.coverColor, borderTopWidth: 3 }}
          >
            <div className="mx-auto flex max-w-none items-center justify-between">
              {/* Breadcrumb + title */}
              <div>
                <nav className="mb-0.5 flex items-center gap-1 text-xs text-secondary/40">
                  <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
                  <span>/</span>
                  <span className="text-secondary/60">{activeBoard.title}</span>
                </nav>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-secondary">{activeBoard.title}</h1>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: activeBoard.coverColor + '20',
                      color: activeBoard.coverColor,
                    }}
                  >
                    {activeBoard.visibility === 'collaborative' ? 'Team' : 'Personal'}
                  </span>
                </div>
                {activeBoard.description && (
                  <p className="mt-0.5 text-xs text-secondary/40">{activeBoard.description}</p>
                )}
              </div>

              {/* Analytics link + member avatars */}
              <div className="flex items-center gap-3">
                <Link
                  to={`/board/${activeBoard._id}/analytics`}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-secondary/70 transition-colors hover:bg-accent hover:text-secondary"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Link>

                {activeBoard.visibility === 'collaborative' && (
                  <div className="flex items-center gap-2">
                    {onlineUsers.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-secondary/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {onlineUsers.length} online
                      </span>
                    )}
                    <div className="flex -space-x-2">
                      {activeBoard.members?.slice(0, 5).map((m) => {
                        const isOnline = onlineUsers.some((u) => u._id === m._id);
                        return (
                          <div key={m._id} className="relative" title={m.name}>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-accent text-xs font-semibold text-primary">
                              {m.name?.[0]?.toUpperCase()}
                            </div>
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                            )}
                          </div>
                        );
                      })}
                      {activeBoard.members?.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-border text-[10px] font-medium text-secondary/60">
                          +{activeBoard.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search & filter bar (Phase 9) */}
          <SearchFilterBar
            boardId={activeBoard._id}
            members={activeBoard.visibility === 'collaborative' ? members : []}
          />

          {/* ── Columns area ─────────────────────────────────────────────── */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-x-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex h-full items-start gap-4 pb-6">
                {columns.map((column) => {
                  const tasks = tasksByColumn[column._id] || [];

                  return (
                    <div
                      key={column._id}
                      className="flex min-w-[260px] max-w-[260px] flex-shrink-0 flex-col rounded-2xl bg-gray-100 p-3"
                    >
                      {/* Column header with inline rename + delete */}
                      <ColumnHeader
                        column={column}
                        boardId={activeBoard._id}
                        taskCount={tasks.length}
                      />

                      {/* Task cards drop zone */}
                      <Droppable droppableId={column._id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`mt-3 min-h-[40px] flex-1 space-y-2 rounded-xl transition-colors ${
                              snapshot.isDraggingOver ? 'bg-accent/40' : ''
                            }`}
                          >
                            {tasks.length === 0 && !snapshot.isDraggingOver && (
                              <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-secondary/30">
                                No tasks yet
                              </div>
                            )}
                            {tasks.map((task, index) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                index={index}
                                onClick={() => setActiveTask(task)}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Add task button */}
                      <button
                        onClick={() => setCreateTaskColumnId(column._id)}
                        className="mt-2 flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-xs text-secondary/40 transition hover:bg-gray-200 hover:text-secondary/70"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Task
                      </button>
                    </div>
                  );
                })}

                {/* Add column button */}
                <AddColumnButton boardId={activeBoard._id} />
              </div>
            </div>
          </DragDropContext>

          {/* Create Task modal */}
          <CreateTaskModal
            isOpen={!!createTaskColumnId}
            onClose={() => setCreateTaskColumnId(null)}
            boardId={activeBoard._id}
            columnId={createTaskColumnId}
            members={activeBoard.visibility === 'collaborative' ? members : []}
          />

          {/* Task Details modal */}
          <TaskDetailsModal
            isOpen={!!activeTask}
            onClose={() => setActiveTask(null)}
            boardId={activeBoard._id}
            task={activeTask}
            members={activeBoard.visibility === 'collaborative' ? members : []}
          />
        </>
      )}
    </div>
  );
};

export default BoardView;
