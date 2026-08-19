import { motion } from 'framer-motion';
import { X, Search, HelpCircle, LayoutDashboard, Building2, FolderKanban, Calendar, Sparkles, Plus, Users, Bell, Settings } from 'lucide-react';
import { Modal } from '../ui/Modal';

const SHORTCUT_CATEGORIES = [
  {
    title: 'Navigation (G → [Key])',
    items: [
      { keys: ['G', 'D'], label: 'Dashboard', icon: LayoutDashboard },
      { keys: ['G', 'W'], label: 'Workspace', icon: Building2 },
      { keys: ['G', 'P'], label: 'Projects', icon: FolderKanban },
      { keys: ['G', 'K'], label: 'Kanban', icon: FolderKanban },
      { keys: ['G', 'C'], label: 'Calendar', icon: Calendar },
      { keys: ['G', 'A'], label: 'AI Copilot', icon: Sparkles },
      { keys: ['G', 'N'], label: 'Notifications', icon: Bell },
      { keys: ['G', 'S'], label: 'Settings', icon: Settings },
    ]
  },
  {
    title: 'Quick Actions (N → [Key])',
    items: [
      { keys: ['N', 'T'], label: 'New Task', icon: Plus },
      { keys: ['N', 'P'], label: 'New Project', icon: FolderKanban },
      { keys: ['N', 'M'], label: 'Invite Member', icon: Users },
    ]
  },
  {
    title: 'System',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Global Search', icon: Search },
      { keys: ['Ctrl', '/'], label: 'Show Shortcuts', icon: HelpCircle },
      { keys: ['Esc'], label: 'Close Modal', icon: X },
    ]
  }
];

export function KeyboardShortcutsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" width="max-w-2xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        <p className="text-xs text-zinc-400">
          Boost your productivity with sequential and global keyboard shortcuts. For sequence shortcuts (like <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-350 text-[10px]">G</kbd> then <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-350 text-[10px]">D</kbd>), press the keys one after the other.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {SHORTCUT_CATEGORIES.map((category, idx) => (
            <div key={idx} className={idx === 0 ? "md:col-span-2 space-y-3" : "space-y-3"}>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-zinc-800 pb-1.5 font-semibold">
                {category.title}
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-2">
                {category.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={itemIdx} 
                      className="flex items-center justify-between p-2.5 bg-zinc-950/40 border border-zinc-850 rounded-xl hover:border-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 flex-shrink-0">
                          <Icon size={12} />
                        </div>
                        <span className="text-xs font-medium text-zinc-300 truncate">{item.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 shadow shadow-black/20 font-bold">
                              {key}
                            </kbd>
                            {keyIdx < item.keys.length - 1 && <span className="text-[9px] text-zinc-650">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
