import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';
import Navbar from '../components/Navbar';
import BoardCard from '../components/board/BoardCard';
import CreateBoardModal from '../components/board/CreateBoardModal';
import EditBoardModal from '../components/board/EditBoardModal';

// ── Skeleton loader for board cards ─────────────────────────────────────────
const BoardCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-border bg-white p-5">
    <div className="mb-4 h-2 w-full rounded-full bg-gray-100" />
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded bg-gray-100" />
        <div className="h-2.5 w-1/2 rounded bg-gray-100" />
      </div>
    </div>
    <div className="mt-4 h-4 w-1/3 rounded-full bg-gray-100" />
  </div>
);

// ── Empty state for a board section ─────────────────────────────────────────
const EmptyState = ({ label, onAdd }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    </div>
    <p className="text-sm font-medium text-secondary">{label}</p>
    <p className="mt-1 text-xs text-secondary/40">Click the button above to get started</p>
    <button
      onClick={onAdd}
      className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-primary/90"
    >
      + Create Board
    </button>
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, count, icon, onAdd }) => (
  <div className="mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <h2 className="text-base font-semibold text-secondary">{title}</h2>
      <span className="rounded-full bg-border px-2 py-0.5 text-xs text-secondary/50">{count}</span>
    </div>
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-secondary/70 transition hover:border-primary/30 hover:text-primary"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      New
    </button>
  </div>
);

// ── Main Dashboard component ─────────────────────────────────────────────────

/**
 * Dashboard
 * Displays "My Workspace" with two sections:
 *  - Personal Boards
 *  - Team Boards (collaborative)
 *
 * Replaces the Phase 1 placeholder. Powered by BoardContext.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const {
    personalBoards,
    collaborativeBoards,
    loading,
    error,
    fetchBoards,
  } = useBoard();

  const [createOpen, setCreateOpen] = useState(false);
  const [editBoard, setEditBoard] = useState(null); // board to edit, or null

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Helper to open create modal pre-seeded with a visibility
  const openCreate = () => setCreateOpen(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary">
            My Workspace
          </h1>
          <p className="mt-1 text-sm text-secondary/50">
            Good to see you, {firstName}. Here are all your boards.
          </p>
        </div>

        {/* Global error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Personal Boards ───────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            title="Personal Boards"
            icon="👤"
            count={personalBoards.length}
            onAdd={openCreate}
          />

          {loading && personalBoards.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(3)].map((_, i) => <BoardCardSkeleton key={i} />)}
            </div>
          ) : personalBoards.length === 0 ? (
            <EmptyState label="No personal boards yet" onAdd={openCreate} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {personalBoards.map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  onEditClick={setEditBoard}
                />
              ))}
              {/* "Add" tile */}
              <button
                onClick={openCreate}
                className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-secondary/30 transition hover:border-primary/40 hover:text-primary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium">New Board</span>
              </button>
            </div>
          )}
        </section>

        {/* ── Team Boards ───────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Team Boards"
            icon="👥"
            count={collaborativeBoards.length}
            onAdd={openCreate}
          />

          {loading && collaborativeBoards.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(2)].map((_, i) => <BoardCardSkeleton key={i} />)}
            </div>
          ) : collaborativeBoards.length === 0 ? (
            <EmptyState label="No team boards yet" onAdd={openCreate} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collaborativeBoards.map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  onEditClick={setEditBoard}
                />
              ))}
              <button
                onClick={openCreate}
                className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-secondary/30 transition hover:border-primary/40 hover:text-primary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium">New Team Board</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <CreateBoardModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <EditBoardModal isOpen={!!editBoard} onClose={() => setEditBoard(null)} board={editBoard} />
    </div>
  );
};

export default Dashboard;
