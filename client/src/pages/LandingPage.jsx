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
  const { user, logout } = useAuth();
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

  // Track mouse coordinates for subtle cursor spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-bg-container text-white min-h-screen font-sans selection:bg-white/10 selection:text-white overflow-x-hidden">
      
      {/* ── PREMIUM LAYERED BACKGROUNDS ── */}
      <div className="landing-grain-texture" />
      <div className="landing-vignette" />
      <div className="landing-white-spotlight" />
      <div className="landing-secondary-spotlight" />
      <div className="landing-light-streaks" />

      {/* Floating Dust Particles (6-10 tiny particles, 2px-5px) */}
      <div className="landing-dust-container">
        {Array.from({ length: 8 }).map((_, i) => {
          const size = Math.random() * 3 + 2; // 2px to 5px
          const duration = Math.random() * 20 + 20; // 20s to 40s
          const delay = Math.random() * -20;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const drift = Math.random() * 40 - 20;
          return (
            <div
              key={i}
              className="landing-dust-particle"
              style={{
                '--size': `${size}px`,
                '--duration': `${duration}s`,
                '--delay': `${delay}s`,
                '--x': `${x}%`,
                '--y': `${y}%`,
                '--drift': `${drift}px`
              }}
            />
          );
        })}
      </div>

      {/* Subtle radial mouse spotlight (giant radial light, 3% opacity, 250px blur) */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-all duration-300 ease-out" 
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.03), transparent 70%)`,
          filter: 'blur(250px)'
        }}
      />

      {/* Sticky Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050505]/60 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all"
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-white/[0.02] border border-white/8 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">DevFlow AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white/40 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Features</a>
            <a href="#pricing" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white/40 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Pricing</a>
            <Link to="/docs" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white/40 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Docs</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={logout} 
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                  Sign Out
                </button>
                <Button onClick={() => navigate('/app')} size="sm" variant="gradient">
                  Open App
                  <ArrowRight size={13} />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Sign In</Link>
                <Button onClick={() => navigate('/login')} size="sm" variant="gradient">
                  Open App
                  <ArrowRight size={13} />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-24 pb-0 w-screen min-h-screen bg-[#09090B] text-center relative overflow-hidden flex flex-col items-center">
        
        {/* Spotlight container */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

          {/* Main beam shape — blurred div rotated */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "-10%",
              width: "55%",
              height: "120%",
              background: "linear-gradient(135deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.13) 45%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.13) 55%, rgba(255,255,255,0.0) 70%)",
              filter: "blur(18px)",
              transform: "rotate(-8deg)",
              transformOrigin: "top left",
            }}
          />

          {/* Second beam layer — slightly offset for depth */}
          <div
            style={{
              position: "absolute",
              top: "-25%",
              left: "-12%",
              width: "50%",
              height: "110%",
              background: "linear-gradient(135deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.0) 28%, rgba(99,102,241,0.12) 43%, rgba(99,102,241,0.18) 50%, rgba(99,102,241,0.12) 57%, rgba(255,255,255,0.0) 72%)",
              filter: "blur(22px)",
              transform: "rotate(-8deg)",
              transformOrigin: "top left",
            }}
          />

          {/* Beam glow fill — wide soft fill inside beam area */}
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "-5%",
              width: "60%",
              height: "100%",
              background: "linear-gradient(138deg, rgba(255,255,255,0.07) 0%, rgba(99,102,241,0.05) 25%, transparent 50%)",
              filter: "blur(40px)",
            }}
          />

          {/* Source glow — bright origin at top-left */}
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "-8%",
              width: "350px",
              height: "350px",
              background: "radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.25) 0%, rgba(99,102,241,0.12) 35%, transparent 65%)",
              filter: "blur(30px)",
            }}
          />

          {/* Ambient fill — soft light in beam area */}
          <div
            style={{
              position: "absolute",
              top: "0%",
              left: "0%",
              width: "45%",
              height: "80%",
              background: "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.06) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          {/* Right side dark vignette — makes beam pop */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              background: "linear-gradient(to left, rgba(0,0,0,0.30) 0%, transparent 100%)",
            }}
          />

          {/* Bottom dark vignette */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "30%",
              background: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)",
            }}
          />

        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-400 text-[10px] font-medium tracking-wide uppercase mb-6 backdrop-blur-md shadow-sm relative z-10"
        >
          <Sparkles size={10} className="text-[#8B7CF6]" />
          <span>DevFlow AI v1.0.0 is live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-[-0.04em] max-w-[900px] mx-auto leading-none font-display relative z-10 flex flex-col items-center"
        >
          <span className="block text-[#ECECEC] mb-3 sm:mb-6">Ship faster with</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#8B7CF6] to-[#A78BFA] pb-2 mb-1.5 sm:mb-3">
            AI-powered
          </span>
          <span className="block text-white whitespace-nowrap">
            project workflow.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, filter: 'blur(8px)', y: 15 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 sm:mt-12 text-zinc-400 text-sm sm:text-lg max-w-[650px] mx-auto leading-relaxed md:leading-[1.75] font-sans relative z-10"
        >
          Linear-speed Kanban, socket-based real-time alignment, and a context-aware AI assistant built to clear project roadmaps automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 sm:mt-14 flex justify-center gap-4 relative z-10"
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
      <motion.section
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        id="demo"
        className="max-w-6xl mx-auto px-6 pb-20 pt-10 relative z-10"
      >
        {/* Extremely soft violet glow underneath */}
        <div className="absolute inset-x-20 -bottom-10 h-3/4 bg-[#8B7CF6]/[0.03] rounded-[100%] blur-[120px] pointer-events-none z-0" />

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          style={{ transform: 'perspective(2000px) rotateX(4deg)', transformStyle: 'preserve-3d' }}
          className="bg-[#0A0A0A] border border-white/[0.08] rounded-[24px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] relative z-10"
        >
          {/* Top Tabs Header */}
          <div className="flex border-b border-white/5 bg-[#0A0A0A]/50 overflow-x-auto scrollbar-none p-1">
            {PREVIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white/5 text-[#A78BFA]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Screen Display */}
          <div className="h-[460px] relative overflow-hidden bg-[#050505] p-6 flex flex-col justify-between">
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
                      <div key={s.l} className="bg-[rgba(10,10,10,0.72)] border border-white/5 p-4 rounded-[20px] text-center shadow-sm">
                        <div className="text-2xl font-bold text-white">{s.v}</div>
                        <div className="text-[10px] text-zinc-500 font-medium mt-1">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-[rgba(10,10,10,0.72)] border border-white/5 rounded-[20px] flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-zinc-400">Sprint Completion</span>
                      <span className="text-xs font-bold text-white">67%</span>
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '67%' }}
                        className="h-full bg-[#7C6CF2]"
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
                  <h3 className="text-sm font-semibold text-zinc-450">Sprint Backlog Board</h3>
                  
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    {['Todo', 'In Progress', 'Done'].map((col, cIdx) => (
                      <div key={col} className="bg-[rgba(10,10,10,0.72)]/30 border border-white/5 rounded-[20px] p-3 flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{col}</span>
                        {col === 'Todo' && (
                          <div className="bg-[rgba(10,10,10,0.72)] border border-white/5 p-3 rounded-xl shadow-sm">
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded">Medium</span>
                            <h4 className="text-xs font-bold text-white mt-1.5">Setup Landing Page UI</h4>
                          </div>
                        )}
                        {col === 'In Progress' && (
                          <motion.div
                            layoutId="demo-kanban-card"
                            className="bg-[#7C6CF2]/5 border border-[#7C6CF2]/20 p-3 rounded-xl shadow-lg relative"
                          >
                            <span className="text-[9px] font-bold text-[#7C6CF2] bg-[#7C6CF2]/10 px-2 py-0.5 rounded">High</span>
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
                              <MousePointer size={10} className="text-[#7C6CF2]" />
                            </motion.div>
                          </motion.div>
                        )}
                        {col === 'Done' && (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl opacity-60">
                            <span className="text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded">Low</span>
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
                  <div className="flex-1 bg-[rgba(10,10,10,0.72)]/40 border border-white/5 rounded-[20px] p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-550">TASK-102</span>
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
                          <input type="checkbox" checked={sub.c} readOnly className="rounded border-zinc-850 text-[#7C6CF2] focus:ring-0 bg-transparent" />
                          <span className={sub.c ? 'line-through text-zinc-650' : 'text-zinc-300'}>{sub.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-64 bg-[rgba(10,10,10,0.72)]/85 border border-white/5 rounded-[20px] p-4 space-y-4">
                    <div className="text-xs font-bold text-white">Attributes</div>
                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                      <span className="text-zinc-500">Status</span>
                      <span className="font-semibold text-[#7C6CF2]">In Progress</span>
                      
                      <span className="text-zinc-500">Priority</span>
                      <span className="font-semibold text-amber-500">High</span>

                      <span className="text-zinc-500">Assignee</span>
                      <span className="text-zinc-355">Test User</span>

                      <span className="text-zinc-500">Due Date</span>
                      <span className="text-zinc-355">July 8, 2026</span>
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
                  <div className="flex-1 bg-[rgba(10,10,10,0.72)]/50 border border-white/5 rounded-[20px] p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Sparkles size={14} className="text-[#7C6CF2]" />
                      <span className="text-xs font-semibold text-white">AI Copilot Analysis</span>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                      <div className="bg-[#0A0A0A]/60 p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-zinc-350 italic">"What are the main risks for our sprint release?"</p>
                      </div>
                      <div className="bg-[#7C6CF2]/5 border border-[#7C6CF2]/20 p-3 rounded-xl">
                        <p className="text-xs text-[#A78BFA] leading-relaxed">
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
                      <button key={i} className="text-left px-3 py-2 bg-[rgba(10,10,10,0.72)] hover:bg-white/[0.04] border border-white/5 rounded-xl text-xs font-medium text-zinc-300 transition-colors cursor-pointer">
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
                  <h3 className="text-sm font-semibold text-zinc-450">Deadlines & Deliverables</h3>

                  <div className="grid grid-cols-7 gap-2 flex-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="text-center text-[9px] uppercase font-bold text-zinc-650">{day}</div>
                    ))}
                    {Array.from({ length: 14 }).map((_, i) => {
                      const dayNum = i + 1;
                      const hasEvent = dayNum === 5 || dayNum === 11;
                      return (
                        <div key={i} className={`bg-[rgba(10,10,10,0.72)]/40 border border-white/5 rounded-xl p-2 flex flex-col justify-between min-h-[60px] ${dayNum === 5 ? 'bg-[#7C6CF2]/5 border-[#7C6CF2]/20' : ''}`}>
                          <span className="text-[10px] font-bold text-zinc-550">{dayNum}</span>
                          {hasEvent && (
                            <span className="text-[8px] bg-[#7C6CF2]/20 text-[#A78BFA] px-1 py-0.5 rounded truncate font-medium">
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
                  <h3 className="text-sm font-semibold text-zinc-450">Inbox & Activity</h3>
                  
                  <div className="space-y-2 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                    {[
                      { t: 'Assigned to you', m: 'Harsh assigned you to "Implement Auth Cookie Flow"', d: '2m ago' },
                      { t: 'Overdue Warning', m: 'AI Alert: "Verify Token Security" has missed its deadline', d: '1h ago' }
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[#0A0A0A]/80 border border-white/5 rounded-xl">
                        <span className="text-lg">🔔</span>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-white">{n.t}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{n.m}</p>
                        </div>
                        <span className="text-[10px] text-zinc-650">{n.d}</span>
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
                  <h3 className="text-sm font-semibold text-zinc-450">Realtime Discussion</h3>
                  
                  <div className="space-y-3 flex-1 flex flex-col justify-end max-w-xl mx-auto w-full">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">HP</div>
                      <div className="bg-[rgba(10,10,10,0.72)] border border-white/5 p-2.5 rounded-2xl rounded-tl-none">
                        <p className="text-xs text-white font-medium">Should we implement full token auth or cookie based session?</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-[#7C6CF2]/5 border border-[#7C6CF2]/20 p-2.5 rounded-2xl rounded-tr-none">
                        <p className="text-xs text-[#A78BFA] font-medium">HttpOnly Cookie authentication will be much safer against XSS.</p>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-[#7C6CF2] flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                    </div>
                    <div className="text-[10px] text-zinc-550 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#7C6CF2] animate-ping" />
                      <span>Sarah is typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.section>

      {/* DYNAMIC INTERACTIVE DEMOS SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        id="features"
        className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-12 text-center">
          Experience the platform in <span className="text-[#A78BFA]">real-time</span>.
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AI Terminal Demo */}
          <div className="bg-[rgba(10,10,10,0.72)] backdrop-blur-md border border-white/5 rounded-[20px] p-6 relative overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/12 hover:translate-y-[-4px]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-[#7C6CF2]" />
              <h3 className="text-sm font-bold text-white">Interactive Copilot terminal</h3>
            </div>
            
            <div className="h-64 bg-[#0A0A0A]/80 border border-white/5 rounded-xl p-4 overflow-y-auto font-mono text-xs space-y-3 mb-4">
              {demoChat.map((chat, idx) => (
                <div key={idx} className={chat.role === 'user' ? 'text-[#A78BFA]' : 'text-zinc-400'}>
                  <span className="text-zinc-650">{chat.role === 'user' ? 'visitor$' : 'copilot$'}</span> {chat.text}
                </div>
              ))}
              {demoChatLoading && (
                <div className="text-zinc-600 animate-pulse">copilot$ Thinking...</div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-550 uppercase">Click prompt to run:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => triggerAiDemo('Find blockers in Sprint')}
                  className="px-3 py-1.5 bg-[rgba(10,10,10,0.72)] hover:bg-white/[0.04] border border-white/5 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Find blockers
                </button>
                <button
                  onClick={() => triggerAiDemo('Suggest sprint plan')}
                  className="px-3 py-1.5 bg-[rgba(10,10,10,0.72)] hover:bg-white/[0.04] border border-white/5 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Suggest sprint plan
                </button>
              </div>
            </div>
          </div>

          {/* Realtime Collaboration Cursors Demo */}
          <div className="bg-[rgba(10,10,10,0.72)] backdrop-blur-md border border-white/5 rounded-[20px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px] shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/12 hover:translate-y-[-4px]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MousePointer size={16} className="text-[#A78BFA]" />
                <h3 className="text-sm font-bold text-white font-sans font-semibold">Multi-User Cursor Alignment</h3>
              </div>
              <p className="text-xs text-zinc-500">Every cursor operates synchronously over secure Socket.IO connection channels.</p>
            </div>

            {/* Cursors Grid Field */}
            <div className="h-44 border border-white/5 rounded-xl relative bg-[#0A0A0A]/40 overflow-hidden mt-4">
              {cursors.map((cursor) => (
                <motion.div
                  key={cursor.id}
                  animate={{ x: cursor.x, y: cursor.y }}
                  transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                  className="absolute flex flex-col items-start pointer-events-none"
                  style={{ left: 0, top: 0 }}
                >
                  <MousePointer size={14} className="text-[#7C6CF2] fill-[#7C6CF2]" />
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
      </motion.section>

      {/* DYNAMIC KANBAN ANIMATION SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-6 pb-24"
      >
        <div className="bg-[rgba(10,10,10,0.72)] backdrop-blur-md border border-white/5 rounded-[20px] p-8 relative overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/12 hover:translate-y-[-4px]">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Interactive Kanban drag-and-drop</h3>
            <p className="text-xs text-zinc-500 mb-6">See how simple managing tasks is. Click to transition any task card to completed status instantly.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Backlog / Progress</span>
              <AnimatePresence>
                {kanbanTasks
                  .filter((t) => t.status !== 'Completed')
                  .map((task) => (
                     <motion.div
                       key={task.id}
                       layout
                       exit={{ opacity: 0, x: 100 }}
                       className="p-4 bg-[rgba(10,10,10,0.72)]/85 border border-white/5 rounded-[20px] flex items-center justify-between group hover:border-white/12 transition-colors"
                     >
                       <div>
                         <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded">{task.priority}</span>
                         <h4 className="text-xs font-bold text-white mt-1.5">{task.title}</h4>
                       </div>
                       <button
                         onClick={() => handleTaskComplete(task.id)}
                         className="h-7 px-3 bg-white/[0.03] hover:bg-[#7C6CF2]/10 hover:text-[#A78BFA] border border-white/5 hover:border-[#7C6CF2]/20 rounded-xl text-[10px] font-bold text-zinc-400 transition-all cursor-pointer"
                       >
                         Complete
                       </button>
                     </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-emerald-450">Completed tasks</span>
              <div className="bg-[#0A0A0A]/30 border border-white/5 rounded-[20px] p-4 min-h-[160px] flex flex-col gap-2 justify-center">
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
                        <CheckCircle size={14} className="text-emerald-450 flex-shrink-0" />
                        <span className="text-xs text-zinc-450 line-through truncate">{task.title}</span>
                      </motion.div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pricing / CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        id="pricing"
        className="max-w-5xl mx-auto px-6 pb-32 text-center relative"
      >
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
            <div key={item.t} className="p-5 bg-[rgba(10,10,10,0.72)] backdrop-blur-md border border-white/5 rounded-[20px] shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/12 hover:translate-y-[-4px]">
              <h4 className="text-xs font-bold text-white mb-2">{item.t}</h4>
              <p className="text-[11px] text-zinc-550 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0A] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-550">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-[#A78BFA]" />
            <span className="font-semibold text-zinc-400">DevFlow AI</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-zinc-300">Features</a>
            <a href="#pricing" className="hover:text-zinc-300">Pricing</a>
            <Link to="/docs" className="hover:text-zinc-300">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
