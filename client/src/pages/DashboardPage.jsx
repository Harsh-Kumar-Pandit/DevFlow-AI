import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { workspaceService } from '../services/workspace.service';
import { projectService } from '../services/project.service';
import { Input, Textarea } from '../components/ui/Input';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, CheckSquare, Clock, Flame, TrendingUp, AlertTriangle,
  Activity, Users, Zap, Plus, ArrowRight, Circle, Sparkles, Calendar,
  ChevronRight, UserPlus, Play, Check, ChevronLeft, FolderKanban, MessageSquare, ArrowUpRight,
  TrendingDown, Search, ArrowRightLeft, Sparkle, X
} from 'lucide-react';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';
import { formatRelativeTime, formatDueDate } from '../utils/formatDate';
import { getPriorityConfig } from '../utils/getPriorityColor';
import { TaskDrawer } from '../components/task/TaskDrawer';
import { CreateTaskModal } from '../components/task/CreateTaskModal';

// High-fidelity Stats Card with SVG sparklines and trends
function PremiumStatCard({ icon: Icon, label, value, sub, color = 'indigo', trend = '+12%', sparklinePoints = "M0,25 Q15,5 30,20 T60,10 T90,20", delay = 0 }) {
  const colorMap = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/5',
      spark: '#6366F1'
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/5',
      spark: '#10B981'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/5',
      spark: '#F59E0B'
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      glow: 'shadow-red-500/5',
      spark: '#EF4444'
    },
  };

  const themeColor = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.25)', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}
      className="bg-[#13131A] border border-[#232330] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 group"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3.5">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${themeColor.bg} ${themeColor.text}`}>
          <Icon size={16} />
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", 
          trend.startsWith('+') ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 bg-zinc-800"
        )}>
          {trend}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">{value}</div>
          <div className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">{label}</div>
        </div>
        {/* Sparkline Visual */}
        <div className="w-16 h-8 opacity-75 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={sparklinePoints}
              fill="none"
              stroke={themeColor.spark}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      {sub && <div className="text-[10px] text-zinc-655 mt-2.5 font-medium border-t border-zinc-850 pt-2">{sub}</div>}
    </motion.div>
  );
}

