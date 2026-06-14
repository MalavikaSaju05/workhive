import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import PriorityBadge from '../components/task/PriorityBadge';

/**
 * CreateTaskModal
 *
 * Lightweight modal for creating a new task in a specific column.
 *
 * Props:
 *  columnId     - string
 *  boardId      - string
 *  boardMembers - array of { _id, name, email }
 *  onClose      - fn()
 *  onSubmit     - async fn(payload) => { success }
 */

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const CreateTaskModal = ({ columnId, boardId, boardMembers = [], onClose, onSubmit }) => {
  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [priority, setPriority]   = useState('medium');
  const [dueDate, setDueDate]     = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }

    setSubmitting(true);
    setError('');

    const result = await onSubmit({
      title: title.trim(),
      description,
      boardId,
      columnId,
      priority,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || undefined,
    });

    if (result?.success) {
      onClose();
    } else {
      setError('Failed to create task. Please try again.');
    }
    setSubmitting(false);
  };

  const initials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">New task</h3>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="What needs to be done?"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none
                            focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white
                            ${error ? 'border-red-300' : 'border-gray-200'}`}
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional details…"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                           resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                           text-gray-900 bg-white"
              />
            </div>

            {/* Priority + Due date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors
                        ${priority === p
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Assign to */}
            {boardMembers.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assign to</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                >
                  <option value="">Unassigned</option>
                  {boardMembers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200
                           rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600
                           rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors
                           flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {submitting ? 'Creating…' : 'Create task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTaskModal;
