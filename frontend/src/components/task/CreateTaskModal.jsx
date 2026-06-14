import { useState } from 'react';
import { useBoard } from '../../context/BoardContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * CreateTaskModal
 * Slide-up modal for creating a new task in a given column.
 * Lets the user set title, description, priority, due date, and assignee
 * (Phase 6 — only shown for collaborative boards with members).
 *
 * @prop {boolean}  isOpen
 * @prop {function} onClose
 * @prop {string}   boardId
 * @prop {string}   columnId   Column the new task will be created in
 * @prop {object[]} [members]  Board members eligible for assignment (Phase 6)
 */
const CreateTaskModal = ({ isOpen, onClose, boardId, columnId, members = [] }) => {
  const { createTask, error, setError } = useBoard();

  const initialForm = {
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
  };

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    setLocalError('');
    setError(null);
    setForm(initialForm);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setLocalError('Task title is required');
      return;
    }

    setSubmitting(true);
    setLocalError('');
    setError(null);

    try {
      await createTask(boardId, {
        title: form.title.trim(),
        description: form.description.trim(),
        column: columnId,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
      });
      setForm(initialForm);
      onClose();
    } catch {
      /* error surfaced via BoardContext */
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-secondary/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">Add Task</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-secondary/40 transition-colors hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {displayError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Design login page"
              maxLength={200}
              autoFocus
              className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary placeholder-secondary/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add more detail (optional)"
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary placeholder-secondary/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary/70">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary/70">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Assignee (Phase 6) — only shown when the board has members */}
          {members.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary/70">
                Assign To
              </label>
              <select
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
