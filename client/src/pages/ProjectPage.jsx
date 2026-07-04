import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, LayoutDashboard, CheckSquare, BarChart3, Sparkles, ArrowRight,
  Calendar as CalIcon, Users, Clock, Plus, Search, Filter, Trash2, Paperclip,
  BookOpen, Wand2, FileText, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, AlertCircle,
  FileUp, CalendarRange, ListTodo, Edit2
} from 'lucide-react';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { aiService } from '../services/ai.service';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { Input, Textarea } from '../components/ui/Input';
import { TaskDrawer } from '../components/task/TaskDrawer';
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { TaskCard } from '../components/kanban/TaskCard';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { getPriorityConfig } from '../utils/getPriorityColor';
import { formatRelativeTime, formatDate } from '../utils/formatDate';
import toast from 'react-hot-toast';
import api from '../services/api';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { cn } from '../utils/cn';

const TABS = ['Overview', 'Tasks', 'Kanban', 'Calendar', 'Files', 'Activity', 'AI Summary'];
const COLUMNS = [
  { id: 'Todo', title: 'To Do', color: 'border-t-zinc-500' },
  { id: 'In Progress', title: 'In Progress', color: 'border-t-amber-500' },
  { id: 'Review', title: 'In Review', color: 'border-t-indigo-500' },
  { id: 'Completed', title: 'Completed', color: 'border-t-emerald-500' },
];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export function ProjectPage(props) {
  return (
    <ErrorBoundary>
      <ProjectPageContent {...props} />
    </ErrorBoundary>
  );
}

