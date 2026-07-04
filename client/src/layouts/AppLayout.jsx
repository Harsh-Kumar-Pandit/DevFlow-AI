import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useParams } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { MobileTopBar, MobileDrawer } from '../components/common/MobileNav';
import { AICopilot } from '../components/common/AICopilot';
import { SocketProvider } from '../context/SocketContext';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { NotificationProvider } from '../context/NotificationContext';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { Skeleton } from '../components/ui/Skeleton';
import { GlobalSearch } from '../components/common/GlobalSearch';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

function InnerAppLayout() {
  const [aiOpen,          setAiOpen]          = useState(false);
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [mobileSearchOpen,setMobileSearchOpen]= useState(false);

  const { workspaceId } = useParams();
  const { workspaces, currentWorkspace, setCurrentWorkspace, loading, fetchWorkspaces } = useWorkspace();

  // Sync workspace from URL param
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const match = workspaces.find((w) => w._id === workspaceId);
      if (match && currentWorkspace?._id !== workspaceId) {
        setCurrentWorkspace(match);
      }
    }
  }, [workspaceId, workspaces, currentWorkspace, setCurrentWorkspace]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [workspaceId]);

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
          <Navbar onAIOpen={() => setAiOpen(true)} />
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
