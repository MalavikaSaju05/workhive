import { Clock, UserPlus, ArrowRight, Pencil, Trash2, MessageSquare, Flag, Calendar } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

const ACTION_CONFIG = {
  task_created:     { icon: Clock,         color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'created this task' },
  task_updated:     { icon: Pencil,        color: 'text-gray-500',   bg: 'bg-gray-50',   label: 'updated this task' },
  task_deleted:     { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-50',    label: 'deleted this task' },
  task_assigned:    { icon: UserPlus,      color: 'text-violet-500', bg: 'bg-violet-50', label: 'assigned this task' },
  task_moved:       { icon: ArrowRight,    color: 'text-emerald-500',bg: 'bg-emerald-50',label: 'moved this task' },
  comment_added:    { icon: MessageSquare, color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'added a comment' },
  comment_edited:   { icon: Pencil,        color: 'text-gray-500',   bg: 'bg-gray-50',   label: 'edited a comment' },
  comment_deleted:  { icon: Trash2,        color: 'text-red-400',    bg: 'bg-red-50',    label: 'deleted a comment' },
  priority_changed: { icon: Flag,          color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'changed priority' },
  due_date_changed: { icon: Calendar,      color: 'text-cyan-500',   bg: 'bg-cyan-50',   label: 'updated due date' },
  status_changed:   { icon: ArrowRight,    color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'changed status' },
};

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

const metaDetail = (action, meta) => {
  if (action === 'task_moved' && meta?.toColumnTitle)
    return `→ ${meta.toColumnTitle}`;
  if (action === 'priority_changed' && meta?.from && meta?.to)
    return `${PRIORITY_LABELS[meta.from] || meta.from} → ${PRIORITY_LABELS[meta.to] || meta.to}`;
  if (action === 'comment_added' && meta?.preview)
    return `"${meta.preview}${meta.preview.length >= 80 ? '…' : ''}"`;
  return null;
};

const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const avatarBg = (name = '') => {
  const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

/**
 * ActivityLog
 *
 * Props:
 *  log - array of activity entries (with populated user)
 */
const ActivityLog = ({ log = [] }) => {
  if (!log.length) return null;

  const sorted = [...log].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        Activity
      </h4>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />

        <div className="flex flex-col gap-3">
          {sorted.map((entry, idx) => {
            const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.task_updated;
            const Icon = cfg.icon;
            const detail = metaDetail(entry.action, entry.meta);

            return (
              <div key={idx} className="flex items-start gap-3 pl-1">
                {/* Icon badge */}
                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-3 h-3 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* User avatar */}
                    {entry.user && (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 ${avatarBg(entry.user.name)}`}>
                        {initials(entry.user.name)}
                      </span>
                    )}
                    <span className="text-xs font-medium text-gray-700">
                      {entry.user?.name || 'Someone'}
                    </span>
                    <span className="text-xs text-gray-500">{cfg.label}</span>
                    {detail && (
                      <span className="text-xs text-gray-400 italic truncate max-w-[160px]">{detail}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatDistanceToNow(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;