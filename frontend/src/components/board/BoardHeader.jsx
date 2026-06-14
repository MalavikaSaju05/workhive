import { useState } from 'react';
import { ArrowLeft, Users, UserPlus, X, Check, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

/**
 * BoardHeader  (updated for Phase 8)
 * Added: "Activity" link that navigates to /board/:boardId/activity
 *
 * Props:
 *  board         - { _id, title, visibility, members, owner }
 *  currentUser   - { _id }
 *  onRename      - async fn(title)
 *  onInvite      - async fn(email) => { success, message }
 */

const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const avatarBg = (name = '') => {
  const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

const BoardHeader = ({ board, currentUser, onRename, onInvite }) => {
  const navigate = useNavigate();
  const [editTitle, setEditTitle]   = useState(false);
  const [title, setTitle]           = useState(board?.title || '');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail]           = useState('');
  const [inviting, setInviting]     = useState(false);
  const [inviteMsg, setInviteMsg]   = useState('');

  const saveTitle = async () => {
    if (!title.trim() || title === board.title) { setEditTitle(false); setTitle(board.title); return; }
    await onRename(title.trim());
    setEditTitle(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setInviteMsg('');
    const result = await onInvite(email.trim());
    setInviteMsg(result?.message || (result?.success ? 'Invitation sent!' : 'Failed to invite.'));
    if (result?.success) setEmail('');
    setInviting(false);
  };

  const isOwner = board?.owner?._id === currentUser?._id || board?.owner === currentUser?._id;
  const allMembers = board ? [board.owner, ...(board.members || [])] : [];

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Title */}
      {editTitle ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setTitle(board.title); } }}
            className="text-base font-semibold border border-blue-300 rounded-lg px-2 py-1
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 w-48"
          />
          <button onClick={saveTitle} className="text-blue-600"><Check className="w-4 h-4" /></button>
          <button onClick={() => { setEditTitle(false); setTitle(board.title); }} className="text-gray-400"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <h1
          className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-700
                     transition-colors truncate max-w-xs"
          onClick={() => isOwner && setEditTitle(true)}
          title={isOwner ? 'Click to rename' : undefined}
        >
          {board?.title}
        </h1>
      )}

      {/* Visibility badge */}
      {board?.visibility && (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize flex-shrink-0">
          {board.visibility}
        </span>
      )}

      <div className="flex-1" />

      {/* ── Phase 8: Activity Feed link ───────────────────────────────── */}
      {board?._id && (
        <Link
          to={`/board/${board._id}/activity`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500
                     border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="View board activity feed"
        >
          <Clock className="w-3.5 h-3.5" />
          Activity
        </Link>
      )}

      {/* Member avatars */}
      <div className="flex items-center -space-x-2">
        {allMembers.slice(0, 5).map((m, i) => m && (
          <span
            key={m._id || i}
            className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center
                        text-white text-[10px] font-semibold flex-shrink-0 ${avatarBg(m.name)}`}
            title={m.name}
          >
            {initials(m.name)}
          </span>
        ))}
        {allMembers.length > 5 && (
          <span className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center
                           justify-center text-[10px] font-medium text-gray-600">
            +{allMembers.length - 5}
          </span>
        )}
      </div>

      {/* Invite (collaborative + owner only) */}
      {board?.visibility === 'collaborative' && isOwner && (
        <div className="relative">
          <button
            onClick={() => setInviteOpen((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600
                       border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </button>

          {inviteOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => { setInviteOpen(false); setInviteMsg(''); setEmail(''); }} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200
                              rounded-xl shadow-xl z-30 p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">Invite a member</p>
                <form onSubmit={handleInvite} className="flex flex-col gap-2">
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                  {inviteMsg && (
                    <p className={`text-xs ${inviteMsg.includes('sent') || inviteMsg.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>
                      {inviteMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!email.trim() || inviting}
                    className="py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg
                               hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {inviting ? 'Sending…' : 'Send invite'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BoardHeader;
