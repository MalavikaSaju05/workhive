import { useEffect, useState } from 'react';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import { getTaskByIdRequest } from '../../services/taskService';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const ACTIVITY_LABELS = {
  task_created: 'created the task',
  task_updated: 'updated the task',
  task_deleted: 'deleted the task',
  task_assigned: 'updated the assignee',
  task_moved: 'moved the task',
  comment_added: 'commented',
  comment_updated: 'edited a comment',
  comment_deleted: 'deleted a comment',
};

const formatTimestamp = (ts) =>
  new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * TaskDetailsModal
 *
 * Full task view/edit modal. Tabs:
 *  - Details:  title, description, priority, due date, assignee, status
 *  - Comments (Phase 7): add / edit / delete comments
 *  - Activity (Phase 8): read-only timeline for this task
 *
 * @prop {boolean}  isOpen
 * @prop {function} onClose
 * @prop {string}   boardId
 * @prop {object}   task       Task summary from tasksByColumn (used for instant display)
 * @prop {object[]} [members]  Board members for the assignee dropdown
 */
const TaskDetailsModal = ({ isOpen, onClose, boardId, task, members = [] }) => {
  const { updateTask, deleteTask, addComment, updateComment, deleteComment, error, setError } =
    useBoard();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('details');
  const [detail, setDetail] = useState(task);
  const [form, setForm] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Initialize form from the task summary, then fetch full details
  // (comments + activity log) in the background.
  useEffect(() => {
    if (!task) return;
    setDetail(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      status: task.status,
    });
    setActiveTab('details');

    setLoadingDetail(true);
    getTaskByIdRequest(boardId, task._id)
      .then((data) => setDetail(data.task))
      .catch(() => {
        /* keep the summary if the detail fetch fails */
      })
      .finally(() => setLoadingDetail(false));
  }, [task, boardId]);

  if (!isOpen || !task || !form) return null;

  const handleClose = () => {
    setError(null);
    setCommentText('');
    setEditingCommentId(null);
    onClose();
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateTask(boardId, task._id, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
        status: form.status,
      });
      // Close the modal on success — the board view reflects the change
      // immediately via BoardContext's updated tasksByColumn state.
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setSaving(true);
    try {
      await deleteTask(boardId, task._id, task.column);
      handleClose();
    } catch {
      /* error surfaced via BoardContext */
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const comments = await addComment(boardId, task._id, task.column, commentText.trim());
      setDetail((prev) => ({ ...prev, comments }));
      setCommentText('');
    } catch {
      /* error surfaced via BoardContext */
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const comments = await updateComment(boardId, task._id, task.column, commentId, editingCommentText.trim());
      setDetail((prev) => ({ ...prev, comments }));
      setEditingCommentId(null);
    } catch {
      /* error surfaced via BoardContext */
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const comments = await deleteComment(boardId, task._id, task.column, commentId);
      setDetail((prev) => ({ ...prev, comments }));
    } catch {
      /* error surfaced via BoardContext */
    }
  };

  const comments = detail?.comments || [];
  const activityLog = [...(detail?.activityLog || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-secondary/30 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-secondary">Task Details</h2>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-secondary/40 transition-colors hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-6">
          {['details', 'comments', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary/40 hover:text-secondary'
              }`}
            >
              {tab}
              {tab === 'comments' && comments.length > 0 && ` (${comments.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* ── Details tab ─────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary/70">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={200}
                  className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary/70">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  placeholder="No description"
                  className="w-full resize-none rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary placeholder-secondary/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-secondary/70">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-secondary/70">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-secondary/70">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {members.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-secondary/70">Assignee</label>
                    <select
                      name="assignedTo"
                      value={form.assignedTo}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Comments tab (Phase 7) ──────────────────────────────── */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  maxLength={1000}
                  className="flex-1 rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-secondary placeholder-secondary/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Post
                </button>
              </form>

              {loadingDetail && comments.length === 0 && (
                <p className="text-center text-sm text-secondary/40">Loading comments...</p>
              )}

              {!loadingDetail && comments.length === 0 && (
                <p className="text-center text-sm text-secondary/40">No comments yet.</p>
              )}

              <div className="space-y-3">
                {comments.map((c) => {
                  const isAuthor = (c.user?._id || c.user) === user?._id;
                  const isEditing = editingCommentId === c._id;

                  return (
                    <div key={c._id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-primary">
                            {c.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-medium text-secondary">{c.user?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-secondary/40">{formatTimestamp(c.createdAt)}</span>
                        </div>

                        {isAuthor && !isEditing && (
                          <div className="flex gap-2">
                            <button onClick={() => startEditComment(c)} className="text-[10px] font-medium text-primary hover:underline">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteComment(c._id)} className="text-[10px] font-medium text-red-500 hover:underline">
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-gray-50 px-3 py-1.5 text-sm text-secondary outline-none focus:border-primary"
                          />
                          <button onClick={() => handleUpdateComment(c._id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90">
                            Save
                          </button>
                          <button onClick={() => setEditingCommentId(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-secondary/50 hover:bg-gray-100">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-sm text-secondary/80">{c.text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Activity tab (Phase 8) ──────────────────────────────── */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {loadingDetail && activityLog.length === 0 && (
                <p className="text-center text-sm text-secondary/40">Loading activity...</p>
              )}
              {!loadingDetail && activityLog.length === 0 && (
                <p className="text-center text-sm text-secondary/40">No activity yet.</p>
              )}
              {activityLog.map((entry, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-secondary/80">
                      <span className="font-medium text-secondary">{entry.user?.name || 'Someone'}</span>{' '}
                      {entry.message || ACTIVITY_LABELS[entry.action] || entry.action}
                    </p>
                    <p className="text-[10px] text-secondary/40">{formatTimestamp(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {activeTab === 'details' && (
          <div className="flex gap-3 border-t border-border px-6 py-4">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              Delete Task
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
