import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Plus, Clock, Users, ArrowRight,
  Sparkles, Calendar, CheckSquare, BarChart3, AlertCircle
} from 'lucide-react';
import { projectService } from '../services/project.service';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { formatRelativeTime } from '../utils/formatDate';
import toast from 'react-hot-toast';

export function ProjectsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Check if current user is admin (owner) of the workspace
  const isAdmin = currentWorkspace?.owner?._id === user?.id || currentWorkspace?.owner === user?.id;

  const fetchProjectsWithStats = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const projRes = await projectService.getWorkspaceProjects(workspaceId);
      const projList = projRes.data.projects || [];

      const projectsWithStats = await Promise.all(
        projList.map(async (project) => {
          try {
            const boardRes = await projectService.getProjectBoard(project._id);
            const board = boardRes.data.board || { Todo: [], 'In Progress': [], Review: [], Completed: [] };

            const allTasks = [
              ...(board.Todo || []),
              ...(board['In Progress'] || []),
              ...(board.Review || []),
              ...(board.Completed || [])
            ];

            const totalTasks = allTasks.length;
            const completedTasks = (board.Completed || []).length;
            const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Get unique assignees
            const assigneesMap = {};
            allTasks.forEach(t => {
              if (t.assignedTo?._id) {
                assigneesMap[t.assignedTo._id] = t.assignedTo;
              }
            });
            const members = Object.values(assigneesMap);

            // Due soon (tasks with due dates in next 7 days)
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            const dueSoonTasks = allTasks.filter(t => {
              if (!t.dueDate || t.status === 'Completed') return false;
              const due = new Date(t.dueDate);
              return due >= now && due <= nextWeek;
            });

            return {
              ...project,
              totalTasks,
              progressPct,
              members,
              dueSoonCount: dueSoonTasks.length,
              lastUpdated: allTasks.length > 0
                ? new Date(Math.max(...allTasks.map(t => new Date(t.updatedAt || t.createdAt))))
                : new Date(project.updatedAt || project.createdAt)
            };
          } catch (err) {
            console.error('Error fetching board stats for project', project._id, err);
            return {
              ...project,
              totalTasks: 0,
              progressPct: 0,
              members: [],
              dueSoonCount: 0,
              lastUpdated: new Date(project.updatedAt || project.createdAt)
            };
          }
        })
      );
      setProjects(projectsWithStats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsWithStats();
  }, [workspaceId, currentWorkspace]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setSubmitting(true);
    try {
      await projectService.create({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        workspaceId
      });
      toast.success('Project created successfully!');
      setCreateForm({ name: '', description: '' });
      setCreateOpen(false);
      fetchProjectsWithStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5 font-medium">
            <span>Workspaces</span>
            <span>/</span>
            <span className="text-zinc-400">{currentWorkspace?.name}</span>
            <span>/</span>
            <span className="text-white font-semibold">Projects</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="text-indigo-400" size={22} />
            Projects Flow
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage project workflows, track milestones, and view team progress.</p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 font-bold shadow-lg shadow-indigo-500/10 self-start sm:self-auto"
          >
            <Plus size={14} />
            Create Project
          </Button>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto my-12 flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
            <FolderKanban className="text-zinc-650" size={24} />
          </div>
          <h3 className="text-sm font-bold text-white mb-2">No Active Projects</h3>
          <p className="text-zinc-550 text-xs leading-relaxed max-w-md mb-6">
            Projects act as containers for Kanban boards, tasks lists, sprint planning, and AI insights. Get started by setting up your first project.
          </p>
          {isAdmin ? (
            <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
              Create First Project
            </Button>
          ) : (
            <span className="text-xs text-zinc-500 font-semibold italic">Waiting for an admin to set up a project.</span>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.01] rounded-full blur-2xl pointer-events-none" />
              
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={15} className="text-indigo-400" />
                  </div>
                  <Badge variant="secondary" size="sm" className="font-bold bg-zinc-800/50 text-zinc-400">
                    {project.totalTasks || 0} task{(project.totalTasks || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-1 truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2 min-h-[32px] mb-4 leading-relaxed font-medium">
                  {project.description || 'No description provided for this project.'}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-450 uppercase tracking-wide">
                    <span>Progress</span>
                    <span className="text-zinc-200">{project.progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progressPct}%` }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-800/30">
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2">
                  {/* Members Avatars */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.members?.length > 0 ? (
                      project.members.slice(0, 4).map((member) => (
                        <div key={member._id} className="ring-2 ring-zinc-900 rounded-full">
                          <Avatar user={member} size="xs" />
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-650 font-bold italic">No assignees</span>
                    )}
                    {project.members?.length > 4 && (
                      <div className="h-5 w-5 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Due soon indicator */}
                  {project.dueSoonCount > 0 ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded-lg border border-amber-400/10">
                      <AlertCircle size={10} />
                      <span>{project.dueSoonCount} Due Soon</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-zinc-600 font-semibold">No critical deadlines</span>
                  )}
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-550 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-zinc-650">By:</span>
                    <span className="truncate max-w-[80px] font-medium">{project.createdBy?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-medium text-zinc-600">
                    <Clock size={10} />
                    <span>Updated {formatRelativeTime(project.lastUpdated)}</span>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/app/workspace/${workspaceId}/project/${project._id}`)}
                  className="w-full text-xs font-bold border border-zinc-850 hover:bg-zinc-850 text-zinc-300 hover:text-white flex items-center justify-center gap-1 mt-1"
                >
                  Open Project
                  <ArrowRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Name</label>
            <Input
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Mobile Redesign, API integration"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
            <Textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Describe project outcomes, sprint schedules, and key deliverables..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
