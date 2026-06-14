import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * AddColumnForm
 * Inline expanding form to add a new column.
 * Shown at the end of the column list.
 *
 * Props:
 *  onAdd - async fn(title) => { success }
 */
const AddColumnForm = ({ onAdd }) => {
  const [open, setOpen]         = useState(false);
  const [title, setTitle]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await onAdd(title.trim());
    if (result?.success) { setTitle(''); setOpen(false); }
    setSubmitting(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl
                   border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium
                   hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40
                   transition-all w-64 min-w-[256px]"
      >
        <Plus className="w-4 h-4" /> Add column
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 w-64 min-w-[256px] bg-white rounded-xl border border-blue-300
                    shadow-sm p-3 ring-1 ring-blue-200">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Column title…"
          onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setTitle(''); } }}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="flex-1 py-1.5 text-xs font-medium text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Adding…' : 'Add column'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setTitle(''); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddColumnForm;