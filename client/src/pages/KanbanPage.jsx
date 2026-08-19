import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutDashboard, ChevronDown, FolderKanban, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { useSocket } from '../context/SocketContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from '../components/kanban/TaskCard';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskDrawer } from '../components/task/TaskDrawer';
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'Todo',        label: 'To Do',       color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/20',   dot: 'bg-zinc-400'   },
  { id: 'In Progress', label: 'In Progress',  color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  dot: 'bg-amber-400'  },
  { id: 'Review',      label: 'In Review',    color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', dot: 'bg-indigo-400' },
  { id: 'Completed',   label: 'Completed',    color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20',dot: 'bg-emerald-400'},
];

export function KanbanPage() {
  const { projectId: urlProjectId, workspaceId } = useParams();
  const navigate = useNavigate();
  const { joinWorkspace, leaveWorkspace, socket } = useSocket() || {};
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  // All projects in the workspace
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // The currently selected project id
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || null);
  const [project, setProject] = useState(null);

  // Board state
  const [board, setBoard] = useState({ Todo: [], 'In Progress': [], Review: [], Completed: [] });
  const [boardLoading, setBoardLoading] = useState(false);

  // UI states
  const [projectDropOpen, setProjectDropOpen] = useState(false);
  const projectDropRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModal, setCreateModal] = useState({ open: false, status: 'Todo' });

  // Mobile: which column is visible (0-3)
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const mobileSwipeRef = useRef(null);
  const touchStartX = useRef(null);

  const handleMobileTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleMobileTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50 && mobileColIdx < COLUMNS.length - 1) setMobileColIdx((i) => i + 1);
    if (dx >  50 && mobileColIdx > 0)                  setMobileColIdx((i) => i - 1);
    touchStartX.current = null;
  };

  // Close project dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (projectDropRef.current && !projectDropRef.current.contains(e.target)) {
        setProjectDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // ── Load workspace projects ──────────────────────────────────────────────
  useEffect(() => {
    const wsId = workspaceId || currentWorkspace?._id;
    if (!wsId) return;
    setProjectsLoading(true);
    projectService.getWorkspaceProjects(wsId)
      .then((res) => {
        const list = res.data.projects || [];
        setProjects(list);
        // If no project selected yet, pick first
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setProjectsLoading(false));
  }, [workspaceId, currentWorkspace?._id]);

  // ── Load board for selected project ─────────────────────────────────────
  const loadBoard = useCallback(async () => {
    if (!selectedProjectId) return;
    setBoardLoading(true);
    try {
      const [projRes, boardRes] = await Promise.all([
        projectService.getProject(selectedProjectId),
        projectService.getProjectBoard(selectedProjectId),
      ]);
      setProject(projRes.data.project);
      setBoard(boardRes.data.board || { Todo: [], 'In Progress': [], Review: [], Completed: [] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load board data');
    } finally {
      setBoardLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const wsId = workspaceId || currentWorkspace?._id;
    joinWorkspace?.(wsId);
    return () => leaveWorkspace?.(wsId);
  }, [workspaceId, currentWorkspace?._id]);

  // ── Live task-status updates via socket ──────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = ({ taskId, status }) => {
      setBoard((prev) => {
        const newBoard = { ...prev };
        let movedTask = null;
        for (const col of Object.keys(newBoard)) {
          const idx = newBoard[col].findIndex((t) => t._id === taskId);
          if (idx !== -1) {
            movedTask = newBoard[col][idx];
            newBoard[col] = newBoard[col].filter((_, i) => i !== idx);
            break;
          }
        }
        if (movedTask && status in newBoard) {
          newBoard[status] = [{ ...movedTask, status }, ...newBoard[status]];
        }
        return newBoard;
      });
    };
    socket.on('task-status-updated', handler);
    return () => socket.off('task-status-updated', handler);
  }, [socket]);

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragStart = (e, task) => {
    setDragging(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(columnId);
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!dragging || dragging.status === targetColumn) {
      setDragging(null); setDragOver(null); return;
    }
    const task = dragging;
    setDragging(null); setDragOver(null);

    // Optimistic update
    setBoard((prev) => {
      const nb = { ...prev };
      nb[task.status] = nb[task.status].filter((t) => t._id !== task._id);
      nb[targetColumn] = [{ ...task, status: targetColumn }, ...(nb[targetColumn] || [])];
      return nb;
    });

    try {
      await taskService.updateTaskStatus(task._id, targetColumn);
    } catch {
      toast.error('Failed to move task');
      loadBoard();
    }
  };

  const handleDragLeave = () => setDragOver(null);

  const handleTaskCreated = (task) => {
    setBoard((prev) => ({
      ...prev,
      [task.status]: [task, ...(prev[task.status] || [])],
    }));
  };

  // ── Project selector change ──────────────────────────────────────────────
  const handleProjectSelect = (proj) => {
    setSelectedProjectId(proj._id);
    setProjectDropOpen(false);
    // Also update URL so breadcrumb/back works correctly
    const wsId = workspaceId || currentWorkspace?._id;
    navigate(`/app/workspace/${wsId}/project/${proj._id}/kanban`, { replace: true });
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalTasks = Object.values(board).reduce((s, col) => s + col.length, 0);
  const wsId = workspaceId || currentWorkspace?._id;

  // Members for task drawer / create modal
  const isAdmin = currentWorkspace?.owner?._id === user?.id || currentWorkspace?.owner === user?.id;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0 bg-zinc-950/30">
        {/* Breadcrumb */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-550 mb-0.5 sm:mb-1">
            <LayoutDashboard size={11} />
            <span>Kanban Board</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white truncate">
            {boardLoading ? 'Loading…' : (project?.name || 'Select a Project')}
          </h1>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* ── Project Selector ──────────────────────────────────────────── */}
          <div className="relative" ref={projectDropRef}>
            <button
              onClick={() => setProjectDropOpen((v) => !v)}
              disabled={projectsLoading}
              className={cn(
                'flex items-center gap-2 h-9 px-3 sm:px-3.5 rounded-xl border text-xs font-semibold transition-all',
                'bg-zinc-900 border-zinc-700/60 text-zinc-300 hover:border-indigo-500/50 hover:text-white',
                projectDropOpen && 'border-indigo-500/60 text-white bg-zinc-900'
              )}
            >
              <FolderKanban size={13} className="text-indigo-400 flex-shrink-0" />
              <span className="max-w-[100px] xs:max-w-[140px] truncate">
                {projectsLoading ? 'Loading projects…'
                  : projects.find((p) => p._id === selectedProjectId)?.name || 'Select project'}
              </span>
              <ChevronDown
                size={13}
                className={cn('transition-transform flex-shrink-0', projectDropOpen && 'rotate-180')}
              />
            </button>

            <AnimatePresence>
              {projectDropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                >
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1.5">
                      Workspace Projects
                    </p>
                    {projects.length === 0 ? (
                      <div className="flex flex-col items-center py-6 gap-2">
                        <AlertCircle size={18} className="text-zinc-600" />
                        <p className="text-xs text-zinc-500">No projects found</p>
                      </div>
                    ) : (
                      projects.map((proj) => (
                        <button
                          key={proj._id}
                          onClick={() => handleProjectSelect(proj)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-all',
                            proj._id === selectedProjectId
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                          )}
                        >
                          <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <FolderKanban size={11} className="text-indigo-400" />
                          </div>
                          <span className="truncate">{proj.name}</span>
                          {proj._id === selectedProjectId && (
                            <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md font-bold">
                              Active
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Task count + Add Task */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg">
              {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
            </span>
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedProjectId}
              onClick={() => setCreateModal({ open: true, status: 'Todo' })}
            >
              <Plus size={13} />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* ── Kanban Board Area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* No project selected – shared */}
        {!selectedProjectId && !projectsLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 min-w-[400px]">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
                <FolderKanban size={22} className="text-zinc-600" />
              </div>
              <h3 className="text-sm font-bold text-white">No Project Selected</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Use the project selector above to pick a project and view its Kanban board.
              </p>
            </div>
          )}

        {/* Loading skeleton */}
        {(boardLoading || projectsLoading) && selectedProjectId && (
          <div className="flex gap-5 p-6 min-w-max">
            {COLUMNS.map((col) => (
              <div key={col.id} className="w-72 flex-shrink-0 space-y-3">
                <Skeleton className="h-8 w-28 rounded-xl" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── MOBILE: single column, swipe to change ──────────────────── */}
        {!boardLoading && !projectsLoading && selectedProjectId && (() => {
          const col = COLUMNS[mobileColIdx];
          return (
            <div
              className="flex lg:hidden flex-col flex-1 overflow-hidden"
              onTouchStart={handleMobileTouchStart}
              onTouchEnd={handleMobileTouchEnd}
            >
              {/* Column header + pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 flex-shrink-0 bg-zinc-950/40">
                <button
                  onClick={() => setMobileColIdx((i) => Math.max(0, i - 1))}
                  disabled={mobileColIdx === 0}
                  className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', col.dot)} />
                    <span className={cn('text-sm font-bold', col.color)}>{col.label}</span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-lg', col.bg, col.color)}>
                      {board[col.id]?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {COLUMNS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMobileColIdx(i)}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-200',
                          i === mobileColIdx
                            ? cn('w-5', col.dot)
                            : 'w-1.5 bg-zinc-700'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCreateModal({ open: true, status: col.id })}
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => setMobileColIdx((i) => Math.min(COLUMNS.length - 1, i + 1))}
                    disabled={mobileColIdx === COLUMNS.length - 1}
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Tasks – scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    className="space-y-3"
                  >
                    {board[col.id]?.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => setSelectedTask(task)}
                        isDragging={dragging?._id === task._id}
                      />
                    ))}
                    {board[col.id]?.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center', col.bg)}>
                          <FolderKanban size={22} className={col.color} />
                        </div>
                        <p className="text-sm font-semibold text-zinc-400">No {col.label} tasks</p>
                        <p className="text-xs text-zinc-600 leading-relaxed">Swipe left or right to switch columns</p>
                        <button
                          onClick={() => setCreateModal({ open: true, status: col.id })}
                          className={cn('text-xs font-bold px-5 py-2.5 rounded-xl border transition-colors mt-1', col.bg, col.color, col.border)}
                        >
                          + Add task here
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          );
        })()}

        {/* ── DESKTOP: all columns side by side ───────────────────────── */}
        {!boardLoading && !projectsLoading && selectedProjectId && (
          <div className="hidden lg:flex flex-col flex-1 p-6 overflow-hidden">
            <KanbanBoard
              board={board}
              draggingTask={dragging}
              dragOverColumn={dragOver}
              isAdmin={isAdmin}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              setDragOverColumn={setDragOver}
              setSelectedTask={setSelectedTask}
              onCreateTaskClick={(status) => setCreateModal({ open: true, status })}
            />
          </div>
        )}
      </div>

      {/* ── Task Drawer ──────────────────────────────────────────────────── */}
      <TaskDrawer
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        projectId={selectedProjectId}
        workspaceId={wsId}
        onUpdated={loadBoard}
      />

      {/* ── Create Task Modal ────────────────────────────────────────────── */}
      <CreateTaskModal
        open={createModal.open}
        onClose={() => setCreateModal({ open: false, status: 'Todo' })}
        projectId={selectedProjectId}
        workspaceId={wsId}
        defaultStatus={createModal.status}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}

