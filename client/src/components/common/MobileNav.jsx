/**
 * MobileNav.jsx
 * Full-height slide-over drawer for mobile (< 1024px).
 * Desktop is completely unaffected – this component renders nothing above lg.
 */
import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Building2, Calendar, Sparkles,
  Bell, Settings, LogOut, Plus, ChevronDown, Check, X, Menu,
  Search, Users, Zap, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useNotifications } from '../../context/NotificationContext';
import { workspaceService } from '../../services/workspace.service';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────── */

function WorkspaceSwitcherMobile({ onClose }) {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchWorkspaces } = useWorkspace();
  const containerRef = useRef(null);

  // Close dropdown on outside click / touch
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleSwitch = (ws) => {
    setCurrentWorkspace(ws);
    setOpen(false);
    navigate(`/app/dashboard/${ws._id}`);
    onClose();
    toast.success(`Switched to ${ws.name}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setLoading(true);
    try {
      const res = await workspaceService.create(createForm);
      toast.success('Workspace created!');
      setCreateForm({ name: '', description: '' });
      setCreateOpen(false);
      await fetchWorkspaces();
      if (res.data.workspace) {
        setCurrentWorkspace(res.data.workspace);
        navigate(`/app/dashboard/${res.data.workspace._id}`);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      await workspaceService.join(joinCode.trim());
      toast.success('Join request sent!');
      setJoinCode('');
      setJoinOpen(false);
      await fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 hover:border-indigo-500/30 transition-all"
      >
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
          {currentWorkspace?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-white truncate">{currentWorkspace?.name}</p>
          <p className="text-[11px] text-zinc-500">{currentWorkspace?.members?.length || 1} member{currentWorkspace?.members?.length !== 1 ? 's' : ''}</p>
        </div>
        <ChevronDown size={15} className={cn('text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => handleSwitch(ws)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all',
                    ws._id === currentWorkspace?._id
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  )}
                >
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 flex-shrink-0">
                    {ws.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                  {ws._id === currentWorkspace?._id && <Check size={13} className="ml-auto text-indigo-400" />}
                </button>
              ))}

              <div className="border-t border-zinc-800/60 pt-1 mt-1 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
                >
                  <Plus size={13} className="text-indigo-400" /> Create
                </button>
                <button
                  onClick={() => setJoinOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
                >
                  <UserPlus size={13} className="text-emerald-400" /> Join
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create workspace modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Workspace">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Workspace Name" placeholder="e.g. Acme Engineering" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} required />
          <Textarea label="Description" placeholder="What's this workspace for?" rows={3} value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Join workspace modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Workspace">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <Input label="Invite Code" placeholder="Enter 8-character code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading}>Request Access</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

function DrawerNavItem({ to, icon: Icon, label, badge, onClick, onClose }) {
  const location = useLocation();
  const isActive = to ? location.pathname === to || location.pathname.startsWith(to + '/') : false;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px]',
          'text-indigo-300 hover:bg-indigo-500/10'
        )}
      >
        <Icon size={18} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px]',
        isActive
          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/15'
          : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white'
      )}
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="h-5 px-1.5 min-w-[20px] bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export function MobileDrawer({ open, onClose, onAIOpen, onSearchOpen }) {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { unreadCount } = useNotifications() || {};
  const navigate = useNavigate();
  const wsId = currentWorkspace?._id;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: `/app/dashboard/${wsId}`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `/app/workspace/${wsId}/projects`, icon: FolderKanban, label: 'Projects' },
    { to: `/app/workspace/${wsId}/kanban`, icon: Building2, label: 'Kanban' },
    { to: `/app/workspace/${wsId}/calendar`, icon: Calendar, label: 'Calendar' },
  ];

  const bottomItems = [
    { to: `/app/workspace/${wsId}`, icon: Building2, label: 'Workspace' },
    { to: '/app/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.15 }}
            onDragEnd={(_, info) => { if (info.offset.x < -60) onClose(); }}
            className="absolute top-0 left-0 h-full w-[82vw] max-w-[340px] bg-[#0b0b0f] border-r border-zinc-800/50 flex flex-col shadow-2xl shadow-black/60 overflow-hidden"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-800/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Zap size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white">DevFlow AI</span>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none">

              {/* Workspace switcher */}
              <div>
                <WorkspaceSwitcherMobile onClose={onClose} />
              </div>

              {/* Search */}
              <button
                onClick={() => { onClose(); onSearchOpen(); }}
                className="w-full flex items-center gap-3 h-11 px-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-sm text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-all"
              >
                <Search size={15} />
                <span>Search everything…</span>
              </button>

              {/* Main nav */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <DrawerNavItem key={item.to} {...item} onClose={onClose} />
                ))}
                <DrawerNavItem
                  icon={Sparkles}
                  label="AI Copilot"
                  onClick={() => { onClose(); onAIOpen(); }}
                />
              </div>

              <div className="border-t border-zinc-800/50 pt-3 space-y-1">
                {bottomItems.map((item) => (
                  <DrawerNavItem key={item.to} {...item} onClose={onClose} />
                ))}
              </div>
            </div>

            {/* Profile footer */}
            <div className="border-t border-zinc-800/50 p-3 flex-shrink-0">
              <div className="flex items-center gap-3 p-2.5 rounded-xl">
                <Avatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * MobileTopBar – only visible on mobile (< lg).
 * Shows hamburger, logo, notification bell, avatar, and search icon.
 */
export function MobileTopBar({ onMenuOpen, onAIOpen, onSearchOpen }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const navigate = useNavigate();

  return (
    <header
      className="lg:hidden h-14 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-40"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Logo / Brand */}
      <div className="flex items-center gap-2 flex-1">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
          <Zap size={13} className="text-white" />
        </div>
        <span className="text-sm font-bold text-white">DevFlow AI</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search icon */}
        <button
          onClick={onSearchOpen}
          className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {/* AI Copilot */}
        <button
          onClick={onAIOpen}
          className="h-11 w-11 rounded-xl flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
          aria-label="AI Copilot"
        >
          <Sparkles size={20} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/app/notifications')}
          className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-indigo-500 rounded-full ring-2 ring-zinc-950" />
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/app/settings')}
          className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
          aria-label="Settings"
        >
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </header>
  );
}
