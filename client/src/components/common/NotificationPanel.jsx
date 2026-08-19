import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/formatDate';
import api from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function NotificationPanel({ open, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications() || {};
  const { fetchWorkspaces } = useWorkspace();
  const [processingId, setProcessingId] = useState(null);

  const typeIcons = {
    TASK_ASSIGNED: '📋',
    STATUS_CHANGED: '🔄',
    COMMENT: '💬',
    JOIN_ACCEPTED: '✅',
    PROJECT_CREATED: '🚀',
    TASK_CREATED: '📋',
    WORKSPACE_INVITATION: '📩',
  };

  const handleAccept = async (notification) => {
    if (!notification.invitation) {
      toast.error("Invitation ID not found");
      return;
    }
    setProcessingId(notification._id);
    try {
      await api.post(`/invitations/${notification.invitation}/accept`);
      toast.success("Invitation accepted!");
      await fetchWorkspaces();
      if (fetchNotifications) await fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (notification) => {
    if (!notification.invitation) {
      toast.error("Invitation ID not found");
      return;
    }
    setProcessingId(notification._id);
    try {
      await api.post(`/invitations/${notification.invitation}/decline`);
      toast.success("Invitation declined.");
      if (fetchNotifications) await fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline");
    } finally {
      setProcessingId(null);
    }
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
                    className={`flex flex-col gap-2 p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{typeIcons[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-zinc-650 mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n._id)}
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-zinc-650 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                          >
                            <Check size={11} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n._id)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center text-zinc-655 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Accept/Decline action buttons inside NotificationPanel */}
                    {n.type === 'WORKSPACE_INVITATION' && (
                      <div className="flex items-center gap-1.5 pl-8 mt-1">
                        <button
                          disabled={processingId === n._id}
                          onClick={() => handleAccept(n)}
                          className="text-[10px] px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-bold transition-all"
                        >
                          Accept
                        </button>
                        <button
                          disabled={processingId === n._id}
                          onClick={() => handleDecline(n)}
                          className="text-[10px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded border border-zinc-750 font-bold transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    )}
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
