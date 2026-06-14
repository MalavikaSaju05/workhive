import { useState } from 'react';
import { useBoard } from '../../context/BoardContext';

const COVER_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#374151',
];

/**
 * CreateBoardModal
 * Slide-up modal for creating a new board.
 * Lets the user pick a title, description, visibility, and cover colour.
 *
 * @prop {boolean}  isOpen
 * @prop {function} onClose
 */
const CreateBoardModal = ({ isOpen, onClose }) => {
  const { createBoard, error, setError } = useBoard();

  const [form, setForm] = useState({
    title: '',
    description: '',
    visibility: 'personal',
    coverColor: '#2563EB',
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setLocalError('Board title is required');
      return;
    }

    setSubmitting(true);
    setLocalError('');
    setError(null);

    try {
      await createBoard(form);
      setForm({ title: '', description: '', visibility: 'personal', coverColor: '#2563EB' });
      onClose();
    } catch {
      /* error surfaced via BoardContext */
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setLocalError('');
    setError(null);
    setForm({ title: '', description: '', visibility: 'personal', coverColor: '#2563EB' });
    onClose();
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
          <h2 className="text-lg font-semibold text-secondary">Create Board</h2>
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
              Board Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Semester Project"
              maxLength={100}
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
              placeholder="What is this board for? (optional)"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary placeholder-secondary/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'personal', label: 'Personal', icon: '👤', desc: 'Just you' },
                { value: 'collaborative', label: 'Team', icon: '👥', desc: 'Invite others' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, visibility: opt.value }))}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                    form.visibility === opt.value
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border bg-gray-50 text-secondary/70 hover:border-primary/30'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs opacity-60">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cover Colour */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">
              Cover Colour
            </label>
            <div className="flex flex-wrap gap-2">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, coverColor: color }))}
                  className={`h-7 w-7 rounded-lg transition-transform hover:scale-110 ${
                    form.coverColor === color ? 'ring-2 ring-secondary ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-secondary transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
