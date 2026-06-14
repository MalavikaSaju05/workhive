import { useState, useRef, useEffect } from 'react';
import { Send, Pencil, Trash2, Check, X, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

/**
 * CommentSection
 *
 * Renders the comment list and compose box for a task.
 *
 * Props:
 *  comments   - array of comment objects (with populated user)
 *  currentUser - { _id, name }
 *  onAdd      - async fn(text) => { success }
 *  onEdit     - async fn(commentId, text) => { success }
 *  onDelete   - async fn(commentId) => { success }
 *  taskId     - string (passed through to callbacks)
 */
const CommentSection = ({ comments = [], currentUser, onAdd, onEdit, onDelete }) => {
  const [text, setText]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editText, setEditText]     = useState('');
  const textareaRef = useRef(null);
  const editRef     = useRef(null);

  // Auto-resize textarea
  const autoResize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  useEffect(() => { autoResize(textareaRef.current); }, [text]);
  useEffect(() => { autoResize(editRef.current); }, [editText]);

  const handleAdd = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const result = await onAdd(text.trim());
    if (result?.success) setText('');
    setSubmitting(false);
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    const result = await onEdit(editingId, editText.trim());
    if (result?.success) cancelEdit();
  };

  const initials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const avatarBg = (name = '') => {
    const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700">
          Comments
          {comments.length > 0 && (
            <span className="ml-1.5 text-xs text-gray-400 font-normal">({comments.length})</span>
          )}
        </h4>
      </div>

      {/* Comment list */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            const isOwn = comment.user?._id === currentUser?._id;
            const isEditing = editingId === comment._id;

            return (
              <div key={comment._id} className="flex gap-2.5 group">
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                                 text-white text-xs font-semibold mt-0.5 ${avatarBg(comment.user?.name)}`}>
                  {initials(comment.user?.name)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author + timestamp */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-800">{comment.user?.name}</span>
                    <span className="text-[11px] text-gray-400">
                      {formatDistanceToNow(comment.createdAt)}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-[11px] text-gray-300 italic">edited</span>
                    )}
                  </div>

                  {/* Text / Edit input */}
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        ref={editRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg
                                   resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                   bg-white text-gray-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleEdit}
                          disabled={!editText.trim()}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                     text-white bg-blue-600 rounded-lg hover:bg-blue-700
                                     disabled:opacity-50 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                     text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {comment.text}
                    </p>
                  )}

                  {/* Actions (own comments only) */}
                  {isOwn && !isEditing && (
                    <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(comment)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(comment._id)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">No comments yet. Be the first to add one.</p>
      )}

      {/* Compose */}
      <div className="flex gap-2.5 mt-1">
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                         text-white text-xs font-semibold mt-0.5 ${avatarBg(currentUser?.name)}`}>
          {initials(currentUser?.name)}
        </div>
        <div className="flex-1">
          <div className={`border rounded-xl bg-white transition-colors
                           ${text ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="w-full px-3 pt-2.5 pb-1 text-sm resize-none bg-transparent
                         focus:outline-none text-gray-900 placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
              }}
            />
            {text.trim() && (
              <div className="flex justify-end px-2 pb-2">
                <button
                  onClick={handleAdd}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                             bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;