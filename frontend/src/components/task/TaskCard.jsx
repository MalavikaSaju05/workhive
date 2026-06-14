import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_STYLES = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

/**
 * Formats an ISO date string as a short, human-readable date (e.g. "Jun 14").
 * Returns null if no date is provided.
 */
const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
};

/**
 * TaskCard
 * A single draggable task card shown inside a column. Displays the title,
 * priority badge, due date, assignee avatar, and comment count.
 *
 * @prop {object}   task     Task document
 * @prop {number}   index    Position within the column (for @hello-pangea/dnd)
 * @prop {function} onClick  Opens the Task Details Modal for this task
 */
const TaskCard = ({ task, index, onClick }) => {
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`cursor-pointer rounded-xl border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
            snapshot.isDragging ? 'rotate-1 shadow-lg' : ''
          }`}
        >
          <p className="text-sm font-medium text-secondary">{task.title}</p>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium
                }`}
              >
                {task.priority}
              </span>

              {dueLabel && (
                <span
                  className={`text-[10px] ${
                    overdue ? 'font-medium text-red-500' : 'text-secondary/40'
                  }`}
                >
                  {dueLabel}
                </span>
              )}

              {task.comments?.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-secondary/40">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.832L3 20l1.227-3.68A8.86 8.86 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {task.comments.length}
                </span>
              )}
            </div>

            {task.assignedTo && (
              <div
                title={task.assignedTo.name}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-primary"
              >
                {task.assignedTo.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
