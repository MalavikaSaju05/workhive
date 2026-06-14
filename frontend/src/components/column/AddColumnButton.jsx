import { useState } from 'react';
import { useBoard } from '../../context/BoardContext';

/**
 * AddColumnButton
 * Renders a "+ Add Column" button that expands into an inline input.
 * Placed at the far right of the columns row in BoardView.
 *
 * @prop {string} boardId
 */
const AddColumnButton = ({ boardId }) => {
  const { createColumn } = useBoard();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await createColumn(boardId, trimmed);
      setTitle('');
      setOpen(false);
    } catch {
      /* error in context */
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setTitle(''); setOpen(false); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-fit min-w-[260px] items-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm text-secondary/40 transition hover:border-primary/40 hover:text-primary"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Column
      </button>
    );
  }

  return (
    <div className="min-w-[260px] rounded-2xl border-2 border-primary/30 bg-white p-3 shadow-sm">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Column title…"
        maxLength={60}
        className="w-full rounded-xl border border-border bg-gray-50 px-3 py-2 text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim()}
          className="flex-1 rounded-xl bg-primary py-1.5 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button
          onClick={() => { setTitle(''); setOpen(false); }}
          className="flex-1 rounded-xl border border-border py-1.5 text-xs font-medium text-secondary/70 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddColumnButton;
