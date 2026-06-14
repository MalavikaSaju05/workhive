import { useNavigate } from 'react-router-dom';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';

/**
 * BoardCard
 * Renders a single board tile on the Dashboard.
 * Shows the board title, member count (for collaborative boards),
 * and quick-action buttons (edit / delete).
 *
 * @prop {object}   board         Board document from the API
 * @prop {function} onEditClick   Opens the EditBoardModal
 */
const BoardCard = ({ board, onEditClick }) => {
  const navigate = useNavigate();
  const { deleteBoard } = useBoard();
  const { user } = useAuth();

  const isOwner = board.owner?._id === user?._id || board.owner === user?._id;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Archive "${board.title}"? You can restore it later.`)) return;
    try {
      await deleteBoard(board._id);
    } catch {
      /* error shown via BoardContext */
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEditClick(board);
  };

  // Generate initials for the colour avatar fallback
  const initials = board.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={() => navigate(`/board/${board._id}`)}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Cover colour strip */}
      <div
        className="mb-4 h-2 w-full rounded-full"
        style={{ backgroundColor: board.coverColor || '#2563EB' }}
      />

      {/* Board avatar + title */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: board.coverColor || '#2563EB' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-secondary">
            {board.title}
          </h3>
          {board.description && (
            <p className="mt-0.5 truncate text-xs text-secondary/50">
              {board.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        {board.visibility === 'collaborative' ? (
          <div className="flex items-center gap-1">
            {/* Member avatars (up to 3) */}
            <div className="flex -space-x-1.5">
              {board.members?.slice(0, 3).map((m) => (
                <div
                  key={m._id}
                  title={m.name}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-accent text-[9px] font-semibold text-primary"
                >
                  {m.name?.[0]?.toUpperCase()}
                </div>
              ))}
            </div>
            {board.members?.length > 3 && (
              <span className="text-xs text-secondary/40">
                +{board.members.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">
            Personal
          </span>
        )}

        {/* Quick actions — visible on hover */}
        {isOwner && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleEdit}
              className="rounded-lg p-1.5 text-secondary/40 transition-colors hover:bg-accent hover:text-primary"
              title="Edit board"
            >
              {/* Pencil icon */}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.83a4 4 0 01-1.897 1.04l-2.796.746.745-2.796A4 4 0 019 13z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-secondary/40 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Archive board"
            >
              {/* Trash icon */}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0H5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardCard;
