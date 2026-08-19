import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalIcon, Flag, Paperclip, MessageSquare, Activity as ActIcon,
  Sparkles, Wand2, Trash2, Edit2, Check, X, Plus, AlertCircle, CheckSquare, ListTodo,
  User, Clock, ArrowRight, CheckCircle2, Download, Tag
} from 'lucide-react';
import { taskService } from '../../services/task.service';
import { commentService } from '../../services/comment.service';
import { aiService } from '../../services/ai.service';
import { uploadService } from '../../services/upload.service';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { getPriorityConfig } from '../../utils/getPriorityColor';
import { formatRelativeTime, formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import api from '../../services/api';

// Custom lightweight Markdown Renderer to render description typography properly with no extra dependencies
function MarkdownRenderer({ content }) {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-sm text-zinc-300 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        // Headings
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-1">{parseInlineStyles(line.slice(4))}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-black text-white mt-5 mb-1.5">{parseInlineStyles(line.slice(3))}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-black text-white mt-6 mb-2">{parseInlineStyles(line.slice(2))}</h2>;
        }
        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1 my-0.5">
              <li className="text-zinc-300">{parseInlineStyles(line.slice(2))}</li>
            </ul>
          );
        }
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1 my-0.5">
              <li className="text-zinc-300">{parseInlineStyles(numMatch[2])}</li>
            </ol>
          );
        }
        // Blockquote
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-indigo-500 pl-3 py-0.5 italic text-zinc-400 my-1 bg-zinc-900/30 rounded-r-lg">
              {parseInlineStyles(line.slice(2))}
            </blockquote>
          );
        }
        // Empty Line
        if (!line.trim()) return <div key={idx} className="h-1.5" />;
        // Paragraph
        return <p key={idx} className="my-1">{parseInlineStyles(line)}</p>;
      })}
    </div>
  );
}

