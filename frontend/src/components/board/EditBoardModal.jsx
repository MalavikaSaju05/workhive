import { useState, useEffect } from 'react';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';

const COVER_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#374151',
];

/**
 * EditBoardModal
 * Allows the board owner to update title, description, visibility, coverColor,
 * and manage members (invite / remove).
 *
 * @prop {boolean}  isOpen
 * @prop {function} onClose
 * @prop {object}   board    Board document being edited
 */
const EditBoardModal = ({ isOpen, onClose, board }) => {
  const { updateBoard, inviteMember, removeMember, error, setError } = useBoard();
  const { user } = useAuth();

  const [form, setForm] = useState({ title: '', description: '', visibility: 'personal', coverColor: '#2563EB' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync form when the board prop changes
  useEffect(() => {
    if (board) {
      setForm({
        title: board.title || '',
        description: board.description || '',
        visibility: board.visibility || 'personal',
        coverColor: board.coverColor || '#2563EB',
      });
    }
  }, [board]);

  if (!isOpen || !board) return null;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setLocalError('Title is required'); return; }
    setSubmitting(true);
    setLocalError('');
    setSuccessMsg('');
    try {
      await updateBoard(board._id, form);
      setSuccessMsg('Board updated!');
      setTimeout(() => { setSuccessMsg(''); onClose(); }, 800);
    } catch {
      /* surfaced via context */
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setLocalError('');
    setSuccessMsg('');
    try {
      const data = await inviteMember(board._id, inviteEmail.trim());
      setSuccessMsg(data.message);
      setInviteEmail('');
    } catch {
      /* error in context */
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this member from the board?')) return;
    try {
      await removeMember(board._id, memberId);
    } catch { /* */ }
  };

  const handleClose = () => {
    setLocalError('');
    setSuccessMsg('');
    setError(null);
    onClose();
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-secondary/30 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">Edit Board</h2>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-secondary/40 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {displayError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{displayError}</div>}
        {successMsg && <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">{successMsg}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary/70">Cover Colour</label>
            <div className="flex flex-wrap gap-2">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, coverColor: color }))}
                  className={`h-7 w-7 rounded-lg transition-transform hover:scale-110 ${form.coverColor === color ? 'ring-2 ring-secondary ring-offset-2' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Member Management – only shown for collaborative boards */}
        {board.visibility === 'collaborative' && (
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="mb-3 text-sm font-semibold text-secondary">Members</h3>

            {/* Invite input */}
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 rounded-xl border border-border bg-gray-50 px-3 py-2 text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleInvite())}
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                {inviting ? '…' : 'Invite'}
              </button>
            </div>

            {/* Member list */}
            <ul className="mt-3 space-y-2">
              {board.members?.map((m) => {
                const isOwner = m._id === board.owner?._id || m._id === board.owner;
                const isSelf = m._id === user?._id;
                return (
                  <li key={m._id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-secondary">{m.name}</div>
                        <div className="text-[10px] text-secondary/40">{m.email}</div>
                      </div>
                    </div>
                    {isOwner ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">Owner</span>
                    ) : (
                      <button
                        onClick={() => handleRemove(m._id)}
                        className="text-xs text-red-400 hover:text-red-600"
                        title={isSelf ? 'Leave board' : 'Remove member'}
                      >
                        {isSelf ? 'Leave' : 'Remove'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditBoardModal;
