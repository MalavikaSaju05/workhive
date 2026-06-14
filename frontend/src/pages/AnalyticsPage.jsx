import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import { useBoard } from '../context/BoardContext';
import { getBoardAnalyticsRequest } from '../services/analyticsService';

const STATUS_COLORS = {
  todo: '#94A3B8',
  in_progress: '#2563EB',
  done: '#22C55E',
};

const PRIORITY_COLORS = {
  Low: '#94A3B8',
  Medium: '#2563EB',
  High: '#F97316',
  Critical: '#EF4444',
};

/**
 * StatCard
 * Small summary tile used in the stats row at the top of the page.
 */
const StatCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-border bg-white p-4">
    <p className="text-xs font-medium text-secondary/50">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${accent || 'text-secondary'}`}>{value}</p>
  </div>
);

/**
 * AnalyticsPage (Phase 11)
 *
 * Displays board-level analytics:
 *  - Summary stats: total/completed/pending/overdue tasks, completion rate
 *  - Tasks by status (pie chart)
 *  - Tasks by priority (bar chart)
 *  - Weekly productivity (bar chart of tasks completed per day)
 *  - Team activity (event counts per member, last 30 days)
 *
 * @route /board/:id/analytics
 */
const AnalyticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBoard, fetchBoardById } = useBoard();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeBoard || activeBoard._id !== id) {
      fetchBoardById(id);
    }
  }, [id, activeBoard, fetchBoardById]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getBoardAnalyticsRequest(id);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-red-500">{error || 'No analytics available'}</p>
          <button
            onClick={() => navigate(`/board/${id}`)}
            className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Back to Board
          </button>
        </main>
      </div>
    );
  }

  const { stats, tasksByStatus, tasksByPriority, weeklyProductivity, teamActivity } = data;

  // Recharts pie chart needs a non-zero dataset; filter out empty slices
  // but fall back to a single "No tasks" slice if the board is empty.
  const pieData =
    stats.totalTasks === 0
      ? [{ status: 'todo', label: 'No tasks yet', count: 1 }]
      : tasksByStatus.filter((s) => s.count > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header / breadcrumb */}
        <div className="mb-6">
          <nav className="mb-1 flex items-center gap-1 text-xs text-secondary/40">
            <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
            <span>/</span>
            <Link to={`/board/${id}`} className="hover:text-primary">
              {activeBoard?.title || 'Board'}
            </Link>
            <span>/</span>
            <span className="text-secondary/60">Analytics</span>
          </nav>
          <h1 className="text-xl font-bold text-secondary">Analytics</h1>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Total Tasks" value={stats.totalTasks} />
          <StatCard label="Completed" value={stats.completedTasks} accent="text-green-600" />
          <StatCard label="Pending" value={stats.pendingTasks} accent="text-primary" />
          <StatCard label="Overdue" value={stats.overdueTasks} accent="text-red-500" />
          <StatCard label="Completion Rate" value={`${stats.completionRate}%`} accent="text-primary" />
        </div>

        {/* Charts grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Tasks by status */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-secondary">Tasks by Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={stats.totalTasks > 0}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={stats.totalTasks === 0 ? '#E5E7EB' : STATUS_COLORS[entry.status]}
                      />
                    ))}
                  </Pie>
                  {stats.totalTasks > 0 && <Tooltip />}
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks by priority */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-secondary">Tasks by Priority</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {tasksByPriority.map((entry) => (
                      <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly productivity */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-secondary">Weekly Productivity</h2>
            <p className="mb-2 text-xs text-secondary/40">Tasks completed per day (last 7 days)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProductivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team activity */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-secondary">Team Activity</h2>
            <p className="mb-2 text-xs text-secondary/40">Actions logged per member (last 30 days)</p>

            {teamActivity.length === 0 ? (
              <div className="flex h-56 items-center justify-center">
                <p className="text-sm text-secondary/30">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamActivity.map(({ user, count }) => {
                  const max = teamActivity[0].count || 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={user._id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-primary">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-secondary">{user.name}</span>
                        </div>
                        <span className="text-secondary/50">{count} actions</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
