import { useState, useRef, useEffect } from 'react';
import { useBoard } from '../../context/BoardContext';

/**
 * ColumnHeader
 * Displays the column title with an inline rename input on double-click,
 * and a kebab-menu for delete.
 *
 * @prop {object}   column    Column document
 * @prop {string}   boardId   Parent board ID
 * @prop {number}   taskCount Number of tasks in this column (displayed as badge)
 */
const ColumnHeader = ({ column, boardId, taskCount = 0 }) => {
  const { updateColumn, deleteColumn } = useBoard();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // Keep title in sync if the column prop changes from outside (e.g. after a
  // successful API response updates the columns array in BoardContext)
  useEffect(() => {
    setTitle(column.title);
  }, [column.title]);

  const commitRename = async () => {
    setEditing(false);
    const trimmed = title.trim();
    if (!trimmed || trimmed === column.title) {
      setTitle(column.title);
      return;
    }
    try {
      await updateColumn(boardId, column._id, trimmed);
    } catch {
      setTitle(column.title);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setTitle(column.title);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm(`Delete column "${column.title}"? This will also remove its tasks.`)) return;
    try {
      await deleteColumn(boardId, column._id);
    } catch { /* error shown by context */ }
  };

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            maxLength={60}
            className="w-full rounded-lg border border-primary bg-white px-2 py-0.5 text-sm font-semibold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <button
            onDoubleClick={() => setEditing(true)}
            className="truncate text-sm font-semibold text-secondary"
            title="Double-click to rename"
          >
            {column.title}
          </button>
        )}

        {/* Task count badge */}
        {!editing && (
          <span className="flex-shrink-0 rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium text-secondary/60">
            {taskCount}
          </span>
        )}
      </div>

      {/* Kebab menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="rounded-lg p-1 text-secondary/30 transition hover:bg-gray-200 hover:text-secondary/70"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 z-20 w-36 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              <button
                onClick={() => { setMenuOpen(false); setEditing(true); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary hover:bg-accent"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.83a4 4 0 01-1.897 1.04l-2.796.746.745-2.796A4 4 0 019 13z" />
                </svg>
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0H5" />
                </svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ColumnHeader;
