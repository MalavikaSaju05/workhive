import { useState } from 'react';
import { useTask } from '../../context/TaskContext';

/**
 * AddTaskForm
 * An inline "Add a task" button that expands into a compact creation form
 * at the bottom of a column. No modal needed for quick task creation.
 *
 * @prop {string} boardId
 * @prop {string} columnId
 */
const AddTaskForm = ({ boardId, columnId }) => {
  const { createTask } = useTask();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await createTask(boardId, { title: trimmed, columnId });
      setTitle('');
      setOpen(false);
    } catch {
      /* error surfaced via TaskContext */
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-xs text-secondary/40 transition hover:bg-gray-200 hover:text-secondary/70"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Task
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-white p-2.5 shadow-sm">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title… (Enter to save, Esc to cancel)"
        rows={2}
        maxLength={200}
        className="w-full resize-none rounded-lg bg-transparent text-xs text-secondary placeholder-secondary/30 outline-none"
      />
      <div className="mt-2 flex items-center gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim()}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add Task'}
        </button>
        <button
          onClick={() => {
            setTitle('');
            setOpen(false);
          }}
          className="rounded-lg px-2 py-1.5 text-xs text-secondary/40 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddTaskForm;
