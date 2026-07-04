import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { getPriorityConfig } from '../../utils/getPriorityColor';
import { formatDueDate } from '../../utils/formatDate';
import { cn } from '../../utils/cn';

export function TaskCard({ task, onDragStart, onClick, isDragging }) {
  const priority = getPriorityConfig(task.priority);
  const dueDate = formatDueDate(task.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.3 : 1,
        scale: isDragging ? 1.01 : 1,
        rotate: isDragging ? 0.5 : 0,
      }}
      whileHover={{ 
        y: -3,
        transition: { duration: 0.12, ease: 'easeOut' }
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        'bg-[#1A1A22] border border-[#2B2B37] rounded-xl p-4 cursor-grab active:cursor-grabbing select-none',
        'hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
        'transition-all duration-200 group relative',
        isDragging && 'shadow-2xl shadow-indigo-500/10 border-indigo-500/20'
      )}
    >
      {/* Priority indicator + labels */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={cn(
          'flex items-center gap-1.5 text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border',
          priority.bg, 
          priority.color,
          priority.border || 'border-zinc-800'
        )}>
          <div className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
          {task.priority}
        </div>
        <div className="flex items-center gap-1.5">
          {task.labels?.slice(0, 2).map((label) => (
            <span 
              key={label} 
              className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-md font-medium border border-indigo-500/20"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors leading-snug mb-4">
        {task.title}
      </h4>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#262635]/60">
        <div className="flex items-center gap-3 text-zinc-500">
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] hover:text-zinc-300 transition-colors">
              <MessageSquare size={11} className="text-zinc-600" />
              {task.comments.length}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] hover:text-zinc-300 transition-colors">
              <Paperclip size={11} className="text-zinc-600" />
              {task.attachments.length}
            </span>
          )}
          {dueDate && (
            <span className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-850', dueDate.color)}>
              <Calendar size={11} />
              {dueDate.label}
            </span>
          )}
        </div>
        {task.assignedTo && (
          <div className="ring-2 ring-[#1A1A22] rounded-full">
            <Avatar user={task.assignedTo} size="xs" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
