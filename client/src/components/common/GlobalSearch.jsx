import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Hash, X, ArrowRight, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';

export function GlobalSearch({ open, onClose }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent,  setRecent]  = useState(() =>
    JSON.parse(localStorage.getItem('devflow-recent-searches') || '[]')
  );
  const { currentWorkspace } = useWorkspace();
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await api.get('/search/tasks', { params: { keyword: q } });
      setResults({ tasks: res.data.tasks || [] });
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) { setQuery(''); setResults(null); }
    else { setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSelect = (task) => {
    const newRecent = [{ type: 'task', label: task.title, id: task._id }, ...recent.slice(0, 4)];
    setRecent(newRecent);
    localStorage.setItem('devflow-recent-searches', JSON.stringify(newRecent));
    navigate(`/app/workspace/${currentWorkspace?._id}/project/${task.project}`);
    onClose();
  };

  const ResultContent = () => (
    <div className="overflow-y-auto flex-1 lg:max-h-[400px] p-2">
      {!query && recent.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 py-2">Recent</p>
          {recent.map((r, i) => (
            <button key={i} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors text-left min-h-[44px]">
              <Clock size={14} className="flex-shrink-0" />
              {r.label}
            </button>
          ))}
        </div>
      )}

      {results?.tasks?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 py-2">Tasks</p>
          {results.tasks.map((task) => (
            <button
              key={task._id}
              onClick={() => handleSelect(task)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm hover:bg-zinc-800 transition-colors text-left group min-h-[44px]"
            >
              <Hash size={14} className="text-zinc-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 truncate">{task.title}</p>
                <p className="text-[11px] text-zinc-500">{task.status} · {task.priority}</p>
              </div>
              <ArrowRight size={13} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {results?.tasks?.length === 0 && query && (
        <div className="px-4 py-10 text-center">
          <Search size={28} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No results for "{query}"</p>
        </div>
      )}

      {!query && recent.length === 0 && (
        <div className="px-4 py-10 text-center">
          <Search size={28} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Start typing to search</p>
          <p className="text-xs text-zinc-600 mt-1">Tasks, projects, and members</p>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Desktop: floating palette ─────────────────────────────── */}
          <div className="hidden lg:flex fixed inset-0 z-50 items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <Search size={16} className="text-zinc-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, projects, members..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                />
                {loading && <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
              </div>
              <ResultContent />
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-zinc-800 text-[10px] text-zinc-600">
                <span><kbd className="font-mono bg-zinc-800 px-1 rounded">↑↓</kbd> Navigate</span>
                <span><kbd className="font-mono bg-zinc-800 px-1 rounded">↵</kbd> Select</span>
                <span><kbd className="font-mono bg-zinc-800 px-1 rounded">esc</kbd> Close</span>
              </div>
            </motion.div>
          </div>

          {/* ── Mobile: fullscreen overlay ────────────────────────────── */}
          <div className="lg:hidden fixed inset-0 z-[110] bg-[#09090B] flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="flex flex-col h-full"
            >
              {/* Search bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                <Search size={18} className="text-zinc-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, projects, members…"
                  className="flex-1 bg-transparent text-base text-white placeholder-zinc-500 outline-none"
                  autoFocus
                />
                {loading && <Loader2 size={18} className="text-indigo-400 animate-spin flex-shrink-0" />}
                <button
                  onClick={onClose}
                  className="h-11 w-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <ResultContent />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
