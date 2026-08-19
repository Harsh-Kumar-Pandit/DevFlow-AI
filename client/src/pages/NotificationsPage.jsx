import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Check, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { formatRelativeTime } from '../utils/formatDate';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

const TYPE_ICONS = {
  TASK_ASSIGNED: '📋',
  STATUS_CHANGED: '🔄',
  COMMENT: '💬',
  JOIN_ACCEPTED: '✅',
  PROJECT_CREATED: '🚀',
  WORKSPACE_INVITATION: '📩',
};

export function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification, fetchNotifications } = useNotifications() || {};
  const { fetchWorkspaces } = useWorkspace();
  const [processingId, setProcessingId] = useState(null);

  const handleAccept = async (notification) => {
    if (!notification.invitation) {
      toast.error("Invitation ID not found on this notification");
      return;
    }
    setProcessingId(notification._id);
    try {
      await api.post(`/invitations/${notification.invitation}/accept`);
      toast.success("Invitation accepted successfully!");
      // Refresh workspaces list to show new workspace in sidebar
      await fetchWorkspaces();
      // Refresh notifications
      if (fetchNotifications) await fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (notification) => {
    if (!notification.invitation) {
      toast.error("Invitation ID not found on this notification");
      return;
    }
    setProcessingId(notification._id);
    try {
      await api.post(`/invitations/${notification.invitation}/decline`);
      toast.success("Invitation declined successfully.");
      if (fetchNotifications) await fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline invitation");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllAsRead}>
            <CheckCheck size={13} className="mr-1.5" />
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
              className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
                !n.isRead ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex items-start gap-4">
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
              </div>

              {/* Accept / Decline buttons for invitations */}
              {n.type === 'WORKSPACE_INVITATION' && (
                <div className="flex items-center gap-2 pl-9 mt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    loading={processingId === n._id}
                    onClick={() => handleAccept(n)}
                    className="text-xs py-1.5 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/10"
                  >
                    <Check size={13} className="mr-1.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={processingId === n._id}
                    onClick={() => handleDecline(n)}
                    className="text-xs py-1.5 px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-semibold rounded-lg"
                  >
                    <X size={13} className="mr-1.5" />
                    Decline
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
