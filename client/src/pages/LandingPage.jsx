import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowRight, Sparkles, LayoutDashboard, FolderKanban, Calendar,
  Bell, MessageSquare, Shield, CheckCircle, Play, ArrowUpRight,
  MousePointer, Plus, User, FileText, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

// Simulated Cursors for Collaboration Demo
const MOCK_CURSORS = [
  { id: 1, name: 'harsh.dev', color: 'bg-indigo-500', x: '20%', y: '40%' },
  { id: 2, name: 'sarah_pm', color: 'bg-emerald-500', x: '70%', y: '30%' },
  { id: 3, name: 'alex_designer', color: 'bg-amber-500', x: '45%', y: '75%' }
];

// Product Preview Tab Config
const PREVIEW_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban', label: 'Kanban Board', icon: FolderKanban },
  { id: 'drawer', label: 'Task Details', icon: FileText },
  { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'comments', label: 'Collaboration', icon: MessageSquare }
];

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Interactive Demos States
  const [demoPrompt, setDemoPrompt] = useState('');
  const [demoChat, setDemoChat] = useState([
    { role: 'assistant', text: 'Hello! I am your DevFlow Copilot. Choose a prompt below to see how I help your team.' }
  ]);
  const [demoChatLoading, setDemoChatLoading] = useState(false);
  const [kanbanTasks, setKanbanTasks] = useState([
    { id: 't1', title: 'Implement Auth Cookie Flow', priority: 'High', status: 'In Progress' },
    { id: 't2', title: 'Design Vercel-like Landing', priority: 'Medium', status: 'Todo' },
    { id: 't3', title: 'Optimize Bundle Size', priority: 'Low', status: 'Todo' }
  ]);
  const [cursors, setCursors] = useState(MOCK_CURSORS);

  // Auto cycle tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const idx = PREVIEW_TABS.findIndex((t) => t.id === prev);
        const nextIdx = (idx + 1) % PREVIEW_TABS.length;
        return PREVIEW_TABS[nextIdx].id;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Simulate Cursors movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors((prev) =>
        prev.map((c) => ({
          ...c,
          x: `${Math.max(10, Math.min(90, parseFloat(c.x) + (Math.random() - 0.5) * 15))}%`,
          y: `${Math.max(10, Math.min(90, parseFloat(c.y) + (Math.random() - 0.5) * 15))}%`
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // AI Prompt Simulator
  const triggerAiDemo = (promptText) => {
    if (demoChatLoading) return;
    setDemoChatLoading(true);
    setDemoChat((prev) => [...prev, { role: 'user', text: promptText }]);
    
    setTimeout(() => {
      let responseText = '';
      if (promptText.includes('sprint plan')) {
        responseText = "Sprint 4 Plan suggested:\n1. Backend API audit (Assign to: Harsh)\n2. Setup wizard flow (Assign to: Sarah)\n3. Realtime socket test (Assign to: Alex)\nEstimated workload: 14 story points. AI confidence: High.";
      } else if (promptText.includes('blockers')) {
        responseText = "🚨 Blocker found in 'Socket Auth Room Join':\nTask is assigned to no one and has been stuck in 'Todo' for 4 days. Suggestion: Shift resource from 'Optimize Bundle Size' to resolve blocker.";
      } else {
        responseText = "I've analyzed the project backlog. 3 tickets are missing priorities. Suggesting 'High' for the Auth Token fix.";
      }
      setDemoChat((prev) => [...prev, { role: 'assistant', text: responseText }]);
      setDemoChatLoading(false);
    }, 1500);
  };

  // Kanban Demo Interaction
  const handleTaskComplete = (taskId) => {
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'Completed' } : t))
    );
    toast?.success?.('Task completed!');
  };

  return (
    <div className="bg-[#09090B] text-zinc-100 min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      
      {/* Cinematic grid backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[linear-gradient(to_bottom,rgba(9,9,11,0)_0%,#09090B_100%)] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/40 bg-zinc-950/65 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">DevFlow AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Features</a>
            <a href="#pricing" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Pricing</a>
            <a href="#docs" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Docs</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors">
              GitHub <ArrowUpRight size={10} />
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => navigate('/app')} size="sm" variant="gradient">
                Open App
                <ArrowRight size={13} />
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Sign In</Link>
                <Button onClick={() => navigate('/login')} size="sm" variant="gradient">
                  Open App
                  <ArrowRight size={13} />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 max-w-7xl mx-auto px-6 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 text-[10px] font-medium tracking-wide uppercase mb-6"
        >
          <Sparkles size={10} />
          DevFlow AI v1.0.0 is live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.05]"
        >
          Ship faster with <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
            AI-powered
          </span> project flow.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-zinc-400 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed"
        >
          Linear-speed Kanban, socket-based real-time alignment, and a context-aware AI assistant built to clear project roadmaps automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex justify-center gap-4"
        >
          <Button onClick={() => navigate(user ? '/app' : '/login')} size="lg" variant="gradient">
            Open Workspace
            <ArrowRight size={14} />
          </Button>
          <a href="#demo">
            <Button size="lg" variant="secondary" className="gap-2">
              <Play size={12} fill="currentColor" />
              Watch Demo
            </Button>
          </a>
        </motion.div>
      </section>

      {/* TIMED PRODUCT PREVIEW CYCLER */}
      <section id="demo" className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/5"
        >
          {/* Top Tabs Header */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto scrollbar-none p-1">
            {PREVIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-2xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-indigo-300'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Screen Display */}
          <div className="h-[460px] relative overflow-hidden bg-[#09090B] p-6 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 h-full flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400">Dashboard Preview</h3>
                      <h2 className="text-xl font-bold text-white mt-1">Acme Workspace Health</h2>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">14 tasks completed</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { l: 'Total Tasks', v: '48', c: 'indigo' },
                      { l: 'Completed', v: '32', c: 'emerald' },
                      { l: 'In Progress', v: '12', c: 'amber' },
                      { l: 'Blocked', v: '4', c: 'red' }
                    ].map((s) => (
                      <div key={s.l} className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-white">{s.v}</div>
                        <div className="text-[10px] text-zinc-500 font-medium mt-1">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-zinc-900/50 border border-zinc-850 rounded-2xl flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-zinc-400">Sprint Completion</span>
                      <span className="text-xs font-bold text-white">67%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '67%' }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'kanban' && (
                <motion.div
                  key="kanban"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 h-full flex flex-col justify-between"
                >
                  <h3 className="text-sm font-semibold text-zinc-400">Sprint Backlog Board</h3>
                  
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    {['Todo', 'In Progress', 'Done'].map((col, cIdx) => (
                      <div key={col} className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-3 flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{col}</span>
                        {col === 'Todo' && (
                          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-sm">
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded">Medium</span>
                            <h4 className="text-xs font-bold text-white mt-1.5">Setup Landing Page UI</h4>
                          </div>
                        )}
                        {col === 'In Progress' && (
                          <motion.div
                            layoutId="demo-kanban-card"
                            className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl shadow-lg relative"
                          >
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">High</span>
                            <h4 className="text-xs font-bold text-white mt-1.5">Verify Cookie Session</h4>
                            <div className="flex justify-end mt-3">
                              <span className="text-[9px] text-zinc-500">Assignee: Harsh</span>
                            </div>
                            {/* Moving indicator */}
                            <motion.div
                              animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 4 }}
                              className="absolute top-1 right-1"
                            >
                              <MousePointer size={10} className="text-indigo-400" />
                            </motion.div>
                          </motion.div>
                        )}
                        {col === 'Done' && (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl opacity-60">
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Low</span>
                            <h4 className="text-xs font-bold text-white mt-1.5">Configure Tailwind Theme</h4>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'drawer' && (
                <motion.div
                  key="drawer"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-4 h-full"
                >
                  <div className="flex-1 bg-zinc-900/20 border border-zinc-850 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500">TASK-102</span>
                      <h2 className="text-lg font-bold text-white mt-1">Optimize Asset Pipelines</h2>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Implement code splitting, lazy loading, and compress images to achieve a 100 Performance score on PageSpeed.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Subtasks</div>
                      {[
                        { t: 'Configure Vite build config', c: true },
                        { t: 'Integrate React.lazy components', c: true },
                        { t: 'Verify bundle analytics output', c: false }
                      ].map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs py-1">
                          <input type="checkbox" checked={sub.c} readOnly className="rounded border-zinc-800 text-indigo-500 focus:ring-0 bg-transparent" />
                          <span className={sub.c ? 'line-through text-zinc-600' : 'text-zinc-300'}>{sub.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-64 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
                    <div className="text-xs font-bold text-white">Attributes</div>
                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                      <span className="text-zinc-500">Status</span>
                      <span className="font-semibold text-indigo-400">In Progress</span>
                      
                      <span className="text-zinc-500">Priority</span>
                      <span className="font-semibold text-amber-500">High</span>

                      <span className="text-zinc-500">Assignee</span>
                      <span className="text-zinc-300">Test User</span>

                      <span className="text-zinc-500">Due Date</span>
                      <span className="text-zinc-300">July 8, 2026</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'copilot' && (
                <motion.div
                  key="copilot"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-4 h-full"
                >
                  <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span className="text-xs font-semibold text-white">AI Copilot Analysis</span>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                      <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-700/50">
                        <p className="text-xs text-zinc-300 italic">"What are the main risks for our sprint release?"</p>
                      </div>
                      <div className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-xl">
                        <p className="text-xs text-indigo-300 leading-relaxed">
                          "I found 1 major risk. Task <strong>'Verify Token Security'</strong> is overdue and blocking 2 downstream tickets. Suggest shifting assignee to Alex."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-56 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">Suggested Actions</div>
                    {[
                      'Find sprint blockers',
                      'Generate release notes',
                      'Assign overdue tickets'
                    ].map((act, i) => (
                      <button key={i} className="text-left px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition-colors">
                        {act}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 h-full flex flex-col justify-between"
                >
                  <h3 className="text-sm font-semibold text-zinc-400">Deadlines & Deliverables</h3>

                  <div className="grid grid-cols-7 gap-2 flex-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="text-center text-[9px] uppercase font-bold text-zinc-600">{day}</div>
                    ))}
                    {Array.from({ length: 14 }).map((_, i) => {
                      const dayNum = i + 1;
                      const hasEvent = dayNum === 5 || dayNum === 11;
                      return (
                        <div key={i} className={`bg-zinc-900/40 border border-zinc-850 rounded-xl p-2 flex flex-col justify-between min-h-[60px] ${dayNum === 5 ? 'bg-indigo-500/5 border-indigo-500/20' : ''}`}>
                          <span className="text-[10px] font-bold text-zinc-500">{dayNum}</span>
                          {hasEvent && (
                            <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded truncate font-medium">
                              {dayNum === 5 ? 'Auth Flow Code' : 'Vite Deploy'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 h-full flex flex-col justify-between"
                >
                  <h3 className="text-sm font-semibold text-zinc-400">Inbox & Activity</h3>
                  
                  <div className="space-y-2 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                    {[
                      { t: 'Assigned to you', m: 'Harsh assigned you to "Implement Auth Cookie Flow"', d: '2m ago' },
                      { t: 'Overdue Warning', m: 'AI Alert: "Verify Token Security" has missed its deadline', d: '1h ago' }
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <span className="text-lg">🔔</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white">{n.t}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{n.m}</p>
                        </div>
                        <span className="text-[10px] text-zinc-655">{n.d}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 h-full flex flex-col justify-between"
                >
                  <h3 className="text-sm font-semibold text-zinc-400">Realtime Discussion</h3>
                  
                  <div className="space-y-3 flex-1 flex flex-col justify-end max-w-xl mx-auto w-full">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">HP</div>
                      <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl rounded-tl-none">
                        <p className="text-xs text-white font-medium">Should we implement full token auth or cookie based session?</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-2xl rounded-tr-none">
                        <p className="text-xs text-indigo-300 font-medium">HttpOnly Cookie authentication will be much safer against XSS.</p>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                    </div>
                    <div className="text-[10px] text-zinc-600 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                      <span>Sarah is typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* DYNAMIC INTERACTIVE DEMOS SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900">
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-12 text-center">
          Experience the platform in <span className="text-indigo-400">real-time</span>.
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AI Terminal Demo */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Interactive Copilot terminal</h3>
            </div>
            
            <div className="h-64 bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4 overflow-y-auto font-mono text-xs space-y-3 mb-4">
              {demoChat.map((chat, idx) => (
                <div key={idx} className={chat.role === 'user' ? 'text-indigo-300' : 'text-zinc-400'}>
                  <span className="text-zinc-655">{chat.role === 'user' ? 'visitor$' : 'copilot$'}</span> {chat.text}
                </div>
              ))}
              {demoChatLoading && (
                <div className="text-zinc-600 animate-pulse">copilot$ Thinking...</div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Click prompt to run:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => triggerAiDemo('Find blockers in Sprint')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Find blockers
                </button>
                <button
                  onClick={() => triggerAiDemo('Suggest sprint plan')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Suggest sprint plan
                </button>
              </div>
            </div>
          </div>

          {/* Realtime Collaboration Cursors Demo */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MousePointer size={16} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white font-sans">Multi-User Cursor Alignment</h3>
              </div>
              <p className="text-xs text-zinc-500">Every cursor operates synchronously over secure Socket.IO connection channels.</p>
            </div>

            {/* Cursors Grid Field */}
            <div className="h-44 border border-zinc-850 rounded-2xl relative bg-zinc-900/30 overflow-hidden mt-4">
              {cursors.map((cursor) => (
                <motion.div
                  key={cursor.id}
                  animate={{ x: cursor.x, y: cursor.y }}
                  transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                  className="absolute flex flex-col items-start pointer-events-none"
                  style={{ left: 0, top: 0 }}
                >
                  <MousePointer size={14} className="text-zinc-100 fill-zinc-100" />
                  <span className={`text-[8px] text-white px-1.5 py-0.5 rounded-md font-mono font-bold mt-1 ${cursor.color}`}>
                    {cursor.name}
                  </span>
                </motion.div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono text-zinc-650 tracking-wider">SOCKET.IO NETWORK CHANNELS ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC KANBAN ANIMATION SECTION */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Interactive Kanban drag-and-drop</h3>
            <p className="text-xs text-zinc-500 mb-6">See how simple managing tasks is. Click to transition any task card to completed status instantly.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Backlog / Progress</span>
              <AnimatePresence>
                {kanbanTasks
                  .filter((t) => t.status !== 'Completed')
                  .map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      exit={{ opacity: 0, x: 100 }}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded">{task.priority}</span>
                        <h4 className="text-xs font-bold text-white mt-1.5">{task.title}</h4>
                      </div>
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className="h-7 px-3 bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-300 border border-zinc-700 hover:border-emerald-500/30 rounded-xl text-[10px] font-bold text-zinc-400 transition-all"
                      >
                        Complete
                      </button>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-emerald-400">Completed tasks</span>
              <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4 min-h-[160px] flex flex-col gap-2 justify-center">
                {kanbanTasks.filter((t) => t.status === 'Completed').length === 0 ? (
                  <p className="text-xs text-zinc-650 text-center">No completed tasks yet. Click complete on the left.</p>
                ) : (
                  kanbanTasks
                    .filter((t) => t.status === 'Completed')
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2"
                      >
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-450 line-through truncate">{task.title}</span>
                      </motion.div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 pb-32 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto leading-tight">
          Ready to build with artificial intelligence?
        </h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto mt-4 leading-relaxed">
          Create workspaces, invite colleagues, and start completing tasks with real-time feedback and assistance.
        </p>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate(user ? '/app' : '/login')} size="lg" variant="gradient" className="px-8 py-6 rounded-2xl text-sm font-semibold">
            Get Started For Free
            <ArrowRight size={14} />
          </Button>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
          {[
            { t: 'HttpOnly Cookies', d: 'Session cookies securely stored with complete security defense.' },
            { t: 'Socket.IO Events', d: 'Synchronized workspace status, comments, and task events.' },
            { t: 'DeepSeek Copilot', d: 'Natural language summaries and automatic priority suggestions.' }
          ].map((item) => (
            <div key={item.t} className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-2xl">
              <h4 className="text-xs font-bold text-white mb-2">{item.t}</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-indigo-400" />
            <span className="font-semibold text-zinc-400">DevFlow AI</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-zinc-300">Features</a>
            <a href="#pricing" className="hover:text-zinc-300">Pricing</a>
            <a href="#docs" className="hover:text-zinc-300">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