export function DashboardPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, fetchWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const { onlineUsers } = useSocket() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Additional Dashboard states
  const [projects, setProjects] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [myTasks, setMyTasks] = useState([]);

  // Task selection & creation states
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState('Todo');

  // Forms when no workspace selected
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Workspace Invitation states
  const [realInviteModalOpen, setRealInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isOwner = currentWorkspace?.owner?._id === user?.id || currentWorkspace?.owner?._id === user?._id || currentWorkspace?.owner === user?.id || currentWorkspace?.owner === user?._id;

  // Debounced live user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const delayDebounceFn = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}`)
        .then((res) => {
          setSearchResults(res.data.users || []);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, workspaceId]);

  const handleSendInvite = async (receiverId) => {
    try {
      await api.post(`/workspace/${workspaceId}/invite`, { receiverId });
      toast.success("Invitation sent successfully.");
      setSearchResults((prev) =>
        prev.map((u) => (u.id === receiverId ? { ...u, hasPendingInvite: true } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    }
  };

  useEffect(() => {
    if (!workspaceId && currentWorkspace?._id) {
      navigate(`/app/dashboard/${currentWorkspace._id}`, { replace: true });
    }
  }, [workspaceId, currentWorkspace, navigate]);

  const loadDashboardData = () => {
    if (!workspaceId) return;
    setLoading(true);
    api.get(`/dashboard/workspace/${workspaceId}`)
      .then((res) => setData(res.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, [workspaceId]);

  // Fetch projects and compile upcoming deadlines dynamically
  useEffect(() => {
    if (!workspaceId) return;
    setFetchingProjects(true);
    projectService.getWorkspaceProjects(workspaceId)
      .then(async (res) => {
        const projList = res.data.projects || [];
        setProjects(projList);

        // Fetch task deadlines from projects
        try {
          const boardsRes = await Promise.all(projList.slice(0, 4).map(p => projectService.getProjectBoard(p._id)));
          let allTasks = [];
          boardsRes.forEach((boardRes) => {
            const board = boardRes.data.board || {};
            Object.values(board).forEach((tasksList) => {
              if (Array.isArray(tasksList)) {
                allTasks.push(...tasksList);
              }
            });
          });

          // Compile myTasks (assigned to current user, not completed)
          const currentUserId = user?._id || user?.id;
          const userTasks = allTasks.filter(t => {
            const assigneeId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
            return assigneeId && assigneeId.toString() === currentUserId?.toString() && t.status !== 'Completed';
          });
          setMyTasks(userTasks.slice(0, 5));

          // Filter future deadlines
          const upcoming = allTasks
            .filter(t => t.dueDate && t.status !== 'Completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 4);

          setDeadlines(upcoming);
        } catch (err) {
          console.error("Failed to load task board deadlines", err);
        }
      })
      .catch(console.error)
      .finally(() => setFetchingProjects(false));
  }, [workspaceId]);

  // Compile list of known members from dashboard workloads & owner & current user
  const getWorkspaceMembersList = () => {
    const list = [];
    const ids = new Set();

    if (user) {
      list.push({ _id: user.id || user._id, fullName: user.fullName, email: user.email });
      ids.add((user.id || user._id).toString());
    }

    const owner = currentWorkspace?.owner;
    if (owner && owner._id && !ids.has(owner._id.toString())) {
      list.push({ _id: owner._id, fullName: owner.fullName, email: owner.email });
      ids.add(owner._id.toString());
    }

    if (data?.memberWorkload) {
      data.memberWorkload.forEach(m => {
        if (m.userId && !ids.has(m.userId.toString())) {
          list.push({ _id: m.userId, fullName: m.fullName, email: m.email });
          ids.add(m.userId.toString());
        }
      });
    }

    return list;
  };

  const members = getWorkspaceMembersList();

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await workspaceService.create(createForm);
      toast.success('Workspace created successfully!');
      setCreateForm({ name: '', description: '' });
      await fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setSubmitting(true);
    try {
      await workspaceService.join(joinCode.trim());
      toast.success('Join request sent successfully!');
      setJoinCode('');
      await fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (currentWorkspace?.inviteCode) {
      navigator.clipboard.writeText(currentWorkspace.inviteCode);
      toast.success('Invite code copied!');
    }
  };

  // Generate mini monthly calendar details
  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  if (!workspaceId) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <Zap size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to DevFlow AI</h2>
          <p className="text-zinc-500 text-sm max-w-md">
            To get started, create a new workspace for your team or join an existing one using an invite code.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 w-full mt-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#13131A] border border-[#232330] rounded-2xl p-6 relative overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-4">Create Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <Input
                label="Workspace Name"
                placeholder="e.g. Acme Corp"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Textarea
                label="Description"
                placeholder="Optional workspace description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              />
              <Button type="submit" variant="gradient" className="w-full" loading={submitting}>
                Create Workspace
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#13131A] border border-[#232330] rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-4">Join Workspace</h3>
            <form onSubmit={handleJoinWorkspace} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                  Ask your team administrator for the workspace invite code, then paste it below.
                </p>
                <Input
                  label="Invite Code"
                  placeholder="e.g. WS-XXXXXX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full mt-4" loading={submitting}>
                Join Workspace
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  const getGreetingText = () => {
    const hours = new Date().getHours();
    let greet = 'Good Morning';
    if (hours >= 12 && hours < 17) greet = 'Good Afternoon';
    if (hours >= 17) greet = 'Good Evening';
    return greet;
  };

  const greet = getGreetingText();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7 custom-scrollbar overflow-x-hidden">
      {/* ── TOP SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232330]/50 pb-5">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
            <span>Workspaces</span>
            <ChevronRight size={9} className="text-zinc-650" />
            <span className="text-zinc-400">{currentWorkspace?.name}</span>
            <ChevronRight size={9} className="text-zinc-650" />
            <span className="text-indigo-400">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Workspace Overview
            </h1>
            <Badge variant="indigo" size="sm" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              {currentWorkspace?.name}
            </Badge>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              size="sm"
              variant="secondary"
              onClick={copyInviteCode}
              className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              <UserPlus size={13} className="text-zinc-400 mr-1.5" />
              Invite Code: <span className="font-mono text-indigo-400 font-bold ml-1">{currentWorkspace?.inviteCode}</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/app/workspace/${workspaceId}/projects`)}
            className="text-xs shadow-lg shadow-indigo-500/15"
          >
            <Plus size={13} className="mr-1.5" />
            New Project
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#13131A] border border-[#232330] rounded-2xl p-5 shadow-sm">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="space-y-7">
          
          {/* ── HERO SECTION & QUICK ACTIONS ── */}
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {/* Beautiful Hero Card with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-2 bg-gradient-to-br from-indigo-950/20 via-[#13131A]/90 to-purple-950/20 border border-indigo-500/10 rounded-[24px] p-6 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between min-h-[220px]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {greet}, {user?.fullName?.split(' ')[0]} 👋
                </h2>
                <p className="text-xs text-zinc-300 mt-1.5 max-w-xl leading-relaxed">
                  Your workspace is progressing well. There are <span className="font-bold text-indigo-400">{data.todo + data.inProgress + data.review}</span> tasks remaining across <span className="font-bold text-white">{data.totalProjects}</span> active projects. Next deadline is tomorrow.
                </p>
              </div>

              {/* AI suggestion overlay inside the hero */}
              <div className="mt-5 p-3.5 bg-indigo-500/[0.04] border border-indigo-500/10 rounded-xl flex items-start gap-3">
                <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                  <Sparkles size={13} className="animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Workspace Insight</p>
                  <p className="text-[11px] text-zinc-350 mt-0.5">
                    "Finishing <span className="font-bold text-white">Authentication</span> tasks today will increase sprint completion velocity by 18%."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Panel */}
            <div className="bg-[#13131A] border border-[#232330] rounded-[24px] p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => navigate(`/app/workspace/${workspaceId}/projects`)}
                    className="p-3 bg-[#1A1A22] border border-[#2B2B37] rounded-xl hover:border-indigo-500/20 text-left transition-all group flex flex-col justify-between h-20"
                  >
                    <Plus size={15} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-200">New Project</span>
                  </button>
                  <button
                    onClick={() => { setCreateDefaultStatus('Todo'); setCreateModalOpen(true); }}
                    className="p-3 bg-[#1A1A22] border border-[#2B2B37] rounded-xl hover:border-indigo-500/20 text-left transition-all group flex flex-col justify-between h-20"
                  >
                    <Plus size={15} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-200">New Task</span>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setRealInviteModalOpen(true)}
                      className="p-3 bg-[#1A1A22] border border-[#2B2B37] rounded-xl hover:border-indigo-500/20 text-left transition-all group flex flex-col justify-between h-20"
                    >
                      <UserPlus size={14} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[11px] font-bold text-zinc-200">Invite Member</span>
                    </button>
                  )}
                  <button
                    onClick={() => toast.success("AI sprint plan is being synthesized...")}
                    className="p-3 bg-[#1A1A22] border border-[#2B2B37] rounded-xl hover:border-indigo-500/20 text-left transition-all group flex flex-col justify-between h-20"
                  >
                    <Sparkles size={14} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-200">Sprint Plan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── PREMIUM WORKSPACE OVERVIEW ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Workspace Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PremiumStatCard
                icon={FolderKanban}
                label="Total Projects"
                value={data.totalProjects}
                sub={`${projects.length} actively tracked`}
                color="indigo"
                trend="Stable"
                sparklinePoints="M0,25 Q15,20 30,10 T65,15 T100,5"
                delay={0}
              />
              <PremiumStatCard
                icon={CheckSquare}
                label="Open Tasks"
                value={data.todo + data.inProgress + data.review}
                sub={`${data.completed} completed this week`}
                color="amber"
                trend="+3 tasks"
                sparklinePoints="M0,20 Q15,5 30,15 T60,5 T90,10"
                delay={0.05}
              />
              <PremiumStatCard
                icon={Flame}
                label="Overdue Tasks"
                value={data.overdueTasks}
                sub={data.overdueTasks > 0 ? "Urgent attention needed" : "No late items"}
                color="red"
                trend={data.overdueTasks > 0 ? "Action required" : "Healthy"}
                sparklinePoints="M0,5 Q20,10 40,25 T80,15 T100,20"
                delay={0.1}
              />
              <PremiumStatCard
                icon={Users}
                label="Active Members"
                value={data.totalMembers}
                sub="Live collaboration"
                color="emerald"
                trend="Online"
                sparklinePoints="M0,25 Q20,15 45,28 T85,15 T100,22"
                delay={0.15}
              />
            </div>
          </div>

          {/* ── SPRINT PROGRESS ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Workspace Health & Sprint Progress</h3>
                <p className="text-[11px] text-zinc-550 mt-0.5">Task completion metrics across all active projects</p>
              </div>
              <span className="text-xl font-extrabold text-indigo-400">{data.completionPercentage}%</span>
            </div>
            <div className="h-2.5 bg-zinc-900/60 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.completionPercentage}%` }}
                transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-4 text-[9px] uppercase font-extrabold tracking-widest text-zinc-500">
              <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />Todo: {data.todo}</div>
              <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" />In Progress: {data.inProgress}</div>
              <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Review: {data.review}</div>
              <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Completed: {data.completed}</div>
            </div>
          </motion.div>

          {/* ── ASYMMETRIC GRID: AI INSIGHTS & ONLINE MEMBERS ── */}
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {/* AI Insights & Workspace Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-widest">AI Workspace Analysis</h3>
                  </div>
                  <Badge variant="indigo" size="sm" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Active Analysis</Badge>
                </div>
                
                <div className="space-y-3.5 my-3">
                  <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    <p className="text-xs font-bold text-zinc-200">Pending Review Bottleneck</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Authentication project has been pending review for 2 days. This is blocking consecutive database deployment tasks.
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Suggested action: Reassign review tasks</span>
                      <button 
                        onClick={() => toast.success("AI Copilot is resolving task roadblocks.")}
                        className="text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Fix with AI <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-[10px] text-zinc-550 border-t border-[#232330]/50 pt-3 mt-4 flex items-center justify-between">
                <span>Insight generated 5 min ago</span>
                <span className="cursor-pointer text-indigo-400 hover:text-indigo-300">View History →</span>
              </div>
            </motion.div>

            {/* Online Members with mock statuses */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span>Online Members</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">Live</span>
                </h3>
                <div className="space-y-3 max-h-[170px] overflow-y-auto custom-scrollbar pr-1">
                  {members.map((m) => {
                    const isOnline = onlineUsers?.includes(m._id?.toString());
                    return (
                      <div key={m._id} className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar user={m} size="xs" />
                          <span className={cn(
                            "absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-zinc-950",
                            isOnline ? "bg-emerald-400" : "bg-zinc-650"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{m.fullName}</p>
                          <p className="text-[9px] text-zinc-550 truncate">
                            {isOnline ? 'Active now' : 'Offline'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {isOwner && (
                <div className="mt-4 pt-3 border-t border-[#232330]/50">
                  <button
                    onClick={() => setRealInviteModalOpen(true)}
                    className="w-full py-2 bg-[#1A1A22] hover:bg-[#20202A] text-zinc-300 border border-[#2B2B37] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus size={13} />
                    Invite Member
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── ASYMMETRIC GRID: MY TASKS & UPCOMING DEADLINES ── */}
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {/* My Tasks (2/3 width) */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">My Tasks</h3>
              <div className="bg-[#13131A] border border-[#232330] rounded-[24px] p-4 shadow-lg">
                {myTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-zinc-600 italic">No tasks assigned to you in this sprint.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myTasks.map((t) => {
                      const priorityConfig = getPriorityConfig(t.priority);
                      return (
                        <div
                          key={t._id}
                          onClick={() => { setSelectedTask(t); setTaskDrawerOpen(true); }}
                          className="bg-[#1A1A22] border border-[#2B2B37] hover:border-indigo-500/20 p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <span className={cn("w-1 h-3 rounded-full flex-shrink-0", priorityConfig.dot)} />
                            <h4 className="text-xs font-semibold text-zinc-200 truncate">{t.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="indigo" size="sm" className="bg-[#13131A] text-zinc-400 border border-[#232330]">
                              {t.status}
                            </Badge>
                            {t.dueDate && (
                              <span className="text-[10px] text-zinc-500">
                                {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines (1/3 width) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Upcoming Deadlines</h3>
              <div className="bg-[#13131A] border border-[#232330] rounded-[24px] p-4 shadow-lg flex flex-col justify-between h-[calc(100%-2.5rem)]">
                {deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-zinc-600 italic">No upcoming deadlines.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {deadlines.map((task) => {
                      const p = getPriorityConfig(task.priority);
                      const due = formatDueDate(task.dueDate);
                      return (
                        <div
                          key={task._id}
                          onClick={() => { setSelectedTask(task); setTaskDrawerOpen(true); }}
                          className="bg-[#1A1A22] border border-[#2B2B37] hover:border-indigo-500/20 p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn("text-[8px] font-bold px-1 py-0.2 rounded uppercase", p.bg, p.color)}>
                                {task.priority}
                              </span>
                            </div>
                            <h4 className="text-[11px] font-medium text-zinc-200 truncate">{task.title}</h4>
                          </div>
                          <span className={cn("text-[9px] font-bold flex-shrink-0", due?.color || 'text-zinc-500')}>
                            {due?.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── ASYMMETRIC GRID: RECENT PROJECTS & TIMELINE ── */}
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {/* Recent Projects (2/3 width) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Projects</h3>
                <button
                  onClick={() => navigate(`/app/workspace/${workspaceId}/projects`)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  All Projects <ArrowRight size={11} />
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="bg-[#13131A] border border-[#232330] border-dashed rounded-[24px] p-8 text-center flex flex-col items-center">
                  <div className="h-9 w-9 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                    <FolderKanban size={16} className="text-zinc-550" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">No projects in workspace</h4>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/app/workspace/${workspaceId}/projects`)}
                    className="text-xs px-4"
                  >
                    Create Your First Project
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {projects.slice(0, 4).map((project, i) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3, borderColor: 'rgba(99, 102, 241, 0.2)' }}
                      onClick={() => navigate(`/app/workspace/${workspaceId}/project/${project._id}`)}
                      className="bg-[#13131A] border border-[#232330] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between gap-3 group shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <FolderKanban size={13} className="text-indigo-400" />
                        </div>
                        <Badge variant="indigo" size="sm" className="bg-[#1A1A22] text-zinc-400 border border-[#2B2B37]">
                          {project.tasks?.length || 0} tasks
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{project.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{project.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-zinc-550 pt-2 border-t border-[#232330]/50">
                        <span>Created {formatRelativeTime(project.createdAt)}</span>
                        <span>Open details →</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar Preview & Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Calendar Preview</h3>
              <div className="bg-[#13131A] border border-[#232330] rounded-[24px] p-4 shadow-lg space-y-4">
                {/* Mini Calendar Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="h-5 w-5 bg-[#1A1A22] border border-[#2B2B37] rounded flex items-center justify-center text-zinc-400">
                      <ChevronLeft size={10} />
                    </button>
                    <button className="h-5 w-5 bg-[#1A1A22] border border-[#2B2B37] rounded flex items-center justify-center text-zinc-400">
                      <ChevronRight size={10} />
                    </button>
                  </div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                    <span key={d} className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{d}</span>
                  ))}
                  {getDaysInMonth().map((day, idx) => {
                    if (!day) return <span key={idx} />;
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <span
                        key={idx}
                        className={cn(
                          "text-[9px] font-medium h-5 w-5 rounded flex items-center justify-center mx-auto",
                          isToday ? "bg-indigo-500 text-white font-bold" : "text-zinc-400"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── ASYMMETRIC GRID: RECENT ACTIVITY TIMELINE & LOAD DISTRIBUTION ── */}
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Team Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg"
            >
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={12} className="text-indigo-400" />
                Team Activity Stream
              </h3>
              <div className="space-y-4 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                {data.recentActivity?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-zinc-600 italic">No activity recorded yet.</p>
                  </div>
                ) : (
                  data.recentActivity?.map((activity, i) => (
                    <div key={activity._id || i} className="flex items-start gap-3 relative group">
                      {i !== data.recentActivity.length - 1 && (
                        <span className="absolute top-6 bottom-0 left-[11px] w-px bg-zinc-800/50" />
                      )}
                      <Avatar user={activity.user} size="xs" className="ring-1 ring-zinc-800" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          <span className="font-semibold text-zinc-150">{activity.user?.fullName}</span>
                          {' '}{activity.description}
                        </p>
                        <p className="text-[9px] text-zinc-600 font-bold mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Team Load Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg"
            >
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={12} className="text-violet-400" />
                Team Load Distribution
              </h3>
              <div className="space-y-4 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                {data.memberWorkload?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-zinc-600 italic">No tasks assigned to team members.</p>
                  </div>
                ) : (
                  data.memberWorkload?.map((member, i) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <Avatar user={{ fullName: member.fullName }} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-zinc-200 truncate">{member.fullName}</span>
                          <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">{member.totalTasks} tasks</span>
                        </div>
                        <div className="h-1 bg-zinc-850 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((member.totalTasks / (data.totalTasks || 1)) * 100, 100)}%` }}
                            transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* ── PRIORITY BREAKDOWN & SVG CHARTS ── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Task Priority Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg space-y-4"
            >
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Task Priority Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(data.priority || {}).map(([p, count]) => {
                  const config = getPriorityConfig(p);
                  return (
                    <div key={p} className="text-center bg-[#1A1A22] border border-[#2B2B37] p-3 rounded-xl hover:border-zinc-700 transition-colors">
                      <div className={cn("text-xl font-extrabold", config.color)}>{count}</div>
                      <div className={cn("text-[9px] uppercase font-bold tracking-wider mt-1", config.color)}>{p}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Custom SVG Productivity Chart (Bar chart) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#13131A] border border-[#232330] rounded-[24px] p-5 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Velocity</h3>
                <span className="text-[9px] text-zinc-550 font-bold uppercase">Weekly Trend</span>
              </div>
              <div className="flex items-end justify-between gap-3 h-28 pt-4">
                {[
                  { day: 'Mon', val: 35 },
                  { day: 'Tue', val: 55 },
                  { day: 'Wed', val: 75 },
                  { day: 'Thu', val: 40 },
                  { day: 'Fri', val: 90 },
                  { day: 'Sat', val: 20 },
                  { day: 'Sun', val: 10 }
                ].map((d, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-[#1A1A22] rounded-t h-full relative overflow-hidden flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.val}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t"
                      />
                    </div>
                    <span className="text-[9px] text-zinc-550 font-bold">{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      ) : null}

      {/* ── Task Details Drawer & Task Creation Modal ── */}
      <TaskDrawer
        task={selectedTask}
        open={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setSelectedTask(null); }}
        projectId={selectedTask?.project || projects[0]?._id}
        workspaceId={workspaceId}
        onUpdated={loadDashboardData}
        members={members}
      />

      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projects[0]?._id}
        workspaceId={workspaceId}
        defaultStatus={createDefaultStatus}
        onCreated={loadDashboardData}
        members={members}
      />

      {/* ── Real Member Invitation Modal ── */}
      <AnimatePresence>
        {realInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRealInviteModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#13131A] border border-[#232330] rounded-[24px] p-6 w-full max-w-lg shadow-2xl z-10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Invite Member</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Invite an existing DevFlow user to collaborate in this workspace.
                  </p>
                </div>
                <button 
                  onClick={() => setRealInviteModalOpen(false)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter username or email..."
                    className="w-full bg-[#1A1A22] border border-[#2B2B37] rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {searchLoading && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="h-4.5 w-4.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    </span>
                  )}
                </div>

                {/* Results dropdown list */}
                <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {searchLoading && searchResults.length === 0 ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-xl">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-zinc-500 font-semibold mb-1">No user found.</p>
                      <div className="p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-xl inline-block text-left mt-2">
                        <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mb-1">Share Workspace Invite Code</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold">{currentWorkspace?.inviteCode}</span>
                          <button
                            onClick={copyInviteCode}
                            className="text-[10px] font-bold text-zinc-350 hover:text-white px-2 py-0.5 bg-zinc-850 rounded border border-zinc-700 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    searchResults.map((usr) => {
                      const isOnline = onlineUsers?.includes(usr.id?.toString());
                      return (
                        <div
                          key={usr.id}
                          className="flex items-center justify-between gap-3 p-3 bg-[#1A1A22] border border-[#2B2B37] rounded-xl hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                              <Avatar user={{ fullName: usr.fullName }} size="xs" />
                              <span className={cn(
                                "absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-zinc-950",
                                isOnline ? "bg-emerald-400" : "bg-zinc-650"
                              )} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-200 truncate">{usr.username}</p>
                              <p className="text-[10px] text-zinc-550 truncate">{usr.email}</p>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {usr.isMember ? (
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                                Already Member
                              </span>
                            ) : usr.hasPendingInvite ? (
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                Invitation Sent
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSendInvite(usr.id)}
                                className="text-[10px] py-1 px-3.5 bg-indigo-500 text-white font-bold rounded-lg"
                              >
                                Invite
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