function ProjectPageContent({ defaultTab }) {
  const { projectId, workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { socket } = useSocket() || {};

  const [project, setProject] = useState(null);
  const [board, setBoard] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  // Shared Task Drawer / Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState('Todo');

  // Tasks Tab filters
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Kanban Drag States
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Calendar States
  const [calendarDate, setCalendarDate] = useState(new Date());

  // AI Tab States
  const [aiAction, setAIAction] = useState('Project Summary'); // Project Summary, Sprint Summary, Generate Tasks, Generate README
  const [aiOutput, setAIOutput] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [selectedGenTasks, setSelectedGenTasks] = useState({});

  const isAdmin = currentWorkspace?.owner?._id === user?.id || currentWorkspace?.owner === user?.id;

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      const [projRes, boardRes, actRes] = await Promise.all([
        projectService.getProject(projectId),
        projectService.getProjectBoard(projectId),
        api.get(`/activity/project/${projectId}`)
      ]);
      setProject(projRes.data.project);
      setBoard(boardRes.data.board);
      setActivities(actRes.data.activities || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Handle default tab presets from route
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Socket updates
  useEffect(() => {
    if (!socket || !workspaceId) return;
    const handleStatusUpdated = () => {
      fetchProjectData();
    };
    socket.on('task-status-updated', handleStatusUpdated);
    return () => socket.off('task-status-updated', handleStatusUpdated);
  }, [socket, workspaceId]);

  // Calculations
  const allTasks = board
    ? [
        ...(board.Todo || []),
        ...(board['In Progress'] || []),
        ...(board.Review || []),
        ...(board.Completed || []),
      ]
    : [];

  const totalTasksCount = allTasks.length;
  const completedTasksCount = board?.Completed?.length || 0;
  const completionPct = totalTasksCount ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Flattened last activity timestamp
  const lastActivityTime = activities.length > 0 
    ? new Date(activities[0].createdAt)
    : project?.updatedAt ? new Date(project.updatedAt) : new Date();

  // Unique Members Roster
  const assigneesMap = {};

  if (currentWorkspace?.owner) {
    const ownerId = currentWorkspace.owner._id || currentWorkspace.owner;
    assigneesMap[ownerId] = {
      _id: ownerId,
      fullName: currentWorkspace.owner.fullName || 'Workspace Owner',
      username: currentWorkspace.owner.username || 'owner',
      email: currentWorkspace.owner.email
    };
  }

  if (user) {
    const userId = user.id || user._id;
    assigneesMap[userId] = {
      _id: userId,
      fullName: user.fullName || 'You',
      username: user.username || 'you',
      email: user.email
    };
  }

  allTasks.forEach(t => {
    if (t.assignedTo?._id) {
      assigneesMap[t.assignedTo._id] = t.assignedTo;
    }
  });
  const projectMembers = Object.values(assigneesMap);

  // Kanban drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggingTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!draggingTask || draggingTask.status === targetColumn) {
      setDraggingTask(null);
      setDragOverColumn(null);
      return;
    }

    const task = draggingTask;
    setDraggingTask(null);
    setDragOverColumn(null);

    // Optimistic Update
    setBoard((prev) => {
      const newBoard = { ...prev };
      newBoard[task.status] = newBoard[task.status].filter((t) => t._id !== task._id);
      newBoard[targetColumn] = [{ ...task, status: targetColumn }, ...newBoard[targetColumn]];
      return newBoard;
    });

    try {
      await taskService.updateTaskStatus(task._id, targetColumn);
      fetchProjectData();
    } catch {
      toast.error('Failed to update task status');
      fetchProjectData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success("Task deleted successfully");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // Calendar Helpers
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    return days;
  };

  const getTasksForDay = (dayDate) => {
    if (!dayDate) return [];
    return allTasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getDate() === dayDate.getDate() &&
             d.getMonth() === dayDate.getMonth() &&
             d.getFullYear() === dayDate.getFullYear();
    });
  };

  // AI Tab Handlers
  const handleRunAIAction = async () => {
    setAILoading(true);
    setAIOutput('');
    try {
      if (aiAction === 'Project Summary') {
        const res = await aiService.projectSummary(projectId);
        setAIOutput(res.data.summary);
      } else if (aiAction === 'Sprint Summary') {
        const res = await aiService.sprintSummary(workspaceId);
        setAIOutput(res.data.summary);
      } else if (aiAction === 'Generate README') {
        const res = await aiService.chat(workspaceId, `Write a professional, comprehensive README.md in markdown format for the project: "${project?.name}". Details: "${project?.description}". Tasks: ${JSON.stringify(allTasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })))}`);
        setAIOutput(res.data.answer);
      }
    } catch {
      toast.error('AI invocation failed');
    } finally {
      setAILoading(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!generatePrompt.trim()) return;
    setAILoading(true);
    setGeneratedTasks([]);
    try {
      const res = await aiService.breakTask(`Create list of required developer tasks for feature: ${generatePrompt}`);
      const list = res.data.subtasks || [];
      setGeneratedTasks(list);
      
      // Auto select all
      const selects = {};
      list.forEach((t, i) => { selects[i] = true; });
      setSelectedGenTasks(selects);
    } catch {
      toast.error('Task generation failed');
    } finally {
      setAILoading(false);
    }
  };

  const handleBulkCreateTasks = async () => {
    const toCreate = generatedTasks.filter((_, i) => selectedGenTasks[i]);
    if (toCreate.length === 0) return;
    setAILoading(true);
    try {
      await Promise.all(
        toCreate.map(title =>
          taskService.create({
            title,
            description: 'Created automatically by AI task generator.',
            priority: 'Medium',
            status: 'Todo',
            projectId
          })
        )
      );
      toast.success(`Successfully created ${toCreate.length} tasks!`);
      setGeneratedTasks([]);
      setGeneratePrompt('');
      fetchProjectData();
    } catch {
      toast.error('Failed to create some tasks');
    } finally {
      setAILoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mb-2 animate-bounce">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <h2 className="text-lg font-bold text-white">Project Not Found or Access Denied</h2>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          You don't have permission to access this project, or the project does not exist. Please check your active workspace.
        </p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs font-bold border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-white">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* 1. Hero / Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-3xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span>Workspaces</span>
              <span>/</span>
              <span>{currentWorkspace?.name}</span>
              <span>/</span>
              <span className="text-white font-semibold">Projects</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <FolderKanban className="text-indigo-400" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">{project?.name}</h1>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-2xl">{project?.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-650 font-bold">Created By:</span>
                <Avatar user={project?.createdBy} size="xs" />
                <span className="font-semibold">{project?.createdBy?.fullName}</span>
              </div>
              <span className="text-zinc-700">•</span>
              <div className="flex items-center gap-1">
                <Clock size={11} className="text-zinc-550" />
                <span>Last activity {formatRelativeTime(lastActivityTime)}</span>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-zinc-950/20 border border-zinc-850 rounded-2xl p-4 min-w-[200px] flex flex-col justify-center">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Project Assignees</h4>
            <div className="flex -space-x-1.5 overflow-hidden">
              {projectMembers.length > 0 ? (
                projectMembers.slice(0, 5).map((member) => (
                  <div key={member._id} className="ring-2 ring-zinc-900 rounded-full" title={member.fullName}>
                    <Avatar user={member} size="xs" />
                  </div>
                ))
              ) : (
                <span className="text-[10px] text-zinc-600 font-semibold italic">Unassigned</span>
              )}
              {projectMembers.length > 5 && (
                <div className="h-5 w-5 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                  +{projectMembers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress & Stat Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-zinc-800/40">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Project Progress</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-zinc-850 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" style={{ width: `${completionPct}%` }} />
              </div>
              <span className="text-xs font-bold text-white">{completionPct}%</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">Total Tasks</span>
            <span className="text-sm font-bold text-white">{totalTasksCount}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest block">Completed</span>
            <span className="text-sm font-bold text-emerald-400">{completedTasksCount}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest block">In Progress</span>
            <span className="text-sm font-bold text-amber-400">{board?.['In Progress']?.length || 0}</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Navigation Tabs */}
      <div className="border-b border-zinc-800/60">
        <div className="flex flex-wrap gap-1 -mb-px">
          {TABS.map((tab) => {
            let Icon = FolderKanban;
            if (tab === 'Overview') Icon = BarChart3;
            if (tab === 'Tasks') Icon = CheckSquare;
            if (tab === 'Kanban') Icon = LayoutDashboard;
            if (tab === 'Calendar') Icon = CalIcon;
            if (tab === 'Files') Icon = Paperclip;
            if (tab === 'Activity') Icon = Clock;
            if (tab === 'AI Summary') Icon = Sparkles;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2',
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]'
                    : 'border-transparent text-zinc-550 hover:text-zinc-300'
                )}
              >
                <Icon size={13} />
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Views Router */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2 space-y-6">
                {/* About card */}
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">About this project</h3>
                  <p className="text-sm text-zinc-350 leading-relaxed whitespace-pre-wrap">
                    {project?.description || 'No description has been written for this project yet. Edit project properties to document features and scope.'}
                  </p>
                </div>

                {/* Task Breakdown stats */}
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Milestone breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Todo', count: board?.Todo?.length || 0, color: 'bg-zinc-800 text-zinc-400 border-zinc-700/50' },
                      { label: 'In Progress', count: board?.['In Progress']?.length || 0, color: 'bg-amber-500/10 text-amber-400 border-amber-500/10' },
                      { label: 'In Review', count: board?.Review?.length || 0, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10' },
                      { label: 'Completed', count: board?.Completed?.length || 0, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' }
                    ].map((col) => (
                      <div key={col.label} className={cn("p-4 border rounded-xl flex flex-col items-center justify-center text-center", col.color)}>
                        <span className="text-xl font-black">{col.count}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{col.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar overview controls */}
              <div className="space-y-6">
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quick links</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('Kanban')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-850 rounded-xl transition-all text-xs font-bold"
                    >
                      <span className="flex items-center gap-2"><LayoutDashboard size={13} className="text-indigo-400" /> Go to Board</span>
                      <ArrowRight size={11} className="text-zinc-600" />
                    </button>
                    <button
                      onClick={() => setActiveTab('Calendar')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-850 rounded-xl transition-all text-xs font-bold"
                    >
                      <span className="flex items-center gap-2"><CalIcon size={13} className="text-violet-400" /> View Schedule</span>
                      <ArrowRight size={11} className="text-zinc-600" />
                    </button>
                    <button
                      onClick={() => setActiveTab('AI Summary')}
                      className="w-full flex items-center justify-between p-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-xl transition-all text-xs font-bold text-indigo-400"
                    >
                      <span className="flex items-center gap-2"><Sparkles size={13} className="text-indigo-400 animate-pulse" /> Ask DevFlow AI</span>
                      <ArrowRight size={11} className="text-indigo-500" />
                    </button>
                  </div>
                </div>

                {/* Audit preview */}
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent activities</h3>
                  <div className="space-y-3">
                    {activities.slice(0, 3).map((act, i) => (
                      <div key={i} className="flex gap-2.5 items-start text-[11px] leading-relaxed">
                        <Avatar user={act.user} size="xs" className="mt-0.5" />
                        <div>
                          <p className="text-zinc-300"><span className="font-bold text-zinc-200">{act.user?.fullName}</span> {act.description}</p>
                          <span className="text-[9px] text-zinc-650 font-bold">{formatRelativeTime(act.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <span className="text-xs text-zinc-600 font-semibold italic">No logged activity</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tasks List Tab */}
          {activeTab === 'Tasks' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <div className="relative w-full max-w-[400px]">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks by title, description..."
                    className="w-full bg-[#0b0b0f] border border-zinc-800/80 rounded-2xl h-10 pl-10 pr-4 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 shadow-sm transition-all"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#0b0b0f] border border-zinc-800/80 rounded-xl h-9 pl-3 pr-8 text-[11px] font-bold text-zinc-300 outline-none focus:border-indigo-500/50 appearance-none shadow-sm cursor-pointer hover:bg-zinc-900 transition-colors"
                    >
                      <option value="">All Statuses</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">In Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="bg-[#0b0b0f] border border-zinc-800/80 rounded-xl h-9 pl-3 pr-8 text-[11px] font-bold text-zinc-300 outline-none focus:border-indigo-500/50 appearance-none shadow-sm cursor-pointer hover:bg-zinc-900 transition-colors"
                    >
                      <option value="">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>

                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => { setCreateDefaultStatus('Todo'); setCreateModalOpen(true); }}
                      className="h-9 font-bold px-4 rounded-xl ml-2 shadow-lg shadow-indigo-500/20 text-[11px]"
                    >
                      <Plus size={13} className="mr-1.5" /> Add Task
                    </Button>
                  )}
                  
                  <button className="h-9 w-9 ml-1 flex items-center justify-center rounded-xl bg-[#0b0b0f] border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900 shadow-sm transition-colors cursor-pointer">
                    <Filter size={13} />
                  </button>
                </div>
              </div>

              {/* Tasks List Renders */}
              <div className="bg-[#0b0b0f] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] text-zinc-300 uppercase tracking-widest font-black bg-zinc-950/20">
                        <th className="p-4 w-10 text-center"><div className="h-3.5 w-3.5 rounded bg-transparent border-2 border-zinc-800 mx-auto"></div></th>
                        <th className="p-4">Task</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Assignee</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {allTasks
                        .filter(t => {
                          const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
                          const matchesStatus = statusFilter ? t.status === statusFilter : true;
                          const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
                          return matchesSearch && matchesStatus && matchesPriority;
                        })
                        .map((task) => {
                          const prio = getPriorityConfig(task.priority);
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                          return (
                            <tr
                              key={task._id}
                              className="hover:bg-zinc-900/40 cursor-pointer transition-colors group bg-transparent"
                              onClick={() => { setSelectedTask(task); setTaskDrawerOpen(true); }}
                            >
                              <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="h-3.5 w-3.5 rounded bg-transparent border-2 border-zinc-700 mx-auto cursor-pointer hover:border-indigo-500 transition-colors"></div>
                              </td>
                              <td className="p-4 flex gap-3.5 items-start min-w-[300px]">
                                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <FileText size={15} className="text-indigo-400" />
                                </div>
                                <div className="flex flex-col gap-1 w-full whitespace-normal">
                                  <span className="font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors text-[13px]">{task.title}</span>
                                  {task.description && (
                                    <span className="text-[11px] text-zinc-500 line-clamp-1">{task.description}</span>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    {task.tags?.slice(0,2).map(tag => (
                                      <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-500/10 text-indigo-400">
                                        {tag}
                                      </span>
                                    ))}
                                    <span className="text-[10px] text-zinc-500 font-bold hover:text-white transition-colors flex items-center gap-1"><Plus size={10}/> Add tag</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                                  <span className={cn("h-1.5 w-1.5 rounded-full", 
                                    task.status === 'Completed' ? 'bg-emerald-500' :
                                    task.status === 'In Progress' ? 'bg-amber-500' :
                                    task.status === 'Review' ? 'bg-indigo-500' : 'bg-zinc-500'
                                  )} />
                                  {task.status}
                                  <ChevronDown size={11} className="text-zinc-500 ml-1" />
                                </div>
                              </td>
                              <td className="p-4">
                                <div className={cn("inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-bold", prio.color)}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
                                  {task.priority}
                                  <ChevronDown size={11} className={cn("ml-1", prio.color)} style={{ opacity: 0.5 }} />
                                </div>
                              </td>
                              <td className="p-4">
                                {task.assignedTo ? (
                                  <div className="flex items-center gap-2.5">
                                    <Avatar user={task.assignedTo} size="xs" className="h-6 w-6 text-[10px] ring-2 ring-zinc-900" />
                                    <span className="font-bold text-zinc-200 text-[12px]">{task.assignedTo.fullName || task.assignedTo.username}</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-zinc-600 font-bold italic">Unassigned</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 text-zinc-200 font-bold text-[11px]">
                                    <CalIcon size={13} className="text-zinc-500" />
                                    {task.dueDate ? formatDate(task.dueDate, 'MMM d, yyyy') : 'No due date'}
                                  </div>
                                  {task.dueDate && (
                                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full w-fit tracking-wide", isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-zinc-800/80 text-zinc-400")}>
                                      {isOverdue ? 'Overdue' : `Due in ${Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days`}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setTaskDrawerOpen(true); }}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/50 text-indigo-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all shadow-sm"
                                    title="Edit Task"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/50 text-rose-500 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all shadow-sm"
                                    title="Delete Task"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {allTasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500 font-bold text-xs italic">
                            No tasks found matching criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Footer Pagination */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800/80 bg-zinc-950/20">
                  <span className="text-[11px] text-zinc-500 font-semibold">
                    Showing <span className="font-bold text-white">{allTasks.length}</span> of {allTasks.length} task{allTasks.length !== 1 && 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="h-8 w-8 rounded-lg border border-zinc-800/80 bg-zinc-900/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                      <ChevronLeft size={14} />
                    </button>
                    <button className="h-8 w-8 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-[12px]">
                      1
                    </button>
                    <button className="h-8 w-8 rounded-lg border border-zinc-800/80 bg-zinc-900/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Kanban Tab — Jira/Linear style: page locked, columns scroll independently */}
          {activeTab === 'Kanban' && (
            <KanbanBoard
              board={board}
              draggingTask={draggingTask}
              dragOverColumn={dragOverColumn}
              isAdmin={isAdmin}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              setDragOverColumn={setDragOverColumn}
              setSelectedTask={setSelectedTask}
              setTaskDrawerOpen={setTaskDrawerOpen}
              onCreateTaskClick={(status) => { setCreateDefaultStatus(status); setCreateModalOpen(true); }}
            />
          )}

          {/* Calendar Tab */}
          {activeTab === 'Calendar' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/20 border border-zinc-850 rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-850 bg-zinc-950/20">
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarRange size={13} className="text-violet-400 animate-pulse" />
                    Month Schedule
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevMonth} className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-850 transition-colors">
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-xs font-bold text-white px-2">
                    {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                  </span>
                  <button onClick={handleNextMonth} className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-850 transition-colors">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-zinc-855 text-center text-[10px] font-bold text-zinc-650 uppercase py-2 bg-zinc-950/10 tracking-widest">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 bg-zinc-950/10">
                {getCalendarDays().map((cell, i) => {
                  const dayTasks = getTasksForDay(cell.date);
                  const isToday = cell.isCurrentMonth &&
                                  new Date().getDate() === cell.day &&
                                  new Date().getMonth() === calendarDate.getMonth() &&
                                  new Date().getFullYear() === calendarDate.getFullYear();

                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[100px] border-b border-r border-zinc-855/65 p-2 flex flex-col justify-between transition-colors",
                        (i + 1) % 7 === 0 && "border-r-0",
                        cell.isCurrentMonth ? "hover:bg-zinc-900/20" : "opacity-25 bg-zinc-950/50 pointer-events-none",
                        isToday && "bg-indigo-500/[0.02]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full",
                          isToday ? "bg-indigo-500 text-white font-black" : "text-zinc-550"
                        )}>
                          {cell.day}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[8px] font-bold text-zinc-600 bg-zinc-850 px-1 rounded">
                            {dayTasks.length} task{(dayTasks.length) !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 mt-2 flex-1 overflow-y-auto scrollbar-none max-h-[70px]">
                        {dayTasks.map(t => {
                          const prio = getPriorityConfig(t.priority);
                          return (
                            <button
                              key={t._id}
                              onClick={() => { setSelectedTask(t); setTaskDrawerOpen(true); }}
                              className={cn(
                                "w-full text-left text-[9px] font-bold p-1 rounded border truncate block transition-all hover:translate-x-0.5",
                                prio.bg, prio.color, prio.border
                              )}
                              title={t.title}
                            >
                              {t.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Files Tab */}
          {activeTab === 'Files' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/20 border border-zinc-85 border-dashed rounded-3xl p-16 text-center max-w-xl mx-auto my-6 flex flex-col items-center justify-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
                <FileUp className="text-zinc-600 animate-pulse" size={26} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Workspace File Vault</h3>
              <p className="text-zinc-550 text-xs leading-relaxed max-w-sm mb-6">
                Cloud-native file attachment hosting, design system versions, and document stores. Connect your Figma pages directly to DevFlow task cards.
              </p>
              <div className="bg-zinc-900/50 border border-zinc-800/80 px-4 py-2.5 rounded-xl text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Coming in version 2.0
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === 'Activity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/20 border border-zinc-850 rounded-2xl p-6"
            >
              <div className="mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Activity Feed</h3>
                <p className="text-[10px] text-zinc-600 mt-0.5">Chronological audit stream of project boards.</p>
              </div>

              <div className="space-y-4 pl-1 mt-6">
                {activities.map((act, i) => (
                  <div key={act._id || i} className="flex items-start gap-4 relative">
                    {i !== activities.length - 1 && (
                      <span className="absolute top-7 bottom-0 left-[13px] w-px bg-zinc-850" />
                    )}
                    <Avatar user={act.user} size="sm" className="ring-1 ring-zinc-800 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                        <span className="font-bold text-zinc-100">{act.user?.fullName}</span>
                        {' '}{act.description}
                      </p>
                      <span className="text-[9px] text-zinc-650 font-bold block mt-1">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center">
                    <Clock size={24} className="text-zinc-700 mb-2 animate-spin" />
                    <p className="text-xs text-zinc-550 font-semibold">No logged actions recorded yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* AI Summary Tab */}
          {activeTab === 'AI Summary' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4 self-start">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">AI Intelligence Suite</h3>
                
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'Project Summary', label: 'Project Summary', desc: 'Synthesise task completion, logs & priorities.' },
                    { id: 'Sprint Summary', label: 'Sprint Summary', desc: 'Detailed workspace analytics and activity overview.' },
                    { id: 'Generate Tasks', label: 'Task Generator', desc: 'AI feature breakdown with auto-checklists.' },
                    { id: 'Generate README', label: 'Generate README', desc: 'Creates complete project documentation.' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => { setAIAction(btn.id); setAIOutput(''); setGeneratedTasks([]); }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1",
                        aiAction === btn.id
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                          : "bg-zinc-950/20 border-zinc-850 hover:bg-zinc-900/40 text-zinc-400"
                      )}
                    >
                      <span className="text-xs font-bold">{btn.label}</span>
                      <span className="text-[10px] text-zinc-550 font-medium leading-normal">{btn.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                {aiAction !== 'Generate Tasks' ? (
                  <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{aiAction} Output</h4>
                        <p className="text-[10px] text-zinc-550 mt-0.5">Press request below to run inference engines.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleRunAIAction}
                        loading={aiLoading}
                        className="font-bold flex items-center gap-1.5"
                      >
                        <Sparkles size={12} className="animate-pulse" />
                        Run Inference
                      </Button>
                    </div>

                    <div className="min-h-[220px] bg-zinc-950/30 border border-zinc-855 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap select-all">
                      {aiLoading ? (
                        <div className="flex flex-col gap-2 items-center justify-center py-20 text-zinc-500 font-sans">
                          <Wand2 size={22} className="text-indigo-400 animate-spin" />
                          <span>Generating summary content via AI...</span>
                        </div>
                      ) : aiOutput ? (
                        aiOutput
                      ) : (
                        <span className="text-zinc-650 italic font-sans">Output will be outputted here...</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Task Planner</h4>
                      <p className="text-[10px] text-zinc-550 mt-0.5">Enter a feature statement to parse it into subtasks checklist.</p>
                    </div>

                    <div className="space-y-3">
                      <Input
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                        placeholder="e.g. Build file upload system with local disk fallback"
                        className="h-10 text-xs"
                      />
                      <Button
                        variant="gradient"
                        onClick={handleGenerateTasks}
                        loading={aiLoading}
                        disabled={!generatePrompt.trim()}
                        className="w-full font-bold flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} />
                        Parse Feature Breakdown
                      </Button>
                    </div>

                    {generatedTasks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3 border-t border-zinc-850 pt-4"
                      >
                        <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-2">
                          <span>Select tasks to add:</span>
                          <span className="text-[10px] text-zinc-550">({Object.values(selectedGenTasks).filter(Boolean).length} selected)</span>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {generatedTasks.map((t, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-start gap-3 p-3 bg-zinc-950/20 border border-zinc-855 rounded-xl hover:border-zinc-800 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={!!selectedGenTasks[idx]}
                                onChange={() => setSelectedGenTasks(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 mt-0.5"
                              />
                              <p className="text-xs text-zinc-350 leading-relaxed font-medium">{t}</p>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="primary"
                          onClick={handleBulkCreateTasks}
                          loading={aiLoading}
                          className="w-full font-bold flex items-center justify-center gap-1.5"
                        >
                          <Plus size={13} />
                          Add Selected Tasks to Backlog
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. Overlays Drawer & Modals */}
      <TaskDrawer
        task={selectedTask}
        open={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setSelectedTask(null); }}
        projectId={projectId}
        workspaceId={workspaceId}
        onUpdated={fetchProjectData}
        members={projectMembers}
      />

      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        workspaceId={workspaceId}
        defaultStatus={createDefaultStatus}
        onCreated={fetchProjectData}
        members={projectMembers}
      />

    </div>
  );
}
