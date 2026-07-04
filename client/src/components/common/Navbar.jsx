import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Avatar } from '../ui/Avatar';
import { GlobalSearch } from './GlobalSearch';
import { NotificationPanel } from './NotificationPanel';

export function Navbar({ onAIOpen }) {
  const { user } = useAuth();
  const { connected, onlineUsers } = useSocket() || {};
  const { unreadCount } = useNotifications() || {};
  const { currentWorkspace } = useWorkspace();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  // Ctrl+K shortcut
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useState(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <>
      <header className="h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-30">
        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 h-8 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-all flex-1 max-w-xs"
        >
          <Search size={13} />
          <span>Search everything...</span>
          <kbd className="ml-auto text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono text-zinc-600">⌘K</kbd>
        </button>

        <div className="flex-1" />

        {/* Online indicator */}
        <div className="flex items-center gap-2">
          {connected !== undefined && (
            <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hidden sm:inline">{connected ? `${onlineUsers?.length || 0} online` : 'Reconnecting...'}</span>
            </div>
          )}

          {/* AI button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAIOpen}
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 hover:border-indigo-500/50 transition-all"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">AI Copilot</span>
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={(el) => { if (el) el._notifRef = true; }}>
            <button
              onClick={(e) => { e.stopPropagation(); setNotifOpen((v) => !v); }}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors relative"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-indigo-500 rounded-full" />
              )}
            </button>
            <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* User avatar */}
          <button
            onClick={() => navigate('/app/settings')}
            className="flex-shrink-0"
          >
            <Avatar user={user} size="sm" />
          </button>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
