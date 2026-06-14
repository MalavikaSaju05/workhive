import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Trash2, Check, Calendar, Flag, User } from 'lucide-react';
import AssigneeSelector from '../components/task/AssigneeSelector';
import CommentSection from '../components/task/CommentSection';
import ActivityLog from '../components/task/ActivityLog';
import PriorityBadge from '../components/task/PriorityBadge';
import { formatDate, isOverdue, toInputDate } from '../components/utils/dateUtils';
import * as taskApi from '../api/taskApi';

/**
 * TaskDetailModal
 *
 * Full-screen slide-over (desktop: right panel, mobile: bottom sheet).
 * Shows all task details and enables inline editing of every field.
 *
 * Props:
 *  taskId       - string | null (null = closed)
 *  boardMembers - array of { _id, name, email, avatar }
 *  currentUser  - { _id, name }
 *  onClose      - fn()
 *  onUpdate     - fn(updatedTask) — propagates changes to parent
 *  onDelete     - fn(taskId)
 */

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const TaskDetailModal = ({ taskId, boardMembers = [], currentUser, onClose, onUpdate, onDelete }) => {
  const [task, setTask]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);

  // Inline edit states
  const [editTitle, setEditTitle]   = useState(false);
  const [title, setTitle]           = useState('');
  const [editDesc, setEditDesc]     = useState(false);
  const [desc, setDesc]             = useState('');
  const [editPriority, setEditPriority] = useState(false);
  const [editDueDate, setEditDueDate]   = useState(false);
  const [dueDate, setDueDate]           = useState('');

  const titleRef = useRef(null);
  const descRef  = useRef(null);

  // ─── Load task ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!taskId) { setTask(null); return; }
    setLoading(true);
    taskApi.getTaskById(taskId)
      .then(({ data }) => {
        setTask(data.task);
        setTitle(data.task.title);
        setDesc(data.task.description || '');
        setDueDate(toInputDate(data.task.dueDate));
      })
      .catch(() => onClose())
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!taskId) return null;

  // ─── Field save helpers ────────────────────────────────────────────────────
  const saveField = async (payload) => {
    setSaving(true);
    try {
      const { data } = await taskApi.updateTask(task._id, payload);
      setTask(data.task);
      onUpdate?.(data.task);
    } finally {
      setSaving(false);
    }
  };

  const saveTitle = async () => {
    if (!title.trim() || title === task.title) { setEditTitle(false); return; }
    await saveField({ title: title.trim() });
    setEditTitle(false);
  };

  const saveDesc = async () => {
    if (desc === (task.description || '')) { setEditDesc(false); return; }
    await saveField({ description: desc });
    setEditDesc(false);
  };

  const savePriority = async (p) => {
    await saveField({ priority: p });
    setEditPriority(false);
  };

  const saveDueDate = async () => {
    await saveField({ dueDate: dueDate || null });
    setEditDueDate(false);
  };

  // ─── Assign ────────────────────────────────────────────────────────────────
  const handleAssign = async (userId) => {
    setSaving(true);
    try {
      const { data } = await taskApi.assignTask(task._id, userId);
      setTask(data.task);
      onUpdate?.(data.task);
    } finally {
      setSaving(false);
    }
  };

  // ─── Comments ──────────────────────────────────────────────────────────────
  const handleAddComment = async (text) => {
    const { data } = await taskApi.addComment(task._id, text);
    if (data.success) {
      setTask((prev) => ({ ...prev, comments: [...(prev.comments || []), data.comment] }));
      onUpdate?.({ ...task, comments: [...(task.comments || []), data.comment] });
      return { success: true };
    }
    return { success: false };
  };

  const handleEditComment = async (commentId, text) => {
    const { data } = await taskApi.editComment(task._id, commentId, text);
    if (data.success) {
      setTask((prev) => ({
        ...prev,
        comments: prev.comments.map((c) => c._id === commentId ? data.comment : c),
      }));
      return { success: true };
    }
    return { success: false };
  };

  const handleDeleteComment = async (commentId) => {
    await taskApi.deleteComment(task._id, commentId);
    setTask((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c._id !== commentId),
    }));
  };

  // ─── Delete task ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    await taskApi.deleteTask(task._id);
    onDelete?.(task._id);
    onClose();
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const overdue = isOverdue(task?.dueDate);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl
                      flex flex-col overflow-hidden animate-slide-in-right">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100">
          {loading ? (
            <div className="h-6 w-48 bg-gray-100 rounded-md animate-pulse" />
          ) : editTitle ? (
            <div className="flex-1 flex gap-2">
              <input
                ref={titleRef}
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setTitle(task.title); } }}
                className="flex-1 text-base font-semibold border border-blue-300 rounded-lg
                           px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button onClick={saveTitle} className="text-blue-600 hover:text-blue-700 p-1"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setEditTitle(false); setTitle(task?.title); }} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <h2
              className="text-base font-semibold text-gray-900 flex-1 cursor-text hover:text-blue-700 transition-colors"
              onClick={() => setEditTitle(true)}
              title="Click to edit"
            >
              {task?.title}
            </h2>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            {task && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <LoadingSkeleton />
          ) : task ? (
            <div className="flex flex-col gap-6">

              {/* Meta row */}
              <div className="grid grid-cols-2 gap-3">

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Flag className="w-3 h-3" /> Priority
                  </label>
                  {editPriority ? (
                    <div className="flex flex-wrap gap-1.5">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p}
                          onClick={() => savePriority(p)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-colors
                            ${task.priority === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                      <button onClick={() => setEditPriority(false)} className="text-gray-400 hover:text-gray-600 px-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer inline-block"
                      onClick={() => setEditPriority(true)}
                      title="Click to change"
                    >
                      <PriorityBadge priority={task.priority} />
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due date
                  </label>
                  {editDueDate ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="text-xs border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={saveDueDate} className="text-blue-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditDueDate(false)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditDueDate(true)}
                      className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg border
                        transition-colors hover:border-blue-300
                        ${task.dueDate
                          ? overdue
                            ? 'text-red-600 border-red-200 bg-red-50'
                            : 'text-gray-700 border-gray-200'
                          : 'text-gray-400 border-dashed border-gray-200 hover:text-blue-600'}`}
                    >
                      <Calendar className="w-3 h-3" />
                      {task.dueDate ? formatDate(task.dueDate) : 'Set date'}
                    </button>
                  )}
                </div>

                {/* Assignee */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> Assigned to
                  </label>
                  <AssigneeSelector
                    members={boardMembers}
                    assignedTo={task.assignedTo}
                    onAssign={handleAssign}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                {editDesc ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descRef}
                      autoFocus
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-xl
                                 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Add a description…"
                      onKeyDown={(e) => { if (e.key === 'Escape') { setEditDesc(false); setDesc(task.description || ''); } }}
                    />
                    <div className="flex gap-2">
                      <button onClick={saveDesc} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => { setEditDesc(false); setDesc(task.description || ''); }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditDesc(true)}
                    className={`min-h-[60px] px-3 py-2 text-sm rounded-xl border cursor-text
                                transition-colors hover:border-blue-200 hover:bg-blue-50/30
                                ${task.description ? 'text-gray-700 border-gray-100 bg-gray-50' : 'text-gray-400 border-dashed border-gray-200'}`}
                  >
                    {task.description || 'Add a description…'}
                  </div>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Comments */}
              <CommentSection
                comments={task.comments || []}
                currentUser={currentUser}
                onAdd={handleAddComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />

              {/* Divider */}
              {task.activityLog?.length > 0 && <hr className="border-gray-100" />}

              {/* Activity log */}
              <ActivityLog log={task.activityLog || []} />
            </div>
          ) : null}
        </div>

        {/* ── Footer: column label + created by ── */}
        {task && (
          <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              In <span className="font-medium text-gray-600">{task.column?.title}</span>
            </span>
            <span className="text-xs text-gray-400">
              Created by <span className="font-medium text-gray-600">{task.createdBy?.name}</span>
            </span>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="flex flex-col gap-5 animate-pulse">
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`h-9 rounded-xl bg-gray-100 ${i === 2 ? 'col-span-2' : ''}`} />
      ))}
    </div>
    <div className="h-20 rounded-xl bg-gray-100" />
    <div className="h-px bg-gray-100" />
    <div className="flex flex-col gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 h-12 rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  </div>
);

export default TaskDetailModal;
