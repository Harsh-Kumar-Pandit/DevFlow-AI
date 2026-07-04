import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from './TaskCard';
import { cn } from '../../utils/cn';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', dot: 'bg-zinc-550', accent: 'from-zinc-500/20 to-transparent' },
  { id: 'In Progress', title: 'In Progress', dot: 'bg-amber-500', accent: 'from-amber-500/20 to-transparent' },
  { id: 'Review', title: 'In Review', dot: 'bg-indigo-500', accent: 'from-indigo-500/20 to-transparent' },
  { id: 'Completed', title: 'Completed', dot: 'bg-emerald-500', accent: 'from-emerald-500/20 to-transparent' }
];

export function KanbanBoard({
  board,
  draggingTask,
  dragOverColumn,
  isAdmin,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setDragOverColumn,
  setSelectedTask,
  setTaskDrawerOpen,
  onCreateTaskClick
}) {
  return (
    <div
      className="flex gap-5 overflow-x-auto pb-6 items-stretch select-none custom-scrollbar"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      {COLUMNS.map((column) => {
        const columnTasks = board?.[column.id] || [];
        const isOver = dragOverColumn === column.id;
        
        return (
          <div
            key={column.id}
            className={cn(
              "w-[340px] flex-shrink-0 flex flex-col bg-[#13131A] border border-[#232330] rounded-[24px] p-4 h-full min-h-0 shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-200",
              isOver && "border-indigo-500/20 bg-[#151520]"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1.5 pb-3 border-b border-[#232330]/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className={cn("w-1.5 h-3.5 rounded-full", column.dot)} />
                <h4 className="text-xs font-bold text-zinc-100 tracking-wide">{column.title}</h4>
                <span className="text-[10px] text-zinc-550 font-bold bg-[#1A1A22] border border-[#2B2B37] px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => onCreateTaskClick(column.id)}
                  className="h-5 w-5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            {/* Scrollable Task List */}
            <div
              className={cn(
                "flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 rounded-xl p-1 transition-colors duration-150 custom-scrollbar",
                isOver ? "bg-indigo-500/[0.01]" : ""
              )}
            >
              <AnimatePresence>
                {columnTasks.map((t) => (
                  <TaskCard
                    key={t._id}
                    task={t}
                    onDragStart={(e) => handleDragStart(e, t)}
                    onClick={() => { setSelectedTask(t); setTaskDrawerOpen?.(true); }}
                    isDragging={draggingTask?._id === t._id}
                  />
                ))}
              </AnimatePresence>
              {columnTasks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[150px]">
                  <p className="text-[11px] text-zinc-500 font-medium">No tasks yet</p>
                  <p className="text-[10px] text-zinc-650 italic mt-0.5">Drag tasks here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
