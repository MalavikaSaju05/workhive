import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import ColumnHeader from './ColumnHeader';
import TaskCard from '../Task/TaskCard';

/**
 * KanbanColumn
 * Renders a single Kanban column with:
 *  - Editable header (rename / delete)
 *  - Droppable zone for task cards
 *  - Draggable task cards
 *  - "Add task" button at the bottom
 *
 * Props:
 *  column       - { _id, title }
 *  tasks        - array of task objects for this column
 *  index        - column index (for Draggable)
 *  onAddTask    - fn(columnId)
 *  onTaskClick  - fn(taskId)
 *  onRenameColumn - async fn(id, title)
 *  onDeleteColumn - async fn(id)
 */
const KanbanColumn = ({
  column,
  tasks = [],
  onAddTask,
  onTaskClick,
  onRenameColumn,
  onDeleteColumn,
}) => {
  return (
    <div className="flex-shrink-0 w-64 min-w-[256px] flex flex-col bg-gray-50/80
                    rounded-2xl border border-gray-200 max-h-[calc(100vh-140px)]">
      {/* Column header */}
      <ColumnHeader
        column={column}
        taskCount={tasks.length}
        onRename={onRenameColumn}
        onDelete={onDeleteColumn}
      />

      {/* Droppable task list */}
      <Droppable droppableId={column._id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2 min-h-[80px]
                        transition-colors duration-150
                        ${snapshot.isDraggingOver ? 'bg-blue-50/60' : ''}`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center py-6 border-2 border-dashed
                              border-gray-200 rounded-xl text-xs text-gray-400 mx-1">
                Drop tasks here
              </div>
            )}

            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick(task._id)}
                      dragHandleProps={dragProvided.dragHandleProps}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task button */}
      <div className="px-2 pb-2 pt-1 flex-shrink-0">
        <button
          onClick={() => onAddTask(column._id)}
          className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400
                     hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
};

export default KanbanColumn;