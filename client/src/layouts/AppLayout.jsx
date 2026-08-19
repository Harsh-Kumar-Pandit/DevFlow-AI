import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { MobileTopBar, MobileDrawer } from '../components/common/MobileNav';
import { AICopilot } from '../components/common/AICopilot';
import { SocketProvider, useSocket } from '../context/SocketContext';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { NotificationProvider } from '../context/NotificationContext';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { Skeleton } from '../components/ui/Skeleton';
import { GlobalSearch } from '../components/common/GlobalSearch';
import { projectService } from '../services/project.service';

// Global keyboard shortcut modals
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { CreateProjectModal } from '../components/common/CreateProjectModal';
import { InviteMemberModal } from '../components/common/InviteMemberModal';
import { KeyboardShortcutsModal } from '../components/common/KeyboardShortcutsModal';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

function InnerAppLayout() {
  const [aiOpen,          setAiOpen]          = useState(false);
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [mobileSearchOpen,setMobileSearchOpen]= useState(false);

  // Global action modal states
  const [createTaskOpen,    setCreateTaskOpen]    = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [inviteMemberOpen,   setInviteMemberOpen]   = useState(false);
  const [shortcutsOpen,     setShortcutsOpen]     = useState(false);

  const { workspaceId } = useParams();
  const { workspaces, currentWorkspace, setCurrentWorkspace, loading, fetchWorkspaces } = useWorkspace();
  const { onlineUsers } = useSocket() || {};
  const navigate = useNavigate();

  // Keep track of projects for creating tasks globally
  const [workspaceProjects, setWorkspaceProjects] = useState([]);
  const lastKeyRef = useRef({ key: null, time: 0 });

  // Sync workspace from URL param
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const match = workspaces.find((w) => w._id === workspaceId);
      if (match && currentWorkspace?._id !== workspaceId) {
        setCurrentWorkspace(match);
      }
    }
  }, [workspaceId, workspaces, currentWorkspace, setCurrentWorkspace]);

  // Load workspace projects
  useEffect(() => {
    if (currentWorkspace?._id) {
      projectService.getWorkspaceProjects(currentWorkspace._id)
        .then((res) => {
          setWorkspaceProjects(res.data.projects || []);
        })
        .catch(console.error);
    } else {
      setWorkspaceProjects([]);
    }
  }, [currentWorkspace?._id]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [workspaceId]);

  // Global keyboard shortcuts hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Guard against typing inside form input / editable elements
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      )) {
        return;
      }

      const key = e.key;
      const now = Date.now();

      // 2. Global Ctrl+K / Ctrl+/ shortcuts
      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileSearchOpen(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === '/') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // 3. Escape key to close AI panel
      if (key === 'Escape') {
        if (aiOpen) {
          setAiOpen(false);
        }
        return;
      }

      // 4. Sequential shortcuts: Check prefix sequence
      const prev = lastKeyRef.current;
      const timeDiff = now - prev.time;

      if (prev.key && timeDiff < 1500) {
        const prefix = prev.key;
        const currentKey = key.toLowerCase();

        // Clear sequence prefix immediately
        lastKeyRef.current = { key: null, time: 0 };

        const targetWorkspaceId = workspaceId || currentWorkspace?._id;

        if (prefix === 'g') {
          if (currentKey === 'd') {
            e.preventDefault();
            if (targetWorkspaceId) navigate(`/app/dashboard/${targetWorkspaceId}`);
            return;
          }
          if (currentKey === 'w') {
            e.preventDefault();
            if (targetWorkspaceId) navigate(`/app/workspace/${targetWorkspaceId}`);
            return;
          }
          if (currentKey === 'p') {
            e.preventDefault();
            if (targetWorkspaceId) navigate(`/app/workspace/${targetWorkspaceId}/projects`);
            return;
          }
          if (currentKey === 'k') {
            e.preventDefault();
            if (targetWorkspaceId) navigate(`/app/workspace/${targetWorkspaceId}/kanban`);
            return;
          }
          if (currentKey === 'c') {
            e.preventDefault();
            if (targetWorkspaceId) navigate(`/app/workspace/${targetWorkspaceId}/calendar`);
            return;
          }
          if (currentKey === 'a') {
            e.preventDefault();
            setAiOpen((prevOpen) => !prevOpen);
            return;
          }
          if (currentKey === 'n') {
            e.preventDefault();
            navigate(`/app/notifications`);
            return;
          }
          if (currentKey === 's') {
            e.preventDefault();
            navigate(`/app/settings`);
            return;
          }
        } else if (prefix === 'n') {
          if (currentKey === 't') {
            e.preventDefault();
            setCreateTaskOpen(true);
            return;
          }
          if (currentKey === 'p') {
            e.preventDefault();
            setCreateProjectOpen(true);
            return;
          }
          if (currentKey === 'm') {
            e.preventDefault();
            setInviteMemberOpen(true);
            return;
          }
        }
      }

      // Track sequence prefix keys
      if (key.toLowerCase() === 'g' || key.toLowerCase() === 'n') {
        lastKeyRef.current = { key: key.toLowerCase(), time: now };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaceId, currentWorkspace, aiOpen, navigate]);

  if (loading && workspaces.length === 0) {
    return (
      <div className="h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm px-6">
          <Skeleton className="h-10 w-10 rounded-2xl animate-pulse" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return <OnboardingWizard onComplete={fetchWorkspaces} />;
  }

  const activeWorkspaceId = workspaceId || currentWorkspace?._id;
  const workspaceMembers = currentWorkspace?.members || [];

  return (
    <div className="flex h-screen bg-[#09090B] overflow-hidden">
      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────── */}
      <div className="hidden lg:flex">
        <Sidebar onAIOpen={() => setAiOpen(true)} />
      </div>

      {/* ── Main content column ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop navbar (hidden on mobile) */}
        <div className="hidden lg:block">
          <Navbar onAIOpen={() => setAiOpen(true)} onSearchOpen={() => setMobileSearchOpen(true)} />
        </div>

        {/* Mobile top bar (hidden on desktop) */}
        <MobileTopBar
          onMenuOpen={() => setMobileMenuOpen(true)}
          onAIOpen={() => setAiOpen(true)}
          onSearchOpen={() => setMobileSearchOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ── AI Copilot (right drawer desktop / bottom sheet mobile) ─────── */}
      <AICopilot open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* ── Mobile drawer nav ────────────────────────────────────────────── */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onAIOpen={() => { setMobileMenuOpen(false); setAiOpen(true); }}
        onSearchOpen={() => { setMobileMenuOpen(false); setMobileSearchOpen(true); }}
      />

      {/* Mobile fullscreen search */}
      <GlobalSearch
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />

      {/* ── Global action modals triggered by keyboard shortcuts ───────── */}
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        workspaceId={activeWorkspaceId}
        projectId={workspaceProjects[0]?._id}
        members={workspaceMembers}
        onCreated={() => {
          // Trigger fetchWorkspaces or custom update if needed,
          // but since individual pages load their own states, they'll fetch
          // live or we can just show success toast.
        }}
      />

      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        workspaceId={activeWorkspaceId}
        onCreated={() => {
          // Refresh workspaces list to sync any project counters
          fetchWorkspaces();
        }}
      />

      <InviteMemberModal
        open={inviteMemberOpen}
        onClose={() => setInviteMemberOpen(false)}
        workspaceId={activeWorkspaceId}
        currentWorkspace={currentWorkspace}
        onlineUsers={onlineUsers}
      />
    </div>
  );
}

export function AppLayout() {
  return (
    <SocketProvider>
      <WorkspaceProvider>
        <NotificationProvider>
          <InnerAppLayout />
        </NotificationProvider>
      </WorkspaceProvider>
    </SocketProvider>
  );
}