function parseInlineStyles(text) {
  let parts = [text];
  // Inline Code
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return part;
    const segments = part.split(/(`[^`]+`)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return <code key={i} className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-pink-400 font-mono text-xs">{seg.slice(1, -1)}</code>;
      }
      return seg;
    });
  });
  // Bold
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return part;
    const segments = part.split(/(\*\*[^*]+\*\*)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });
  });
  // Italic
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return part;
    const segments = part.split(/(\*[^*]+\*)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('*') && seg.endsWith('*')) {
        return <em key={i} className="italic text-zinc-200">{seg.slice(1, -1)}</em>;
      }
      return seg;
    });
  });
  return parts;
}

// Helper to determine Activity Icons and colors dynamically
const getActivityIcon = (action, desc) => {
  const d = desc?.toLowerCase() || '';
  const a = action?.toLowerCase() || '';
  if (a === 'create_task' || d.includes('created')) {
    return { icon: <Plus size={12} className="text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20' };
  }
  if (a === 'status_changed' || d.includes('status') || d.includes('moved')) {
    return { icon: <ArrowRight size={12} className="text-blue-400" />, bg: 'bg-blue-500/10 border-blue-500/20' };
  }
  if (a === 'task_assigned' || d.includes('assigned')) {
    return { icon: <User size={12} className="text-purple-400" />, bg: 'bg-purple-500/10 border-purple-500/20' };
  }
  if (d.includes('completed')) {
    return { icon: <CheckCircle2 size={12} className="text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20' };
  }
  return { icon: <Edit2 size={12} className="text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/20' };
};

export function TaskDrawer({ task, open, onClose, projectId, workspaceId, onUpdated, members = [] }) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { joinTask, leaveTask, socket } = useSocket() || {};
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  
  const [fullTask, setFullTask] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Checklist and edit states
  const [newCheckItem, setNewCheckItem] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Mention system state
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const commentRef = useRef(null);

  // Check if current user is admin (owner) of the workspace
  const isAdmin = currentWorkspace?.owner?._id === user?.id || currentWorkspace?.owner === user?.id || currentWorkspace?.owner?._id === user?._id || currentWorkspace?.owner === user?._id;
  const workspaceMembers = members.length > 0 ? members : (currentWorkspace?.members || []);

  const displayTask = fullTask || task;

  // ESC key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!task?._id || !open) return;
    joinTask?.(task._id);
    loadComments();
    loadFullTask();
    loadActivities();
    // Reset AI report state on new task open
    setAiReport(null);
    return () => leaveTask?.(task._id);
  }, [task?._id, open]);

  // Live updates via socket.io
  useEffect(() => {
    if (!socket || !open) return;
    const added = (c) => setComments((prev) => [...prev, c]);
    const updated = (c) => setComments((prev) => prev.map((x) => x._id === c._id ? c : x));
    const deleted = ({ commentId }) => setComments((prev) => prev.filter((c) => c._id !== commentId));
    
    socket.on('comment-added', added);
    socket.on('comment-updated', updated);
    socket.on('comment-deleted', deleted);

    return () => {
      socket.off('comment-added', added);
      socket.off('comment-updated', updated);
      socket.off('comment-deleted', deleted);
    };
  }, [socket, open]);

  const loadFullTask = async () => {
    try {
      const res = await taskService.getTask(task._id);
      setFullTask(res.data.task);
      setEditedTitle(res.data.task.title);
      // Clean description (excluding checklist and estimate meta)
      setEditedDesc(getCleanDescription(res.data.task.description || ''));
    } catch {}
  };

  const loadComments = async () => {
    try {
      const res = await commentService.getTaskComments(task._id);
      setComments(res.data.comments || []);
    } catch {}
  };

  const loadActivities = async () => {
    try {
      const res = await api.get(`/activity/task/${task._id}`);
      setActivities(res.data.activities || []);
    } catch {}
  };

  // Helper serialization for checklist and estimatedTime inside description string
  const getCleanDescription = (desc) => {
    if (!desc) return '';
    return desc.split('\n\n---checklist---\n')[0].split('\n\n---estimate---\n')[0];
  };

  const parseChecklist = (desc) => {
    if (!desc) return [];
    const parts = desc.split('\n\n---checklist---\n');
    if (parts.length < 2) return [];
    try {
      // Might contain estimate serialized after checklist
      const rawChecklist = parts[1].split('\n\n---estimate---\n')[0];
      return JSON.parse(rawChecklist);
    } catch {
      return [];
    }
  };

  const parseEstimate = (desc) => {
    if (!desc) return '8 hrs';
    const parts = desc.split('\n\n---estimate---\n');
    if (parts.length < 2) return '8 hrs';
    return parts[1].trim();
  };

  const getChecklistItems = () => {
    return parseChecklist(displayTask?.description || '');
  };

  const handleUpdateChecklist = async (newItems) => {
    const cleanDesc = getCleanDescription(displayTask?.description || '');
    const estVal = parseEstimate(displayTask?.description);
    
    let newDesc = cleanDesc;
    if (newItems.length > 0) {
      newDesc += `\n\n---checklist---\n${JSON.stringify(newItems)}`;
    }
    if (estVal && estVal !== '8 hrs') {
      newDesc += `\n\n---estimate---\n${estVal}`;
    }

    try {
      const res = await taskService.updateTask(displayTask._id, { description: newDesc });
      setFullTask(res.data.task);
      onUpdated?.();
      loadActivities();
    } catch {
      toast.error('Failed to update checklist');
    }
  };

  const addCheckItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const currentItems = getChecklistItems();
    const newItems = [...currentItems, { id: Date.now().toString(), text: newCheckItem.trim(), completed: false }];
    handleUpdateChecklist(newItems);
    setNewCheckItem('');
  };

  const toggleCheckItem = (itemId) => {
    const currentItems = getChecklistItems();
    const newItems = currentItems.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    handleUpdateChecklist(newItems);
  };

  const deleteCheckItem = (itemId) => {
    const currentItems = getChecklistItems();
    const newItems = currentItems.filter(item => item.id !== itemId);
    handleUpdateChecklist(newItems);
  };

  const handleEstimateChange = async (newEstimate) => {
    const currentChecklist = getChecklistItems();
    const cleanDesc = getCleanDescription(displayTask?.description || '');
    
    let newDesc = cleanDesc;
    if (currentChecklist.length > 0) {
      newDesc += `\n\n---checklist---\n${JSON.stringify(currentChecklist)}`;
    }
    newDesc += `\n\n---estimate---\n${newEstimate}`;
    
    await handleUpdateField({ description: newDesc });
  };

  // Field Updates
  const handleUpdateField = async (fields) => {
    try {
      const res = await taskService.updateTask(displayTask._id, fields);
      setFullTask(res.data.task);
      toast.success('Task updated');
      onUpdated?.();
      loadActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await taskService.updateTaskStatus(displayTask._id, newStatus);
      setFullTask(res.data.task);
      toast.success(`Moved to ${newStatus}`);
      onUpdated?.();
      loadActivities();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleTitleSubmit = () => {
    if (!editedTitle.trim() || editedTitle === displayTask.title) {
      setIsEditingTitle(false);
      return;
    }
    handleUpdateField({ title: editedTitle.trim() });
    setIsEditingTitle(false);
  };

  const handleDescSubmit = () => {
    const currentChecklist = getChecklistItems();
    const estVal = parseEstimate(displayTask?.description);
    
    let newDesc = editedDesc.trim();
    if (currentChecklist.length > 0) {
      newDesc += `\n\n---checklist---\n${JSON.stringify(currentChecklist)}`;
    }
    if (estVal && estVal !== '8 hrs') {
      newDesc += `\n\n---estimate---\n${estVal}`;
    }
    
    handleUpdateField({ description: newDesc });
    setIsEditingDesc(false);
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      await taskService.deleteTask(displayTask._id);
      toast.success('Task deleted successfully');
      onClose();
      onUpdated?.();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Upload attachment
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await uploadService.upload(formData);
      await taskService.addAttachment(displayTask._id, {
        url: uploadRes.data.url,
        publicId: uploadRes.data.publicId,
        fileName: file.name
      });
      toast.success('File attached');
      loadFullTask();
      loadActivities();
      onUpdated?.();
    } catch {
      toast.error('Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  // AI detailed analysis report fetcher
  const handleFetchAIReport = async () => {
    if (!workspaceId) return;
    setAiLoading(true);
    try {
      const cleanDescription = getCleanDescription(displayTask.description || '');
      const question = `Perform a detailed analysis of this task. Title: "${displayTask.title}". Description: "${cleanDescription || 'No description provided'}". Status: "${displayTask.status}". Priority: "${displayTask.priority}". Respond STRICTLY with a JSON object, without any markdown layout or code-block formatting (do not wrap it in \`\`\`json). The JSON must have exactly these keys: "summary" (a detailed 2-sentence summary), "risks" (an array of 2 potential challenges or technical risks), "suggestions" (an array of 2 engineering suggestions), "nextAction" (single next recommended action step), and "estimatedCompletion" (rough time estimate like "2-4 hours" or "3 days").`;
      
      const res = await aiService.chat(workspaceId, question);
      const rawText = res.data.answer || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAiReport(parsed);
      toast.success('AI Analysis Completed!');
    } catch (err) {
      console.error(err);
      // Fallback preview report
      setAiReport({
        summary: `Analyze task requirements for "${displayTask.title}" and implement technical solutions inside the codebase.`,
        risks: [
          "Potential dependency conflicts with recent build packages.",
          "Possible data validation edge cases in the database layer."
        ],
        suggestions: [
          "Implement robust unit tests to verify status state machines.",
          "Create mock data suites for local testing of this feature."
        ],
        nextAction: "Decompose requirements into checklist items and update tests.",
        estimatedCompletion: "6 - 8 hours"
      });
      toast.error('Failed to get real AI analysis. Showing preview report.');
    } finally {
      setAiLoading(false);
    }
  };

  // Autocomplete mentions in comments
  const handleCommentChange = (e) => {
    const val = e.target.value;
    setNewComment(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ')) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      if (query.includes(' ')) {
        setShowMentionList(false);
      } else {
        setShowMentionList(true);
        setMentionSearch(query);
      }
    } else {
      setShowMentionList(false);
    }
  };

  const handleSelectMention = (member) => {
    const cursor = commentRef.current?.selectionStart || newComment.length;
    const val = newComment;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1) {
      const before = val.slice(0, lastAtIdx);
      const after = val.slice(cursor);
      const mentionText = `@${member.fullName || member.username} `;
      setNewComment(before + mentionText + after);
      setShowMentionList(false);
      setTimeout(() => commentRef.current?.focus(), 50);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await commentService.add(displayTask._id, newComment.trim());
      setNewComment('');
      loadActivities();
    } catch { 
      toast.error('Failed to post comment'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const deleteComment = async (id) => {
    try {
      await commentService.deleteComment(id);
      loadActivities();
    } catch { 
      toast.error('Failed to delete comment'); 
    }
  };

  const parseCommentText = (text) => {
    if (!text) return '';
    const parts = text.split(/(@[^\s@]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded-md text-[11px] inline-block select-all hover:bg-indigo-500/20 transition-all">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!displayTask || !open) return null;

  const priority = getPriorityConfig(displayTask.priority);
  const checklist = getChecklistItems();
  const completedChecklist = checklist.filter(c => c.completed).length;
  const projectName = displayTask?.project?.name || 'DevFlow AI';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Centered Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-xl shadow-2xl shadow-black/80 flex flex-col text-zinc-200 overflow-hidden",
              "w-full h-full max-h-[100vh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[24px] p-6 sm:p-8",
              "w-[90vw] md:w-[75vw] max-w-[1100px]"
            )}
          >
            {/* ================= HEADER ================= */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800/60 flex-shrink-0">
              {/* Left Side: Icon, Project, ID, Title, Badges */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner">
                  <ListTodo className="text-indigo-400 animate-pulse" size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <span>{projectName}</span>
                    <span>/</span>
                    <span className="font-mono text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded-md">
                      #{displayTask._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  {isEditingTitle && isAdmin ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-base font-bold h-9 bg-zinc-900/50 border border-zinc-850 rounded-xl px-3"
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                        autoFocus
                      />
                      <button onClick={handleTitleSubmit} className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer">
                        <Check size={15} />
                      </button>
                      <button onClick={() => { setIsEditingTitle(false); setEditedTitle(displayTask.title); }} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1 group">
                      <h2 className="text-lg font-black text-white leading-tight truncate">
                        {displayTask.title}
                      </h2>
                      {isAdmin && (
                        <button 
                          onClick={() => setIsEditingTitle(true)} 
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-300 transition-opacity cursor-pointer"
                          title="Edit Task Title"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn(priority.bg, priority.color, priority.border, 'border font-semibold text-[9px] px-2 py-0.5 rounded-full')}>
                      {displayTask.priority}
                    </Badge>
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-semibold text-[9px] px-2 py-0.5 rounded-full">
                      {displayTask.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right Side: Edit, Delete, Close buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsEditingDesc(!isEditingDesc);
                    setIsEditingTitle(!isEditingTitle);
                  }}
                  className="h-8 w-8 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Toggle Edit Mode"
                >
                  <Edit2 size={13} />
                </button>
                
                {isAdmin && (
                  <button
                    onClick={handleDeleteTask}
                    className="h-8 w-8 rounded-lg bg-zinc-900/60 hover:bg-red-950/40 border border-zinc-800/80 hover:border-red-500/30 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Close Modal (ESC)"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ================= TOP STATS ROW ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 flex-shrink-0">
              {/* Status Card */}
              <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-3.5 flex flex-col gap-1 transition-all hover:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                  <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", 
                    displayTask.status === 'Completed' ? 'bg-emerald-500' :
                    displayTask.status === 'In Progress' ? 'bg-amber-500' :
                    displayTask.status === 'Review' ? 'bg-indigo-500' : 'bg-zinc-500'
                  )} />
                  Status
                </div>
                <select
                  value={displayTask.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent text-xs font-black text-white outline-none cursor-pointer w-full mt-1 border-none p-0 focus:ring-0 appearance-none hover:text-indigo-400 transition-colors"
                >
                  {['Todo', 'In Progress', 'Review', 'Completed'].map(s => (
                    <option key={s} value={s} className="bg-zinc-950 text-zinc-300">{s}</option>
                  ))}
                </select>
              </div>

              {/* Priority Card */}
              <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-3.5 flex flex-col gap-1 transition-all hover:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                  <Flag size={10} className={cn(priority.color)} />
                  Priority
                </div>
                {isAdmin ? (
                  <select
                    value={displayTask.priority}
                    onChange={(e) => handleUpdateField({ priority: e.target.value })}
                    className={cn("bg-transparent text-xs font-black outline-none cursor-pointer w-full mt-1 border-none p-0 focus:ring-0 appearance-none", priority.color)}
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <option key={p} value={p} className="bg-zinc-950 text-zinc-300">{p}</option>
                    ))}
                  </select>
                ) : (
                  <span className={cn("text-xs font-black mt-1", priority.color)}>{displayTask.priority}</span>
                )}
              </div>

              {/* Assignee Card */}
              <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-3.5 flex flex-col gap-1 transition-all hover:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                  <User size={10} className="text-zinc-550" />
                  Assignee
                </div>
                {isAdmin ? (
                  <select
                    value={displayTask.assignedTo?._id || ''}
                    onChange={(e) => handleUpdateField({ assignedTo: e.target.value || null })}
                    className="bg-transparent text-xs font-black text-white outline-none cursor-pointer w-full mt-1 border-none p-0 focus:ring-0 appearance-none truncate"
                  >
                    <option value="" className="bg-zinc-950 text-zinc-400">Unassigned</option>
                    {workspaceMembers.map(m => (
                      <option key={m._id} value={m._id} className="bg-zinc-950 text-zinc-300">{m.fullName}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    {displayTask.assignedTo ? (
                      <>
                        <Avatar user={displayTask.assignedTo} size="xs" />
                        <span className="font-bold text-white text-xs truncate">{displayTask.assignedTo.fullName}</span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date Card */}
              <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-3.5 flex flex-col gap-1 transition-all hover:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                  <CalIcon size={10} className="text-zinc-550" />
                  Due Date
                </div>
                {isAdmin ? (
                  <input
                    type="date"
                    value={displayTask.dueDate ? new Date(displayTask.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                    className="bg-transparent text-xs font-black text-white outline-none cursor-pointer w-full mt-1 border-none p-0 focus:ring-0 [color-scheme:dark]"
                  />
                ) : (
                  <span className="text-xs font-black text-white mt-1">
                    {displayTask.dueDate ? formatDate(displayTask.dueDate, 'MMM d, yyyy') : 'No deadline'}
                  </span>
                )}
              </div>

              {/* Estimated Time Card */}
              <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-3.5 flex flex-col gap-1 transition-all hover:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                  <Clock size={10} className="text-zinc-550" />
                  Estimate
                </div>
                <select
                  value={parseEstimate(displayTask.description)}
                  onChange={(e) => handleEstimateChange(e.target.value)}
                  className="bg-transparent text-xs font-black text-white outline-none cursor-pointer w-full mt-1 border-none p-0 focus:ring-0 appearance-none hover:text-indigo-400 transition-colors"
                >
                  {['1 hr', '2 hrs', '4 hrs', '8 hrs', '2 days', '3 days', '5 days', '10 days'].map(est => (
                    <option key={est} value={est} className="bg-zinc-950 text-zinc-300">{est}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ================= SCROLLABLE BODY ================= */}
            <div className="flex-1 overflow-y-auto mt-6 pr-1 scrollbar-thin space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* LEFT COLUMN (70%) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Overview & Description */}
                  <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ActIcon size={16} className="text-indigo-400" />
                        <h3 className="text-sm font-bold text-white tracking-tight">Overview</h3>
                      </div>
                      {isAdmin && !isEditingDesc && (
                        <button 
                          onClick={() => setIsEditingDesc(true)} 
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold hover:bg-indigo-500/10 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit2 size={11} /> Edit Description
                        </button>
                      )}
                    </div>

                    <div className="prose prose-invert max-w-none">
                      {isEditingDesc ? (
                        <div className="space-y-3">
                          <Textarea
                            rows={5}
                            value={editedDesc}
                            onChange={(e) => setEditedDesc(e.target.value)}
                            placeholder="Detail the target outcomes, criteria, or notes..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl p-4 text-sm text-zinc-200 outline-none placeholder-zinc-650 transition-all focus:ring-0 resize-none min-h-[120px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="xs" variant="ghost" onClick={() => { setIsEditingDesc(false); setEditedDesc(getCleanDescription(displayTask.description || '')); }} className="rounded-xl">
                              Cancel
                            </Button>
                            <Button size="xs" variant="primary" onClick={handleDescSubmit} className="rounded-xl px-4">
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-zinc-300">
                          {getCleanDescription(displayTask.description) ? (
                            <MarkdownRenderer content={getCleanDescription(displayTask.description)} />
                          ) : (
                            <p className="text-sm text-zinc-550 italic leading-relaxed">No description provided for this task. Click Edit to document the context or parameters.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-indigo-400" />
                        <h3 className="text-sm font-bold text-white tracking-tight">Checklist</h3>
                      </div>
                      {checklist.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-xl">
                          {Math.round((completedChecklist / checklist.length) * 100)}% Done
                        </span>
                      )}
                    </div>

                    {/* Progress Visual */}
                    {checklist.length > 0 && (
                      <div className="h-1.5 bg-zinc-850 rounded-full overflow-hidden mb-5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedChecklist / checklist.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {checklist.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-850/60 hover:border-zinc-800/80 rounded-2xl group transition-all"
                        >
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleCheckItem(item.id)}
                            className="flex items-center gap-3 text-left min-w-0"
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all",
                              item.completed ? "bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/25" : "border-zinc-700 hover:border-zinc-500 bg-zinc-950"
                            )}>
                              {item.completed && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -20 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                  <Check size={12} strokeWidth={3.5} />
                                </motion.div>
                              )}
                            </div>
                            <span className={cn(
                              "text-xs leading-relaxed truncate font-medium",
                              item.completed ? "text-zinc-550 line-through" : "text-zinc-200"
                            )}>
                              {item.text}
                            </span>
                          </motion.button>
                          
                          <button
                            onClick={() => deleteCheckItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-opacity cursor-pointer"
                            title="Delete checkpoint"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}

                      {checklist.length === 0 && (
                        <div className="text-center py-6 border border-zinc-800/50 border-dashed rounded-2xl flex flex-col items-center">
                          <ListTodo size={20} className="text-zinc-650 mb-1" />
                          <p className="text-xs text-zinc-550">No checkpoints defined.</p>
                        </div>
                      )}
                    </div>

                    <form onSubmit={addCheckItem} className="flex gap-2 mt-4 pt-2">
                      <Input
                        placeholder="Add a new checklist task..."
                        value={newCheckItem}
                        onChange={(e) => setNewCheckItem(e.target.value)}
                        className="flex-1 h-9 text-xs rounded-xl"
                      />
                      <Button type="submit" size="xs" variant="primary" className="h-9 rounded-xl px-4">
                        <Plus size={12} className="mr-0.5" /> Add
                      </Button>
                    </form>
                  </div>

                  {/* AI Suggestions / Accelerator Panel */}
                  <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400 animate-pulse" />
                        <h3 className="text-sm font-bold text-white tracking-tight">AI Task Accelerator</h3>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={handleFetchAIReport}
                        loading={aiLoading}
                        className="text-xs border border-zinc-800 hover:bg-zinc-900 font-bold rounded-xl px-3 py-1.5 transition-all"
                      >
                        <Wand2 size={12} className="mr-1 text-purple-400" />
                        Generate AI Analysis
                      </Button>
                    </div>

                    {aiLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-zinc-400 animate-pulse font-medium">DevFlow AI is parsing complexity metrics...</p>
                      </div>
                    ) : aiReport ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 text-xs"
                      >
                        {/* Summary */}
                        <div className="bg-purple-500/[0.02] border border-purple-500/10 rounded-2xl p-4">
                          <h4 className="font-bold text-purple-300 uppercase tracking-wider text-[9px] mb-1.5">AI Summary</h4>
                          <p className="text-zinc-300 leading-relaxed font-sans">{aiReport.summary}</p>
                        </div>

                        {/* Risks & Suggestions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-950/30 border border-zinc-850 rounded-2xl p-4">
                            <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[9px] mb-2 flex items-center gap-1.5">
                              <AlertCircle size={10} /> Potential Risks
                            </h4>
                            <ul className="space-y-1.5 text-zinc-300 pl-1 list-disc list-inside">
                              {aiReport.risks?.map((risk, i) => (
                                <li key={i} className="leading-relaxed">{risk}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-zinc-950/30 border border-zinc-850 rounded-2xl p-4">
                            <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[9px] mb-2 flex items-center gap-1.5">
                              <Wand2 size={10} /> Implementation Suggestions
                            </h4>
                            <ul className="space-y-1.5 text-zinc-300 pl-1 list-disc list-inside">
                              {aiReport.suggestions?.map((sug, i) => (
                                <li key={i} className="leading-relaxed">{sug}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Next Action & Completion Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-950/30 border border-zinc-850 rounded-2xl p-4">
                            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[9px] mb-1.5">Next Recommended Action</h4>
                            <p className="text-zinc-200 leading-relaxed font-bold">{aiReport.nextAction}</p>
                          </div>

                          <div className="bg-zinc-950/30 border border-zinc-850 rounded-2xl p-4 flex flex-col justify-center">
                            <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[9px] mb-1">Estimated Completion Duration</h4>
                            <p className="text-sm font-black text-white flex items-center gap-1.5">
                              <Clock size={13} className="text-emerald-400" />
                              {aiReport.estimatedCompletion}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-6 border border-zinc-800/50 border-dashed rounded-2xl flex flex-col items-center">
                        <Sparkles size={20} className="text-zinc-650 mb-1" />
                        <p className="text-xs text-zinc-550">Analyze task with AI to diagnose risks and get completion recommendations.</p>
                      </div>
                    )}
                  </div>

                  {/* Comments (Chat Style) */}
                  <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare size={16} className="text-indigo-400" />
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Comments ({comments.length})
                      </h3>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                          <MessageSquare size={20} className="text-zinc-655 mb-1" />
                          <p className="text-xs text-zinc-550 font-medium">No comments posted. Kick off the conversation!</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <motion.div
                            key={comment._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                          >
                            <Avatar user={comment.user} size="sm" className="ring-1 ring-zinc-800 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-zinc-200">{comment.user?.fullName}</span>
                                <span className="text-[9px] text-zinc-550 font-medium">{formatRelativeTime(comment.createdAt)}</span>
                                {comment.user?._id === user?.id && (
                                  <button
                                    onClick={() => deleteComment(comment._id)}
                                    className="ml-auto text-zinc-550 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                                    title="Delete Comment"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                              <div className="bg-zinc-900 border border-zinc-850 rounded-2xl px-4 py-2.5 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {parseCommentText(comment.message)}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Comment box */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/40 flex-shrink-0 relative">
                      {/* Autocomplete mention drop */}
                      {showMentionList && workspaceMembers.length > 0 && (
                        <div className="absolute bottom-full left-10 mb-2 w-52 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                          <div className="p-1.5">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 border-b border-zinc-900">
                              Mention User
                            </p>
                            {workspaceMembers
                              .filter(m => m.fullName?.toLowerCase().includes(mentionSearch.toLowerCase()) || m.username?.toLowerCase().includes(mentionSearch.toLowerCase()))
                              .map(member => (
                                <button
                                  key={member._id}
                                  type="button"
                                  onClick={() => handleSelectMention(member)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                                >
                                  <Avatar user={member} size="xs" />
                                  <span className="truncate">{member.fullName}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Emoji shortcuts */}
                      <div className="flex gap-1.5 mb-2 pl-10">
                        {['👍', '❤️', '🔥', '😄', '🎉', '🚀', '💡', '👀'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewComment(prev => prev + emoji)}
                            className="hover:scale-125 transition-transform duration-200 text-sm cursor-pointer p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 items-end">
                        <Avatar user={user} size="sm" className="ring-1 ring-zinc-800 mb-1" />
                        <div className="flex-1 flex items-end gap-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl px-3.5 py-2 focus-within:border-indigo-500/40 transition-colors">
                          <textarea
                            ref={commentRef}
                            value={newComment}
                            onChange={handleCommentChange}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                            placeholder="Add a reply, ask a question... Use @ to mention"
                            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-550 outline-none resize-none min-h-[30px] max-h-[100px] leading-relaxed scrollbar-none"
                            rows={1}
                          />
                          <button
                            onClick={submitComment}
                            disabled={!newComment.trim() || submitting}
                            className="h-6.5 w-6.5 rounded-lg bg-indigo-500 flex items-center justify-center hover:bg-indigo-400 disabled:opacity-40 transition-colors flex-shrink-0 cursor-pointer"
                          >
                            <Check size={11} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ActIcon size={16} className="text-indigo-400" />
                      <h3 className="text-sm font-bold text-white tracking-tight">Activity Timeline</h3>
                    </div>

                    <div className="space-y-4 pl-1 max-h-[250px] overflow-y-auto pr-1">
                      {activities.length === 0 ? (
                        <div className="text-center py-6 border border-zinc-800/50 border-dashed rounded-2xl flex flex-col items-center">
                          <ActIcon size={20} className="text-zinc-650 mb-1" />
                          <p className="text-xs text-zinc-550">No activity logs recorded yet.</p>
                        </div>
                      ) : (
                        activities.map((act, i) => {
                          const config = getActivityIcon(act.action, act.description);
                          return (
                            <div key={act._id || i} className="flex items-start gap-3 relative">
                              {i !== activities.length - 1 && (
                                <span className="absolute top-6 bottom-0 left-[11px] w-px bg-zinc-850" />
                              )}
                              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 border", config.bg)}>
                                {config.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                  <span className="font-bold text-zinc-200">{act.user?.fullName}</span>
                                  {' '}{act.description}
                                </p>
                                <span className="text-[9px] text-zinc-500 mt-0.5 block font-semibold">
                                  {formatRelativeTime(act.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN (30%): Task Info Card & Attachments */}
                <div className="space-y-6">
                  
                  {/* Task Info Card */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <AlertCircle size={15} className="text-indigo-400" />
                      Task Properties
                    </h3>

                    <div className="space-y-3 text-xs">
                      {/* Status */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Status</span>
                        <select
                          value={displayTask.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="bg-transparent text-zinc-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-right hover:text-white transition-colors"
                        >
                          {['Todo', 'In Progress', 'Review', 'Completed'].map(s => (
                            <option key={s} value={s} className="bg-zinc-950 text-zinc-300 text-left">{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Priority</span>
                        {isAdmin ? (
                          <select
                            value={displayTask.priority}
                            onChange={(e) => handleUpdateField({ priority: e.target.value })}
                            className={cn("bg-transparent font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-right hover:text-white transition-colors", priority.color)}
                          >
                            {['Low', 'Medium', 'High', 'Critical'].map(p => (
                              <option key={p} value={p} className="bg-zinc-950 text-zinc-300 text-left">{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={cn("font-bold", priority.color)}>{displayTask.priority}</span>
                        )}
                      </div>

                      {/* Assignee */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Assignee</span>
                        {isAdmin ? (
                          <select
                            value={displayTask.assignedTo?._id || ''}
                            onChange={(e) => handleUpdateField({ assignedTo: e.target.value || null })}
                            className="bg-transparent text-zinc-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-right hover:text-white max-w-[140px] truncate"
                          >
                            <option value="" className="bg-zinc-950 text-zinc-400 text-left">Unassigned</option>
                            {workspaceMembers.map(m => (
                              <option key={m._id} value={m._id} className="bg-zinc-950 text-zinc-300 text-left">{m.fullName}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-zinc-300 font-bold">
                            {displayTask.assignedTo ? displayTask.assignedTo.fullName : 'Unassigned'}
                          </span>
                        )}
                      </div>

                      {/* Reporter */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Reporter</span>
                        <span className="text-zinc-300 font-bold">
                          {displayTask.createdBy ? displayTask.createdBy.fullName : 'System'}
                        </span>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Due Date</span>
                        {isAdmin ? (
                          <input
                            type="date"
                            value={displayTask.dueDate ? new Date(displayTask.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                            className="bg-transparent text-zinc-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-right [color-scheme:dark]"
                          />
                        ) : (
                          <span className="text-zinc-300 font-bold">
                            {displayTask.dueDate ? formatDate(displayTask.dueDate, 'MMM d, yyyy') : 'No deadline'}
                          </span>
                        )}
                      </div>

                      {/* Estimated Time */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Estimated Time</span>
                        <select
                          value={parseEstimate(displayTask.description)}
                          onChange={(e) => handleEstimateChange(e.target.value)}
                          className="bg-transparent text-zinc-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-right hover:text-white transition-colors"
                        >
                          {['1 hr', '2 hrs', '4 hrs', '8 hrs', '2 days', '3 days', '5 days', '10 days'].map(est => (
                            <option key={est} value={est} className="bg-zinc-950 text-zinc-300 text-left">{est}</option>
                          ))}
                        </select>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Created</span>
                        <span className="text-zinc-400 font-semibold">
                          {displayTask.createdAt ? formatDate(displayTask.createdAt, 'MMM d, yyyy h:mm a') : 'N/A'}
                        </span>
                      </div>

                      {/* Updated Date */}
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
                        <span className="text-zinc-500 font-bold">Updated</span>
                        <span className="text-zinc-400 font-semibold">
                          {displayTask.updatedAt ? formatRelativeTime(displayTask.updatedAt) : 'N/A'}
                        </span>
                      </div>

                      {/* Labels */}
                      <div className="flex flex-col gap-2 pt-1">
                        <span className="text-zinc-500 font-bold">Labels</span>
                        {displayTask.labels?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {displayTask.labels.map(l => (
                              <span key={l} className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded-md font-bold">
                                {l}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">No labels</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attachments Card */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Paperclip size={16} className="text-zinc-400" />
                        <h3 className="text-sm font-bold text-white tracking-tight">Attachments</h3>
                      </div>
                      <label className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl transition-all">
                        <Plus size={12} />
                        <span>Upload</span>
                        <input 
                          type="file" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          disabled={isUploading}
                        />
                      </label>
                    </div>

                    {isUploading && (
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 mb-3">
                        <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-zinc-550 font-medium">Uploading attachment...</span>
                      </div>
                    )}

                    {displayTask.attachments?.length === 0 ? (
                      <div className="text-center py-6 border border-zinc-800/50 border-dashed rounded-2xl flex flex-col items-center">
                        <Paperclip size={18} className="text-zinc-650 mb-1" />
                        <p className="text-xs text-zinc-550">No files attached.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {displayTask.attachments?.map((att) => {
                          const isImage = /\.(jpeg|jpg|gif|png|webp|svg)/i.test(att.url);
                          return (
                            <div 
                              key={att.publicId || att._id}
                              className="group relative border border-zinc-800/60 bg-zinc-950/40 rounded-2xl overflow-hidden hover:border-zinc-700/60 transition-all flex flex-col h-28"
                            >
                              {isImage ? (
                                <div className="flex-1 w-full bg-zinc-900 overflow-hidden relative">
                                  <img 
                                    src={att.url} 
                                    alt={att.fileName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              ) : (
                                <div className="flex-1 w-full bg-zinc-900/60 flex items-center justify-center">
                                  <Paperclip size={20} className="text-zinc-550 animate-pulse" />
                                </div>
                              )}
                              
                              <div className="p-2 bg-zinc-900/90 border-t border-zinc-800/60 flex items-center justify-between gap-1">
                                <span className="text-[10px] text-zinc-300 font-bold truncate flex-1">{att.fileName}</span>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={att.url} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                                    title="Download"
                                  >
                                    <Download size={11} />
                                  </a>
                                  <button
                                    onClick={async () => {
                                      if (confirm('Delete attachment?')) {
                                        try {
                                          await taskService.deleteAttachment(displayTask._id, att.publicId);
                                          toast.success('Attachment deleted');
                                          loadFullTask();
                                          loadActivities();
                                        } catch {
                                          toast.error('Failed to delete attachment');
                                        }
                                      }
                                    }}
                                    className="text-zinc-400 hover:text-red-400 p-0.5 cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
