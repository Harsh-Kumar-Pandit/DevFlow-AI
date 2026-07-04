import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Bell, Settings, ChevronLeft,
  ChevronRight, Plus, LogOut, Zap, Building2, Users, Calendar,
  Sparkles, ChevronDown, Check, Settings2, UserPlus, ArrowRight, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useNotifications } from '../../context/NotificationContext';
import { projectService } from '../../services/project.service';
import { workspaceService } from '../../services/workspace.service';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export function Sidebar({ onAIOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currentWorkspace, workspaces, setCurrentWorkspace, fetchWorkspaces } = useWorkspace();
  const { unreadCount } = useNotifications() || {};
  const navigate = useNavigate();
  const location = useLocation();

  const workspaceId = currentWorkspace?._id;
  const dropdownRef = useRef(null);

  // Workspace actions states
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Projects list for linking Kanban/Calendar
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (workspaceId) {
      projectService.getWorkspaceProjects(workspaceId)
        .then((res) => setProjects(res.data.projects || []))
        .catch(console.error);
    }
  }, [workspaceId]);

  // Track recently used workspaces
  useEffect(() => {
    if (workspaceId) {
      const recents = JSON.parse(localStorage.getItem('devflow-recent-workspaces') || '[]');
      const filtered = recents.filter((id) => id !== workspaceId);
      const newRecents = [workspaceId, ...filtered].slice(0, 4);
      localStorage.setItem('devflow-recent-workspaces', JSON.stringify(newRecents));
    }
  }, [workspaceId]);

  // Get recently used workspaces (excluding active)
  const getRecentWorkspaces = () => {
    const recents = JSON.parse(localStorage.getItem('devflow-recent-workspaces') || '[]');
    return workspaces.filter((w) => w._id !== workspaceId && recents.includes(w._id));
  };

  const recentWorkspaces = getRecentWorkspaces();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWorkspaceSwitch = (workspace) => {
    setCurrentWorkspace(workspace);
    setDropdownOpen(false);
    navigate(`/app/dashboard/${workspace._id}`);
    toast.success(`Switched to ${workspace.name}`);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setLoadingAction(true);
    try {
      const res = await workspaceService.create(createForm);
      toast.success('Workspace created successfully!');
      setCreateForm({ name: '', description: '' });
      setCreateOpen(false);
      await fetchWorkspaces();
      if (res.data.workspace) {
        setCurrentWorkspace(res.data.workspace);
        navigate(`/app/dashboard/${res.data.workspace._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoadingAction(true);
    try {
      await workspaceService.join(joinCode.trim());
      toast.success('Join request sent successfully!');
      setJoinCode('');
      setJoinOpen(false);
      await fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    } finally {
      setLoadingAction(false);
    }
  };

  const firstProjectId = projects[0]?._id;

  // Sidebar item organization
  const navItems = [
    {
      to: `/app/dashboard/${workspaceId}`,
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      to: `/app/workspace/${workspaceId}/projects`,
      icon: FolderKanban,
      label: 'Projects',
    },
    {
      to: `/app/workspace/${workspaceId}/kanban`,
      icon: Building2,
      label: 'Kanban',
    },
    {
      to: `/app/workspace/${workspaceId}/calendar`,
      icon: Calendar,
      label: 'Calendar',
    },
    {
      onClick: onAIOpen,
      icon: Sparkles,
      label: 'AI Copilot',
      isActionButton: true,
      className: 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/10',
    },
  ];

  const bottomNavItems = [
    {
      to: `/app/workspace/${workspaceId}`,
      icon: Building2,
      label: 'Workspace',
    },
    {
      to: '/app/notifications',
      icon: Bell,
      label: 'Notifications',
      badge: true,
    },
    {
      to: '/app/settings',
      icon: Settings,
      label: 'Settings',
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative h-full bg-[#0b0b0f] border-r border-zinc-800/40 flex flex-col flex-shrink-0 z-20"
    >
      <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Brand & Workspace Switcher Header */}
      <div className="flex flex-col border-b border-zinc-800/40 flex-shrink-0 relative" ref={dropdownRef}>
        
        {/* App Branding */}
        <Link to="/" className={cn("flex items-center pt-5 pb-3 group", collapsed ? "px-5 justify-center" : "px-5 gap-3")}>
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-400 transition-colors">
            <Zap size={15} className="text-white fill-transparent" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white tracking-wide text-sm group-hover:text-indigo-300 transition-colors">
              DevFlow AI
            </span>
          )}
        </Link>

        {/* Divider */}
        {!collapsed && <div className="mx-5 border-t border-zinc-800/60" />}

        {/* Workspace Switcher */}
        <div className="px-3 pb-3 pt-2">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Workspace
            </p>
          )}
          {workspaceId ? (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800/60 transition-all text-left",
                dropdownOpen && "bg-zinc-900 border-zinc-800/60"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {currentWorkspace?.name?.[0]?.toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-100 truncate flex items-center gap-1.5">
                      {currentWorkspace?.name}
                    </p>
                    <p className="text-[9px] text-zinc-400 mt-0.5 font-medium">
                      {currentWorkspace?.members?.length || 1} member{(currentWorkspace?.members?.length || 1) !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={14}
                  className={cn("text-zinc-500 transition-transform duration-200", dropdownOpen && "rotate-180 text-zinc-200")}
                />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 p-1.5">
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Building2 size={14} className="text-zinc-500" />
              </div>
              {!collapsed && <span className="font-semibold text-zinc-400 text-xs">No Workspace</span>}
            </div>
          )}
        </div>
        {/* Dropdown Popover */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                "absolute top-full left-4 right-4 mt-2 z-50 bg-[#121218] border border-zinc-800/80 rounded-2xl p-2 shadow-2xl shadow-black/80 flex flex-col gap-1.5 max-h-[380px] overflow-y-auto scrollbar-none",
                collapsed && "left-4 w-60"
              )}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Workspaces
              </div>

              {/* Workspaces List */}
              <div className="flex flex-col gap-0.5">
                {workspaces.map((w) => {
                  const isActive = w._id === workspaceId;
                  return (
                    <button
                      key={w._id}
                      onClick={() => handleWorkspaceSwitch(w)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all",
                        isActive
                          ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                          : "hover:bg-zinc-800/50 border border-transparent text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                          {w.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{w.name}</p>
                          <p className="text-[9px] text-zinc-500 mt-0.5">{w.members?.length || 1} members</p>
                        </div>
                      </div>
                      {isActive && <Check size={12} className="text-indigo-400 mr-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Recently Used Workspaces */}
              {recentWorkspaces.length > 0 && (
                <>
                  <div className="h-px bg-zinc-800/50 my-1" />
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Recently Used
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {recentWorkspaces.map((w) => (
                      <button
                        key={w._id}
                        onClick={() => handleWorkspaceSwitch(w)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-all"
                      >
                        <div className="h-7 w-7 rounded-lg bg-zinc-800/70 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {w.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-medium truncate">{w.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="h-px bg-zinc-800/50 my-1" />

              {/* Switcher Actions */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setCreateOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-medium"
                >
                  <Plus size={13} className="text-zinc-500" />
                  Create Workspace
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setJoinOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-medium"
                >
                  <UserPlus size={13} className="text-zinc-500" />
                  Join Workspace
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(`/app/workspace/${workspaceId}`);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-medium"
                >
                  <Settings2 size={13} className="text-zinc-500" />
                  Manage Workspaces
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto scrollbar-none">
        {navItems.map((item, idx) => {
          if (item.isActionButton) {
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left group w-full",
                  item.className || "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                )}
              >
                <item.icon size={16} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium truncate flex-1">{item.label}</span>
                )}
              </button>
            );
          }

          const targetUrl = item.to || item.fallbackTo;
          const isActive = location.pathname.startsWith(item.to) || (item.fallbackTo && location.pathname.startsWith(item.fallbackTo));

          return (
            <NavLink
              key={idx}
              to={targetUrl}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative group',
                isActive
                  ? 'bg-indigo-500/10 text-indigo-300'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 bg-indigo-500/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon size={16} className="relative flex-shrink-0" />
              {!collapsed && (
                <span className="relative font-medium truncate flex-1">{item.label}</span>
              )}
              {!collapsed && item.badgeText && (
                <span className="relative text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md">
                  {item.badgeText}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-zinc-800/40" />

        {/* Bottom items */}
        <div className="flex flex-col gap-1">
          {bottomNavItems.map((item, idx) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={idx}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative group',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-300'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator-bottom"
                    className="absolute inset-0 bg-indigo-500/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative flex-shrink-0">
                  <item.icon size={16} />
                  {item.badge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-indigo-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center ring-1 ring-zinc-950">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="relative font-medium truncate flex-1">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Profile / Logout footer */}
      <div className="px-3 py-4 border-t border-zinc-800/40 bg-[#09090c] flex-shrink-0">
        <div className={cn("flex items-center justify-between", collapsed ? "flex-col gap-4" : "gap-3")}>
          <div className="flex items-center gap-3 min-w-0">
            <Avatar user={user} size="sm" className="ring-1 ring-zinc-800" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex-shrink-0",
              collapsed ? "w-10 h-10" : ""
            )}
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 h-7 w-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all z-30 shadow-xl shadow-black/50"
      >
        {collapsed ? <Menu size={12} /> : <ChevronLeft size={14} />}
      </button>

      {/* Create Workspace Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
          <Input
            label="Workspace Name"
            placeholder="e.g. Acme Corp"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="What is your workspace for?"
            rows={3}
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loadingAction}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Workspace Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Workspace">
        <form onSubmit={handleJoinWorkspace} className="flex flex-col gap-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Enter the invite code shared by your workspace administrator. An access request will be sent to the owner.
          </p>
          <Input
            label="Invite Code"
            placeholder="e.g. WS-XXXXXX"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loadingAction}>
              Send Request
            </Button>
          </div>
        </form>
      </Modal>
    </motion.aside>
  );
}
