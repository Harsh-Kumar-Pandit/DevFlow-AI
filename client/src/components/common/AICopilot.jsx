import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Sparkles, X, Send, Loader2, Zap, FileText, AlertCircle, Users } from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { useWorkspace } from '../../context/WorkspaceContext';

const QUICK_ACTIONS = [
  { id: 'sprint',    icon: Zap,          label: 'Sprint Summary', desc: 'Summarize workspace activity' },
  { id: 'blockers',  icon: AlertCircle,  label: 'Find Blockers',  desc: 'Identify overdue and stuck tasks' },
  { id: 'workload',  icon: Users,        label: 'Team Workload',  desc: 'Who has most tasks?' },
  { id: 'readme',    icon: FileText,     label: 'Generate README',desc: 'Draft a project readme' },
];

/* ── Shared chat content ─────────────────────────────────────────────────── */
function CopilotContent({ messages, loading, input, setInput, sendMessage, handleQuickAction, onClose }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 flex-shrink-0">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">AI Copilot</h2>
          <p className="text-[10px] text-zinc-500">Context-aware workspace assistant</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto h-8 w-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-b border-zinc-800/50 flex-shrink-0">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Quick Actions</p>
          {/* Mobile: horizontal scroll row | Desktop: 2-col grid */}
          <div className="flex lg:grid lg:grid-cols-2 gap-2 overflow-x-auto scrollbar-none pb-1">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className="flex-shrink-0 flex items-start gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-800 transition-all text-left group min-w-[160px] lg:min-w-0"
              >
                <action.icon size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-zinc-300 group-hover:text-white whitespace-nowrap">{action.label}</p>
                  <p className="text-[10px] text-zinc-600 leading-snug">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Sparkles size={11} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[280px] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white rounded-tr-md'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-md'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Loader2 size={11} className="text-white animate-spin" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-md flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="h-1.5 w-1.5 bg-zinc-500 rounded-full"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about your workspace…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-2 text-center">AI responses are based on your workspace data</p>
      </div>
    </>
  );
}

/* ── Main exported component ─────────────────────────────────────────────── */
export function AICopilot({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your DevFlow AI Copilot. I know your projects, tasks, and team. What can I help you with today?" },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await aiService.chat(currentWorkspace?._id, question);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (error) {
      console.error('AI Copilot Error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    const prompts = {
      sprint:   'Give me a sprint summary for this workspace. What was accomplished recently?',
      blockers: 'What tasks are blocked, overdue, or stuck? Who is responsible?',
      workload: 'Which team member has the most tasks? Is the workload balanced?',
      readme:   'Generate a project README based on the projects and tasks in this workspace.',
    };
    sendMessage(prompts[action.id]);
  };

  const sharedProps = { messages, loading, input, setInput, sendMessage, handleQuickAction, onClose };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Desktop: right-side drawer ─────────────────────────────── */}
          <div className="hidden lg:block fixed inset-0 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="absolute right-0 top-0 h-full w-[420px] bg-zinc-950 border-l border-zinc-800 flex flex-col pointer-events-auto shadow-2xl"
            >
              <CopilotContent {...sharedProps} />
            </motion.div>
          </div>

          {/* ── Mobile: bottom sheet ───────────────────────────────────── */}
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.15 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
              className="absolute bottom-0 left-0 right-0 bg-zinc-950 rounded-t-3xl border-t border-zinc-800 flex flex-col"
              style={{ height: '95dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="h-1 w-10 bg-zinc-700 rounded-full" />
              </div>
              <CopilotContent {...sharedProps} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
