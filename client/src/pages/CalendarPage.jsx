import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  ChevronDown, FolderKanban, AlertCircle, X, Clock,
} from 'lucide-react';
import api from '../services/api';
import { projectService } from '../services/project.service';
import { useWorkspace } from '../context/WorkspaceContext';
import { getPriorityConfig } from '../utils/getPriorityColor';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export function CalendarPage() {
  const { projectId: urlProjectId, workspaceId: urlWorkspaceId } = useParams();
  const navigate   = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = urlWorkspaceId || currentWorkspace?._id;

  /* ── Projects list ─────────────────────────────────────────────────── */
  const [projects,        setProjects]        = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || null);
  const [projectDropOpen,   setProjectDropOpen]   = useState(false);
  const projectDropRef = useRef(null);

  // Close dropdown on outside click
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

  useEffect(() => {
    if (!workspaceId) return;
    setProjectsLoading(true);
    projectService.getWorkspaceProjects(workspaceId)
      .then((res) => {
        const list = res.data.projects || [];
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setProjectsLoading(false));
  }, [workspaceId]);

  /* ── Calendar date navigation ──────────────────────────────────────── */
  const [date, setDate] = useState(new Date());
  const year  = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based
  const prev  = () => setDate(new Date(year, month - 2, 1));
  const next  = () => setDate(new Date(year, month,     1));
  const goToday = () => setDate(new Date());

  /* ── Tasks for selected month ──────────────────────────────────────── */
  const [tasks,       setTasks]       = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const loadTasks = useCallback(() => {
    if (!selectedProjectId) return;
    setTasksLoading(true);
    api.get(`/calendar/project/${selectedProjectId}`, { params: { month, year } })
      .then((res) => setTasks(res.data.tasks || []))
      .catch(console.error)
      .finally(() => setTasksLoading(false));
  }, [selectedProjectId, month, year]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  /* ── Day-click panel ───────────────────────────────────────────────── */
  const [selectedDay, setSelectedDay] = useState(null);

  const getTasksForDay = (day) =>
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year;
    });

  /* ── Grid helpers ──────────────────────────────────────────────────── */
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today       = new Date();
  const isToday     = (day) =>
    today.getDate() === day &&
    today.getMonth() + 1 === month &&
    today.getFullYear() === year;

  /* ── Project selector change ───────────────────────────────────────── */
  const handleProjectSelect = (proj) => {
    setSelectedProjectId(proj._id);
    setProjectDropOpen(false);
    setSelectedDay(null);
    navigate(
      `/app/workspace/${workspaceId}/project/${proj._id}/calendar`,
      { replace: true }
    );
  };

  const activeProject = projects.find((p) => p._id === selectedProjectId);
  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left: title */}
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={18} className="text-indigo-400" />
            Calendar
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {activeProject ? `Showing deadlines for ${activeProject.name}` : 'Task deadlines and due dates'}
          </p>
        </div>

        {/* Right: project selector + nav */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Project Selector */}
          <div className="relative" ref={projectDropRef}>
            <button
              onClick={() => setProjectDropOpen((v) => !v)}
              disabled={projectsLoading}
              className={cn(
                'flex items-center gap-2 h-9 px-3.5 rounded-xl border text-xs font-semibold transition-all',
                'bg-zinc-900 border-zinc-700/60 text-zinc-300 hover:border-indigo-500/50 hover:text-white',
                projectDropOpen && 'border-indigo-500/60 text-white'
              )}
            >
              <FolderKanban size={13} className="text-indigo-400 flex-shrink-0" />
              <span className="max-w-[140px] truncate">
                {projectsLoading
                  ? 'Loading…'
                  : (activeProject?.name || 'Select project')}
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

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <ChevronLeft size={14} className="text-zinc-400" />
            </button>
            <button
              onClick={goToday}
              className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {MONTHS[month - 1]} {year}
            </button>
            <button
              onClick={next}
              className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <ChevronRight size={14} className="text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── No project selected ────────────────────────────────────────── */}
      {!selectedProjectId && !projectsLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <CalendarIcon size={22} className="text-zinc-600" />
          </div>
          <h3 className="text-sm font-bold text-white">No Project Selected</h3>
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
            Use the project selector above to view a project's task deadlines on the calendar.
          </p>
        </div>
      )}

      {/* ── Calendar grid ──────────────────────────────────────────────── */}
      {(selectedProjectId || projectsLoading) && (
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Calendar */}
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">

            {/* Day headers & Grid wrapped for horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-[640px] lg:min-w-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-zinc-800/60">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Loading skeleton */}
            {(tasksLoading || projectsLoading) && (
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[90px] p-2 border-b border-r border-zinc-800/40">
                    <Skeleton className="h-4 w-4 rounded-full mb-2" />
                    <Skeleton className="h-3 w-full rounded-md" />
                  </div>
                ))}
              </div>
            )}

            {/* Grid cells */}
            {!tasksLoading && !projectsLoading && (
              <div className="grid grid-cols-7">
                {/* Padding cells for days before the 1st */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[90px] border-b border-r border-zinc-800/30"
                  />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day      = i + 1;
                  const dayTasks = getTasksForDay(day);
                  const todayDay = isToday(day);
                  const isSelected = selectedDay === day;
                  const col = (firstDay + i) % 7;

                  return (
                    <motion.div
                      key={day}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={cn(
                        'min-h-[90px] p-2 border-b border-r border-zinc-800/30 cursor-pointer transition-colors',
                        col === 6 && 'border-r-0',
                        todayDay  && 'bg-indigo-500/[0.04]',
                        isSelected && 'ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/[0.06]'
                      )}
                    >
                      {/* Day number */}
                      <div
                        className={cn(
                          'text-xs font-bold mb-1.5 h-6 w-6 flex items-center justify-center rounded-full transition-colors',
                          todayDay
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                            : 'text-zinc-600 hover:text-zinc-300'
                        )}
                      >
                        {day}
                      </div>

                      {/* Tasks */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((task) => {
                          const p = getPriorityConfig(task.priority);
                          return (
                            <div
                              key={task._id}
                              className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1',
                                p.bg, p.color
                              )}
                              title={task.title}
                            >
                              <div className={cn('h-1 w-1 rounded-full flex-shrink-0', p.dot)} />
                              {task.title}
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <div className="text-[9px] text-zinc-600 font-medium pl-1">
                            +{dayTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
              </div>
            </div>
          </div>

          {/* ── Day panel ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 w-full lg:w-[280px] overflow-hidden"
              >
                <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3 h-full max-h-[600px] overflow-y-auto scrollbar-none">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {MONTHS[month - 1]} {selectedDay}
                      </p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {selectedDayTasks.length === 0
                          ? 'No deadlines'
                          : `${selectedDayTasks.length} task${selectedDayTasks.length > 1 ? 's' : ''} due`}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <X size={13} className="text-zinc-400" />
                    </button>
                  </div>

                  {/* Task list */}
                  {selectedDayTasks.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <CalendarIcon size={22} className="text-zinc-700" />
                      <p className="text-xs text-zinc-600 text-center leading-relaxed">
                        No tasks have a deadline<br />on this day.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayTasks.map((task) => {
                        const p = getPriorityConfig(task.priority);
                        return (
                          <motion.div
                            key={task._id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn('mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0', p.dot)} />
                              <p className="text-xs font-semibold text-zinc-200 leading-snug">
                                {task.title}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md', p.bg, p.color)}>
                                {task.priority}
                              </span>
                              <span className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                                task.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : task.status === 'In Progress'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-zinc-800 text-zinc-400'
                              )}>
                                {task.status}
                              </span>
                            </div>
                            {task.assignedTo && (
                              <div className="flex items-center gap-1.5">
                                <div className="h-4 w-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[8px] font-bold text-indigo-400">
                                  {task.assignedTo.fullName?.[0]?.toUpperCase()}
                                </div>
                                <span className="text-[10px] text-zinc-500">
                                  {task.assignedTo.fullName}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
