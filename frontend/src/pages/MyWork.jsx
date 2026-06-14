import { useState, useEffect } from 'react';
import { CheckSquare, Filter, Clock, AlertCircle } from 'lucide-react';
import PriorityBadge from '../components/task/PriorityBadge';
import TaskDetailModal from '../modals/TaskDetailModal';
import { getMyAssignedTasks } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue } from '../components/utils/dateUtils';

/**
 * MyWork page
 * Shows all tasks assigned to the current user across all boards.
 * Supports filtering by priority and status.
 */

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const MyWork = () => {
  const { user } = useAuth();
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Filters
  const [priority, setPriority] = useState('');
  const [status, setStatus]     = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await getMyAssignedTasks({ priority: priority || undefined, status: status || undefined });
      setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to fetch assigned tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [priority, status]);

  const handleTaskUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => t._id === updated._id ? updated : t));
  };

  const handleTaskDelete = (id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    setSelectedTaskId(null);
  };

  const overdueTasks    = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'done');
  const todayTasks      = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const upcomingTasks   = tasks.filter((t) => t.dueDate && !isOverdue(t.dueDate) && !todayTasks.includes(t));
  const noDateTasks     = tasks.filter((t) => !t.dueDate);

  const sections = [
    { label: 'Overdue',  tasks: overdueTasks,  color: 'text-red-600',   icon: AlertCircle },
    { label: 'Due today', tasks: todayTasks,   color: 'text-amber-600', icon: Clock },
    { label: 'Upcoming', tasks: upcomingTasks, color: 'text-blue-600',  icon: Clock },
    { label: 'No date',  tasks: noDateTasks,   color: 'text-gray-500',  icon: CheckSquare },
  ].filter((s) => s.tasks.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            My Work
          </h1>
          <p className="text-sm text-gray-500 mt-1">All tasks assigned to you across your boards.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            Filter by:
          </div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          {(priority || status) && (
            <button
              onClick={() => { setPriority(''); setStatus(''); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No tasks assigned to you</p>
            <p className="text-xs text-gray-400 mt-1">
              {priority || status ? 'Try clearing your filters.' : 'Tasks assigned to you will appear here.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {sections.map(({ label, tasks: sectionTasks, color, icon: Icon }) => (
              <div key={label}>
                <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-3 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className="font-normal normal-case tracking-normal text-gray-400 ml-1">
                    ({sectionTasks.length})
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {sectionTasks.map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTaskId(task._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          boardMembers={[]}
          currentUser={user}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

// ─── Task row for list view ───────────────────────────────────────────────────
const TaskRow = ({ task, onClick }) => {
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-xl px-4 py-3
                 hover:border-blue-200 hover:shadow-sm transition-all flex items-center gap-3"
    >
      {/* Priority dot */}
      <PriorityBadge priority={task.priority} size="xs" />

      {/* Title + board */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {task.board?.title} · {task.column?.title}
        </p>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <span className={`text-xs font-medium flex-shrink-0 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
          {formatDate(task.dueDate)}
        </span>
      )}
    </button>
  );
};

export default MyWork;
