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
  ChevronRight, UserPlus, Play, Check, ChevronLeft, FolderKanban
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

// Stat Card with rich design & micro-interactions
function RichStatCard({ icon: Icon, label, value, sub, color = 'indigo', delay = 0 }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    red: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, borderColor: 'rgba(255, 255, 255, 0.15)' }}
      className={cn(
        "bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300"
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
      </div>
      <div className="text-3xl font-extrabold text-white tracking-tight mb-1">{value}</div>
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-1 font-medium">{sub}</div>}
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

  // Forms when no workspace selected
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!workspaceId && currentWorkspace?._id) {
      navigate(`/app/dashboard/${currentWorkspace._id}`, { replace: true });
    }
  }, [workspaceId, currentWorkspace, navigate]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    api.get(`/dashboard/workspace/${workspaceId}`)
      .then((res) => setData(res.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
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
  const onlineMemberProfiles = members.filter(m => onlineUsers?.includes(m._id?.toString()));

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
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
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
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden flex flex-col"
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

  // Greeting helper based on time
  const getGreetingText = () => {
    const hours = new Date().getHours();
    let greet = 'Good morning';
    if (hours >= 12 && hours < 17) greet = 'Good afternoon';
    if (hours >= 17) greet = 'Good evening';
    
    const extraPhrases = [
      "Ready to build something amazing today? 🚀",
      "Let's ship some high-fidelity updates! ✨",
      "Here is your workspace overview for today.",
      "Your team is active. Let's collaborate!"
    ];
    const phrase = extraPhrases[new Date().getDay() % extraPhrases.length];
    
    return { greet, phrase };
  };

  const { greet, phrase } = getGreetingText();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            <span>Workspaces</span>
            <ChevronRight size={10} className="text-zinc-650" />
            <span className="text-zinc-400">{currentWorkspace?.name}</span>
            <ChevronRight size={10} className="text-zinc-650" />
            <span className="text-indigo-400">Dashboard</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {greet}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">
            {phrase}
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={copyInviteCode}
            className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          >
            <UserPlus size={13} className="text-zinc-400 mr-1.5" />
            Invite Code: <span className="font-mono text-indigo-400 font-bold ml-1">{currentWorkspace?.inviteCode}</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/app/workspace/${workspaceId}/projects`)}
            className="text-xs"
          >
            <Plus size={13} className="mr-1.5" />
            New Project
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RichStatCard icon={CheckSquare} label="Total Tasks" value={data.totalTasks} sub={`${data.completed} completed task${data.completed !== 1 ? 's' : ''}`} color="indigo" delay={0} />
            <RichStatCard icon={TrendingUp} label="In Progress" value={data.inProgress} sub={`${data.review} in code review`} color="amber" delay={0.05} />
            <RichStatCard icon={Flame} label="Overdue Tasks" value={data.overdueTasks} sub={data.overdueTasks > 0 ? "Requires action" : "All clean!"} color="red" delay={0.1} />
            <RichStatCard icon={Users} label="Total Projects" value={data.totalProjects} sub={`${data.totalMembers} active member${data.totalMembers !== 1 ? 's' : ''}`} color="emerald" delay={0.15} />
          </div>

          {/* Progress bar / Sprint Health */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Workspace Health & Sprint Progress</h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">Task completion rate across all active projects</p>
              </div>
              <span className="text-2xl font-extrabold text-indigo-400">{data.completionPercentage}%</span>
            </div>
            <div className="h-2.5 bg-zinc-800/60 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.completionPercentage}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-4 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-zinc-650" />Todo: {data.todo}</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" />In Progress: {data.inProgress}</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" />Review: {data.review}</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" />Completed: {data.completed}</div>
            </div>
          </motion.div>

          {/* Asymmetric layout 1: AI Productivity & Online Members */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* AI Productivity (2/3 width) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 bg-gradient-to-br from-indigo-950/20 to-purple-950/10 border border-indigo-950/40 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
                    <Sparkles size={11} />
                    AI Copilot Optimization
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wide">AI Productivity Analysis</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Automated insights and code acceleration metrics</p>
                </div>
                <Badge variant="indigo" size="sm">Active</Badge>
              </div>

              {/* Grid of AI stats */}
              <div className="grid grid-cols-3 gap-4 my-4">
                <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-indigo-300">84%</div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">Acceptance</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-purple-300">14.5h</div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">Hours Saved</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-pink-300">62</div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">AI Suggestions</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 mt-2">
                <span>Next automated sprint report: July 5th</span>
                <button
                  onClick={() => toast.success("AI is currently scanning code for optimizations.")}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  Configure AI Rules
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>

            {/* Online Members (1/3 width) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide mb-3 flex items-center justify-between">
                  <span>Online Members</span>
                  <Badge variant="success" size="sm">{onlineMemberProfiles.length} online</Badge>
                </h3>
                <div className="space-y-3 max-h-[160px] overflow-y-auto scrollbar-none">
                  {members.map((m) => {
                    const isOnline = onlineUsers?.includes(m._id?.toString());
                    return (
                      <div key={m._id} className="flex items-center gap-2.5">
                        <div className="relative">
                          <Avatar user={m} size="xs" />
                          <span className={cn(
                            "absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-zinc-950",
                            isOnline ? "bg-emerald-400" : "bg-zinc-650"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{m.fullName}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{isOnline ? 'Active now' : 'Offline'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/50">
                <button
                  onClick={copyInviteCode}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus size={13} />
                  Invite Collaborators
                </button>
              </div>
            </motion.div>
          </div>

          {/* Asymmetric layout 2: Recent Projects & Upcoming Deadlines */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Projects (2/3 width) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Projects</h3>
                <button
                  onClick={() => navigate(`/app/workspace/${workspaceId}/projects`)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  All Projects
                  <ArrowRight size={12} />
                </button>
              </div>

              {projects.length === 0 ? (
                /* Improved Empty State */
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 border-dashed rounded-2xl p-8 text-center flex flex-col items-center">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                    <FolderKanban size={18} className="text-zinc-500" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">No Projects in Workspace</h4>
                  <p className="text-zinc-500 text-[11px] max-w-xs mb-4">
                    Get started by setting up your first project container to organize tasks.
                  </p>
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
                <div className="grid sm:grid-cols-2 gap-3">
                  {projects.slice(0, 4).map((project, i) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      onClick={() => navigate(`/app/workspace/${workspaceId}/project/${project._id}`)}
                      className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <FolderKanban size={13} className="text-indigo-400" />
                        </div>
                        <Badge variant="default" size="sm">{project.tasks?.length || 0} tasks</Badge>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{project.name}</h4>
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{project.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-2 border-t border-zinc-800/30">
                        <span>Created {formatRelativeTime(project.createdAt)}</span>
                        <span>Open Details →</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines (1/3 width) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Upcoming Deadlines</h3>

              {deadlines.length === 0 ? (
                /* Improved Empty State */
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 border-dashed rounded-2xl p-8 text-center flex flex-col items-center h-[230px] justify-center">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                    <Calendar size={18} className="text-zinc-500" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">No Deadlines</h4>
                  <p className="text-zinc-500 text-[11px] max-w-xs mb-3">
                    No upcoming tasks with due dates. Let's create one or ask AI.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (projects[0]) {
                        navigate(`/app/workspace/${workspaceId}/project/${projects[0]._id}`);
                      } else {
                        navigate(`/app/workspace/${workspaceId}/projects`);
                      }
                    }}
                    className="text-xs font-bold border border-zinc-850 hover:bg-zinc-850"
                  >
                    Add Task Deadline
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {deadlines.map((task) => {
                    const p = getPriorityConfig(task.priority);
                    return (
                      <div
                        key={task._id}
                        className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase", p.bg, p.color)}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {task.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-zinc-200 truncate" title={task.title}>
                            {task.title}
                          </h4>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {task.dueDate ? (
                            (() => {
                              const dueDateObj = formatDueDate(task.dueDate);
                              return (
                                <p className={cn("text-[10px] font-bold", dueDateObj?.color || 'text-indigo-400')}>
                                  {dueDateObj?.label}
                                </p>
                              );
                            })()
                          ) : (
                            <p className="text-[10px] font-bold text-zinc-550">No date</p>
                          )}
                          <p className="text-[9px] text-zinc-500 mt-0.5">Due Date</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Asymmetric layout 3: Team Activity & Team Workload */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Team Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5"
            >
              <h3 className="text-sm font-bold text-white tracking-wide mb-4 flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Team Activity Stream
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                {data.recentActivity?.length === 0 ? (
                  /* Improved Empty State */
                  <div className="text-center py-10 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                      <Activity size={16} className="text-zinc-550" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-400">Quiet workspace</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">
                      No activity recorded yet. Activity shows up as tasks are created and updated.
                    </p>
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
                          <span className="font-bold text-zinc-100">{activity.user?.fullName}</span>
                          {' '}{activity.description}
                        </p>
                        <p className="text-[10px] text-zinc-550 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Team Workload */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5"
            >
              <h3 className="text-sm font-bold text-white tracking-wide mb-4 flex items-center gap-2">
                <Users size={14} className="text-violet-400" />
                Team Load Distribution
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                {data.memberWorkload?.length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                      <Users size={16} className="text-zinc-550" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-400">No Assigned Tasks</p>
                    <p className="text-[10px] text-zinc-550 mt-1 max-w-xs">
                      Once tasks are assigned to team members, workload charts will render here.
                    </p>
                  </div>
                ) : (
                  data.memberWorkload?.map((member, i) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <Avatar user={{ fullName: member.fullName }} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-zinc-200 truncate">{member.fullName}</span>
                          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">{member.totalTasks} task{member.totalTasks !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((member.totalTasks / (data.totalTasks || 1)) * 100, 100)}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
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

          {/* Priority Breakdown bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5"
          >
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Task Priority Breakdown</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(data.priority || {}).map(([p, count]) => {
                const config = getPriorityConfig(p);
                return (
                  <div key={p} className="text-center bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl hover:border-zinc-800 transition-colors">
                    <div className={cn("text-2xl font-extrabold", config.color)}>{count}</div>
                    <div className={cn("text-[9px] uppercase font-bold tracking-wider mt-1.5", config.color)}>{p}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
