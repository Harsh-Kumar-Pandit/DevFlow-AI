import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Copy, Users, FolderKanban, Plus, Check, Crown,
  UserMinus, LogOut, ClipboardList, Settings2, Trash2, ArrowRight,
  Shield, Activity, Bell
} from 'lucide-react';
import { workspaceService } from '../services/workspace.service';
import { projectService } from '../services/project.service';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { formatRelativeTime } from '../utils/formatDate';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

export function WorkspacePage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const { joinWorkspace, leaveWorkspace, onlineUsers } = useSocket() || {};
  const { fetchWorkspaces, workspaces } = useWorkspace();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Leave & delete workspace modal confirmations
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const isOwner = workspace?.owner?._id === user?.id || workspace?.owner === user?.id;

  useEffect(() => {
    if (!workspaceId) return;
    joinWorkspace?.(workspaceId);
    loadData();
    return () => leaveWorkspace?.(workspaceId);
  }, [workspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wsRes, projRes, dashRes] = await Promise.all([
        workspaceService.getMyWorkspaces(),
        projectService.getWorkspaceProjects(workspaceId),
        api.get(`/dashboard/workspace/${workspaceId}`).catch(() => null)
      ]);

      const ws = wsRes.data.workspaces?.find((w) => w._id === workspaceId);
      setWorkspace(ws);
      setProjects(projRes.data.projects || []);

      if (dashRes && dashRes.data?.dashboard) {
        setActivities(dashRes.data.dashboard.recentActivity || []);
      }

      if (ws && (ws.owner?._id === user?.id || ws.owner === user?.id)) {
        const reqRes = await workspaceService.getJoinRequests(workspaceId);
        setRequests(reqRes.data.requests || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(workspace?.inviteCode || '');
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name) return;
    setCreating(true);
    try {
      await projectService.create({ ...projectForm, workspaceId });
      toast.success('Project created!');
      setCreateProjectOpen(false);
      setProjectForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await workspaceService.acceptJoinRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success('Member added!');
      loadData();
    } catch (err) {
      toast.error('Failed to accept join request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await workspaceService.rejectJoinRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success('Request rejected');
    } catch (err) {
      toast.error('Failed to reject join request');
    }
  };

  const handleLeaveWorkspace = async () => {
    setSubmittingAction(true);
    try {
      await workspaceService.leaveWorkspace(workspaceId);
      toast.success('Successfully left the workspace');
      setConfirmLeaveOpen(false);
      await fetchWorkspaces();
      // Redirect to remaining workspace dashboard or setup onboarding
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave workspace');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setSubmittingAction(true);
    try {
      await workspaceService.deleteWorkspace(workspaceId);
      toast.success('Workspace deleted successfully');
      setConfirmDeleteOpen(false);
      await fetchWorkspaces();
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Compile list of workspace members from workload and owners
  const getWorkspaceMembers = () => {
    const list = [];
    const ids = new Set();

    // Owner
    if (workspace?.owner) {
      const o = workspace.owner;
      list.push({ _id: o._id, fullName: o.fullName, email: o.email, isOwner: true });
      ids.add(o._id.toString());
    }

    // Current user
    if (user && !ids.has(user.id || user._id)) {
      list.push({ _id: user.id || user._id, fullName: user.fullName, email: user.email, isOwner: false });
      ids.add((user.id || user._id).toString());
    }

    // Members from workloads or text list
    if (workspace?.members) {
      workspace.members.forEach((memberId) => {
        const idStr = typeof memberId === 'object' ? memberId._id?.toString() : memberId.toString();
        if (idStr && !ids.has(idStr)) {
          list.push({ _id: idStr, fullName: memberId.fullName || `User ${idStr.slice(-4)}`, email: memberId.email, isOwner: false });
          ids.add(idStr);
        }
      });
    }

    return list;
  };

  const members = getWorkspaceMembers();

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 md:p-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0 shadow-lg shadow-indigo-500/20">
              {workspace?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{workspace?.name}</h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-md">{workspace?.description || 'No description provided.'}</p>
              <div className="flex items-center gap-2.5 mt-3">
                <Badge variant="indigo" dot>{projects.length} project{projects.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="default" dot>{members.length} member{members.length !== 1 ? 's' : ''}</Badge>
                {isOwner && <Badge variant="warning"><Shield size={10} className="mr-1" /> Owner Account</Badge>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/app/dashboard/${workspaceId}`)}
              className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              Open Dashboard
              <ArrowRight size={13} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Asymmetrical 2-Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <FolderKanban size={14} className="text-indigo-400" />
                Active Projects
              </h2>
              {isOwner && (
                <Button size="sm" variant="primary" onClick={() => setCreateProjectOpen(true)} className="text-xs">
                  <Plus size={13} className="mr-1" />
                  New Project
                </Button>
              )}
            </div>

            {projects.length === 0 ? (
              /* Improved Empty State */
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 border-dashed rounded-2xl p-12 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-zinc-850 flex items-center justify-center mb-4">
                  <FolderKanban size={22} className="text-zinc-555" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">No Projects Created Yet</h3>
                <p className="text-zinc-500 text-xs max-w-sm mb-5 leading-relaxed">
                  Projects are containers for task boards, calendar schedules, and AI analytics. Generate one now to start coding.
                </p>
                {isOwner ? (
                  <Button size="sm" variant="primary" onClick={() => setCreateProjectOpen(true)}>
                    Create First Project
                  </Button>
                ) : (
                  <span className="text-xs text-zinc-500 font-medium">Wait for the workspace owner to create projects.</span>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.map((project, i) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    onClick={() => navigate(`/app/workspace/${workspaceId}/project/${project._id}`)}
                    className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between h-44 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center transition-colors group-hover:bg-indigo-500/20">
                        <FolderKanban size={15} className="text-indigo-400" />
                      </div>
                      <Badge variant="default" size="sm">{project.tasks?.length || 0} tasks</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{project.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{project.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-3 border-t border-zinc-800/40 mt-1">
                      <span className="font-semibold">Created {formatRelativeTime(project.createdAt)}</span>
                      <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open Project <ArrowRight size={10} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity stream inside Workspace overview */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-purple-400" />
              Recent Updates
            </h2>
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-5 space-y-4 max-h-[340px] overflow-y-auto scrollbar-none">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-550 font-medium">No activity registered.</div>
              ) : (
                activities.slice(0, 5).map((act, i) => (
                  <div key={act._id || i} className="flex items-start gap-3 relative group">
                    {i !== activities.length - 1 && (
                      <span className="absolute top-6 bottom-0 left-[11px] w-px bg-zinc-800/40" />
                    )}
                    <Avatar user={act.user} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300">
                        <span className="font-bold text-zinc-200">{act.user?.fullName}</span>
                        {' '}{act.description}
                      </p>
                      <p className="text-[10px] text-zinc-550 mt-0.5">{formatRelativeTime(act.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Invite Code Panel */}
          <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.01] rounded-full blur-xl pointer-events-none" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Invite Collaborators</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Share this unique invite code with your teammates. They can enter it in their workspace switcher to request access.
            </p>
            <div className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <code className="text-xs font-mono font-extrabold text-indigo-400 tracking-wider">{workspace?.inviteCode}</code>
              <button
                onClick={copyInviteCode}
                className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                title="Copy Code"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* Members Panel */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={13} />
                Workspace Members
              </h3>
              <span className="text-[10px] font-bold bg-zinc-800 text-zinc-450 px-2 py-0.5 rounded-lg">{members.length}</span>
            </div>
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto scrollbar-none">
              {members.map((member) => {
                const isOnline = onlineUsers?.includes(member._id?.toString());
                return (
                  <div key={member._id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <Avatar user={member} size="xs" />
                        <span className={cn(
                          "absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-zinc-950",
                          isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-650"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{member.fullName}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{isOnline ? 'Online now' : 'Offline'}</p>
                      </div>
                    </div>
                    {member.isOwner && (
                      <Badge variant="warning" size="sm" className="flex items-center gap-0.5">
                        <Crown size={9} />
                        Owner
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Requests Panel (Owner Only) */}
          {isOwner && requests.length > 0 && (
            <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Bell size={13} className="text-indigo-400" />
                  Join Requests
                </h3>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg">{requests.length}</span>
              </div>
              <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-none">
                {requests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between gap-3 p-2 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 truncate">{req.user?.fullName}</p>
                      <p className="text-[9px] text-zinc-550 truncate">@{req.user?.username}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req._id)}
                        className="h-7 w-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/10 transition-colors"
                        title="Accept request"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req._id)}
                        className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/10 transition-colors"
                        title="Decline request"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone / Admin Actions */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/60 pb-3 flex items-center gap-1.5">
              <Settings2 size={13} />
              Danger Zone Settings
            </h3>
            <div className="space-y-2">
              {!isOwner ? (
                <button
                  onClick={() => setConfirmLeaveOpen(true)}
                  className="w-full py-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={13} />
                  Leave Workspace
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="w-full py-2 bg-red-500/5 hover:bg-red-500/10 text-red-450 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={13} />
                  Delete Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <Input
            label="Project Name"
            placeholder="e.g. Mobile Application / UI Redesign"
            value={projectForm.name}
            onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Short details on goals and tasks..."
            rows={3}
            value={projectForm.description}
            onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateProjectOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating}>Create Project</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Leave Workspace Modal */}
      <Modal open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)} title="Leave Workspace">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Are you sure you want to leave <span className="font-bold text-white">"{workspace?.name}"</span>? You will lose access to all its boards, tasks, and communications, and will need a new invite code to rejoin.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmLeaveOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleLeaveWorkspace} loading={submittingAction}>
              Yes, Leave Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Workspace Modal */}
      <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="Delete Workspace">
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
            <Trash2 size={16} className="flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Warning:</strong> Deleting a workspace is permanent and cannot be undone. All projects, tasks, comments, and attachments will be deleted immediately.
            </p>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Please confirm you want to delete <span className="font-bold text-white">"{workspace?.name}"</span>.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteWorkspace} loading={submittingAction}>
              Yes, Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
