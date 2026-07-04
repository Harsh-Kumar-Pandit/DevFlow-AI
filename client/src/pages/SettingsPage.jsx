import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Keyboard, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'workspace',     label: 'Workspace',      icon: Building2 },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'shortcuts',     label: 'Shortcuts',      icon: Keyboard },
  { id: 'danger',        label: 'Danger Zone',    icon: Trash2 },
];

const SHORTCUTS = [
  { keys: ['⌘', 'K'],  description: 'Open global search' },
  { keys: ['⌘', '/'],  description: 'Show keyboard shortcuts' },
  { keys: ['G', 'D'],  description: 'Go to dashboard' },
  { keys: ['G', 'W'],  description: 'Go to workspace' },
  { keys: ['N', 'T'],  description: 'New task' },
  { keys: ['Esc'],     description: 'Close panel / drawer' },
];

/* ── Shared section content ────────────────────────────────────────────── */
function SectionContent({ activeTab, user, currentWorkspace, logout }) {
  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
    >
      {/* ── Profile ─────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Profile Settings</h2>

          {/* Avatar card */}
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
            <Avatar user={user} size="xl" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-sm text-zinc-400">@{user?.username}</p>
              <p className="text-xs text-zinc-600 mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <Input label="Full Name"  defaultValue={user?.fullName}  disabled />
            <Input label="Username"   defaultValue={user?.username}  disabled />
            <Input label="Email"      defaultValue={user?.email}     disabled />
            <div className="flex justify-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => toast('Profile editing coming soon!')}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workspace ───────────────────────────────────────────────── */}
      {activeTab === 'workspace' && (
        <div className="p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Workspace</h2>
          {currentWorkspace ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {currentWorkspace.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white truncate">{currentWorkspace.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="default" size="sm">
                      {currentWorkspace.members?.length || 0} members
                    </Badge>
                    <code className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {currentWorkspace.inviteCode}
                    </code>
                  </div>
                </div>
              </div>
              <Input label="Workspace Name" defaultValue={currentWorkspace.name} disabled />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No workspace selected</p>
          )}
        </div>
      )}

      {/* ── Notifications ───────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="p-5 sm:p-6 space-y-1">
          <h2 className="text-base font-semibold text-white mb-4">Notification Preferences</h2>
          {['Task assignments', 'Status changes', 'Comments', 'Join requests', 'Project creation'].map((item) => (
            <div key={item} className="flex items-center justify-between py-3.5 border-b border-zinc-800/70 last:border-0 min-h-[52px]">
              <span className="text-sm text-zinc-300">{item}</span>
              <div className="h-6 w-11 bg-indigo-500 rounded-full relative cursor-pointer flex-shrink-0">
                <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Shortcuts ───────────────────────────────────────────────── */}
      {activeTab === 'shortcuts' && (
        <div className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white mb-4">Keyboard Shortcuts</h2>
          <div className="space-y-1">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 border-b border-zinc-800/70 last:border-0 min-h-[52px]">
                <span className="text-sm text-zinc-300">{s.description}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {s.keys.map((key, j) => (
                    <kbd key={j} className="px-2 py-1 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300">
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
            <p className="text-sm text-zinc-500 mt-1">These actions are irreversible. Proceed with caution.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-200">Sign Out</p>
              <p className="text-xs text-zinc-500 mt-0.5">End your current session</p>
            </div>
            <Button variant="danger" size="sm" className="w-full sm:w-auto" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */
export function SettingsPage() {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState('profile');

  const sectionProps = { activeTab, user, currentWorkspace, logout };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">

      {/* Page title */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account and workspace preferences</p>
      </div>

      {/* ── MOBILE: horizontal scrollable tab pills ────────────────── */}
      <div className="flex lg:hidden overflow-x-auto scrollbar-none gap-2 pb-4 mb-4 -mx-4 px-4">
        {TABS.map((tab) => {
          const isDanger  = tab.id === 'danger';
          const isActive  = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all min-h-[44px]',
                isActive && !isDanger && 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
                isActive && isDanger  && 'bg-red-500/15 text-red-400 border border-red-500/25',
                !isActive && !isDanger && 'text-zinc-500 bg-zinc-900 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700',
                !isActive && isDanger  && 'text-red-500/70 bg-red-500/5 border border-red-500/15 hover:text-red-400'
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── DESKTOP: sidebar + content | MOBILE: content only ─────── */}
      <div className="flex gap-6">

        {/* Desktop left nav */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-indigo-500/10 text-indigo-300'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800',
                  tab.id === 'danger' && 'text-red-500 hover:bg-red-500/10 hover:text-red-400'
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <SectionContent {...sectionProps} />
        </div>
      </div>
    </div>
  );
}
