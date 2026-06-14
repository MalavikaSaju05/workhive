import { useState, useRef, useEffect } from 'react';
import { UserPlus, X, Check, ChevronDown } from 'lucide-react';

/**
 * AssigneeSelector
 *
 * Dropdown for assigning/unassigning a task to a board member.
 * Shows member avatars with initials, highlights current assignee.
 *
 * Props:
 *  members      - array of { _id, name, email, avatar }
 *  assignedTo   - array of currently assigned user objects
 *  onAssign     - fn(userId | null) — called with userId or null to unassign
 *  disabled     - bool
 */
const AssigneeSelector = ({ members = [], assignedTo = [], onAssign, disabled = false }) => {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const currentAssignee = assignedTo?.[0] || null;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (userId) => {
    setLoading(true);
    // If clicking the current assignee — unassign
    const targetId = currentAssignee?._id === userId ? null : userId;
    await onAssign(targetId);
    setLoading(false);
    setOpen(false);
  };

  const initials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const avatarColor = (name = '') => {
    const colors = [
      'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200
                   bg-white hover:bg-gray-50 text-sm text-gray-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {currentAssignee ? (
          <>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${avatarColor(currentAssignee.name)}`}>
              {initials(currentAssignee.name)}
            </span>
            <span className="max-w-[100px] truncate">{currentAssignee.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Assign</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200
                        rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          {/* Unassign option */}
          {currentAssignee && (
            <button
              onClick={() => handleSelect(currentAssignee._id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600
                         hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4 flex-shrink-0" />
              Remove assignee
            </button>
          )}

          {members.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400 text-center">No members to assign</p>
          )}

          {members.map((member) => {
            const isAssigned = currentAssignee?._id === member._id;
            return (
              <button
                key={member._id}
                onClick={() => handleSelect(member._id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                  ${isAssigned ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${avatarColor(member.name)}`}>
                  {initials(member.name)}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                {isAssigned && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssigneeSelector;