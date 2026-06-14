/**
 * PriorityBadge
 * Visual pill showing task priority with colour-coded style.
 */
const PRIORITY_STYLES = {
  low:      { label: 'Low',      className: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium:   { label: 'Medium',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:     { label: 'High',     className: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
};

const DOT_COLORS = {
  low:      'bg-gray-400',
  medium:   'bg-amber-500',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
};

const PriorityBadge = ({ priority = 'medium', size = 'sm' }) => {
  const cfg = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  const dot = DOT_COLORS[priority]     || DOT_COLORS.medium;

  const sizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cfg.className} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {cfg.label}
    </span>
  );
};

export default PriorityBadge;