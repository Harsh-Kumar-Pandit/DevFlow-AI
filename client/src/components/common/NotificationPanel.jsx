import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/formatDate';

export function NotificationPanel({ open, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications() || {};

  const typeIcons = {
    TASK_ASSIGNED: '📋',
    STATUS_CHANGED: '🔄',
    COMMENT: '💬',
    JOIN_ACCEPTED: '✅',
    PROJECT_CREATED: '🚀',
    TASK_CREATED: '📋',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Portal backdrop — renders directly in body, bypasses transform containing blocks */}
          {createPortal(
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            />,
            document.body
          )}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-10 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-zinc-400" />
                <span className="text-sm font-medium text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="h-5 px-1.5 bg-indigo-500 rounded-full text-[10px] font-bold text-white flex items-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <CheckCheck size={11} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications?.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">All caught up!</p>
                </div>
              ) : (
                notifications?.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                  >
                    <span className="text-lg flex-shrink-0">{typeIcons[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                        >
                          <Check size={11} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n._id)}
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
