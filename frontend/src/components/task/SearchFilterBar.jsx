import { useEffect, useRef, useState } from 'react';
import { useBoard } from '../../context/BoardContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

/**
 * SearchFilterBar (Phase 9)
 *
 * Lets the user search tasks by title/description and filter by status,
 * priority, and assignee. Filters are additive and applied server-side via
 * BoardContext.updateSearchFilters, which refetches tasks for the active
 * board with the combined query.
 *
 * The search input is debounced so we don't fire a request on every
 * keystroke.
 *
 * @prop {string}   boardId
 * @prop {object[]} [members]  Board members for the "Assigned To" dropdown
 *                              (only shown for collaborative boards)
 */
const SearchFilterBar = ({ boardId, members = [] }) => {
  const { searchFilters, updateSearchFilters, clearSearchFilters } = useBoard();
  const [searchInput, setSearchInput] = useState(searchFilters.search);
  const debounceRef = useRef(null);

  // Keep the local input in sync if filters are cleared externally
  useEffect(() => {
    setSearchInput(searchFilters.search);
  }, [searchFilters.search]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSearchFilters(boardId, { search: value });
    }, 400);
  };

  const handleFilterChange = (key) => (e) => {
    updateSearchFilters(boardId, { [key]: e.target.value });
  };

  const hasActiveFilters =
    searchFilters.search || searchFilters.status || searchFilters.priority || searchFilters.assignedTo;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-4 py-3 sm:px-6 lg:px-8">
      {/* Search input */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search tasks..."
          className="w-full rounded-xl border border-border bg-gray-50 py-2 pl-9 pr-3 text-sm text-secondary placeholder-secondary/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Status filter */}
      <select
        value={searchFilters.status}
        onChange={handleFilterChange('status')}
        className="rounded-xl border border-border bg-gray-50 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={searchFilters.priority}
        onChange={handleFilterChange('priority')}
        className="rounded-xl border border-border bg-gray-50 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Assignee filter (Phase 6/9 — only for collaborative boards) */}
      {members.length > 0 && (
        <select
          value={searchFilters.assignedTo}
          onChange={handleFilterChange('assignedTo')}
          className="rounded-xl border border-border bg-gray-50 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Assignees</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setSearchInput('');
            clearSearchFilters(boardId);
          }}
          className="rounded-xl px-3 py-2 text-sm font-medium text-secondary/50 transition-colors hover:bg-gray-100 hover:text-secondary"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default SearchFilterBar;
