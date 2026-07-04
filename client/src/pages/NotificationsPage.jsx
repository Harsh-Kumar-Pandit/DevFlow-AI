import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { formatRelativeTime } from '../utils/formatDate';

const TYPE_ICONS = {
  TASK_ASSIGNED: '📋',
  STATUS_CHANGED: '🔄',
  COMMENT: '💬',
  JOIN_ACCEPTED: '✅',
  PROJECT_CREATED: '🚀',
};

export function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } = useNotifications() || {};

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllAsRead}>
            <CheckCheck size={13} />
            Mark all read
          </Button>
        )}
      </div>

      {notifications?.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={40} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-500 mb-2">All caught up!</h3>
          <p className="text-sm text-zinc-600">No notifications to show</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                !n.isRead ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <span className="text-xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 leading-relaxed">{n.message}</p>
                <p className="text-xs text-zinc-600 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.isRead && (
                  <Button size="icon-sm" variant="ghost" onClick={() => markAsRead(n._id)} title="Mark as read">
                    <CheckCheck size={13} />
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" onClick={() => deleteNotification(n._id)} title="Delete">
                  <Trash2 size={13} className="text-zinc-600 hover:text-red-400" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
