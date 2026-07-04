import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalIcon, Flag, Paperclip, MessageSquare, Activity as ActIcon,
  Sparkles, Wand2, Trash2, Edit2, Check, X, Plus, AlertCircle, CheckSquare, ListTodo
} from 'lucide-react';
import { taskService } from '../../services/task.service';
import { commentService } from '../../services/comment.service';
import { aiService } from '../../services/ai.service';
import { uploadService } from '../../services/upload.service';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { getPriorityConfig } from '../../utils/getPriorityColor';
import { formatRelativeTime, formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import api from '../../services/api';

const TABS = ['Overview', 'Checklist', 'Comments', 'Attachments', 'Activity', 'AI'];

export function TaskDrawer({ task, open, onClose, projectId, workspaceId, onUpdated, members = [] }) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { joinTask, leaveTask, socket } = useSocket() || {};
  const [activeTab, setActiveTab] = useState('Overview');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [fullTask, setFullTask] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Checklist and edit states
  const [newCheckItem, setNewCheckItem] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Check if current user is admin (owner) of the workspace
  const isAdmin = currentWorkspace?.owner?._id === user?.id || currentWorkspace?.owner === user?.id;
  const workspaceMembers = members.length > 0 ? members : (currentWorkspace?.members || []);

  const displayTask = fullTask || task;

  useEffect(() => {
    if (!task?._id || !open) return;
    joinTask?.(task._id);
    loadComments();
    loadFullTask();
    loadActivities();
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
      // Clean description (excluding checklist meta)
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

  // Helper serialization for checklist inside description string
  const getCleanDescription = (desc) => {
    if (!desc) return '';
    return desc.split('\n\n---checklist---\n')[0];
  };

  const parseChecklist = (desc) => {
    if (!desc) return [];
    const parts = desc.split('\n\n---checklist---\n');
    if (parts.length < 2) return [];
    try {
      return JSON.parse(parts[1]);
    } catch {
      return [];
    }
  };

  const getChecklistItems = () => {
    return parseChecklist(displayTask?.description || '');
  };

  const handleUpdateChecklist = async (newItems) => {
    const cleanDesc = getCleanDescription(displayTask?.description || '');
    const newDesc = newItems.length > 0 
      ? `${cleanDesc}\n\n---checklist---\n${JSON.stringify(newItems)}`
      : cleanDesc;

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
    const checklistRaw = (displayTask.description || '').split('\n\n---checklist---\n')[1];
    const newDesc = checklistRaw 
      ? `${editedDesc.trim()}\n\n---checklist---\n${checklistRaw}`
      : editedDesc.trim();
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

  // AI tools
  const handleAISuggestPriority = async () => {
    setAiLoading(true);
    try {
      const cleanText = getCleanDescription(displayTask.description || '');
      const res = await aiService.suggestPriority(displayTask.title, cleanText || 'No description');
      const suggested = res.data.priority;
      const formatted = suggested.charAt(0).toUpperCase() + suggested.slice(1);
      
      if (['Low', 'Medium', 'High', 'Critical'].includes(formatted)) {
        if (confirm(`AI suggests "${formatted}" priority. Apply this?`)) {
          handleUpdateField({ priority: formatted });
        }
      } else {
        toast.error(`AI suggested invalid priority: ${suggested}`);
      }
    } catch {
      toast.error('AI Suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIBreakDown = async () => {
    setAiLoading(true);
    try {
      const res = await aiService.breakTask(`${displayTask.title}: ${getCleanDescription(displayTask.description || '')}`);
      setSubtasks(res.data.subtasks || []);
      toast.success('Subtasks generated by AI');
    } catch {
      toast.error('AI Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const addAITaskToChecklist = (taskText) => {
    const currentItems = getChecklistItems();
    const newItems = [...currentItems, { id: Date.now().toString(), text: taskText, completed: false }];
    handleUpdateChecklist(newItems);
    setSubtasks(prev => prev.filter(t => t !== taskText));
    toast.success('Added to checklist');
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

  const priority = getPriorityConfig(displayTask?.priority);
  const checklist = getChecklistItems();
  const completedChecklist = checklist.filter(c => c.completed).length;

  return (
    <Drawer open={open} onClose={onClose} title={displayTask?.title || 'Task Details'} width="w-[580px]">
      {displayTask && (
        <div className="flex flex-col h-full bg-[#0b0b0f] text-zinc-200">
          
          {/* Header block */}
          <div className="p-6 border-b border-zinc-800/60 flex flex-col gap-4 flex-shrink-0 bg-zinc-950/20">
            {/* Title display/edit */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isEditingTitle && isAdmin ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-sm font-bold h-8"
                      onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    />
                    <button onClick={handleTitleSubmit} className="p-1 text-emerald-400 hover:text-emerald-300">
                      <Check size={16} />
                    </button>
                    <button onClick={() => { setIsEditingTitle(false); setEditedTitle(displayTask.title); }} className="p-1 text-red-400 hover:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-base font-bold text-white leading-snug truncate">
                      {displayTask.title}
                    </h2>
                    {isAdmin && (
                      <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-300 transition-opacity">
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={handleDeleteTask}
                  className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all"
                  title="Delete Task"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Badges / Options line */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Status Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Status:</span>
                <select
                  value={displayTask.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold px-2.5 py-1 text-indigo-400 outline-none focus:border-indigo-500/50"
                >
                  {['Todo', 'In Progress', 'Review', 'Completed'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Priority Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Priority:</span>
                {isAdmin ? (
                  <select
                    value={displayTask.priority}
                    onChange={(e) => handleUpdateField({ priority: e.target.value })}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold px-2.5 py-1 text-zinc-300 outline-none focus:border-indigo-500/50"
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <Badge className={cn(priority.bg, priority.color, priority.border, 'border-zinc-800/80 border font-semibold')} dot>
                    {displayTask.priority}
                  </Badge>
                )}
              </div>

              {/* Assignee select */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Assignee:</span>
                {isAdmin ? (
                  <select
                    value={displayTask.assignedTo?._id || ''}
                    onChange={(e) => handleUpdateField({ assignedTo: e.target.value || null })}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold px-2 py-0.5 text-zinc-300 outline-none max-w-[120px] truncate"
                  >
                    <option value="">Unassigned</option>
                    {workspaceMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.fullName}</option>
                    ))}
                  </select>
                ) : (
                  displayTask.assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar user={displayTask.assignedTo} size="xs" />
                      <span className="font-medium text-zinc-300 text-xs">{displayTask.assignedTo.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 italic text-[11px]">Unassigned</span>
                  )
                )}
              </div>

              {/* Due date input */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Due Date:</span>
                {isAdmin ? (
                  <input
                    type="date"
                    value={displayTask.dueDate ? new Date(displayTask.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold px-2 py-0.5 text-zinc-300 outline-none [color-scheme:dark]"
                  />
                ) : (
                  displayTask.dueDate ? (
                    <span className="text-xs text-zinc-300 flex items-center gap-1 font-medium bg-zinc-900/60 border border-zinc-850 px-2 py-1 rounded-lg">
                      <CalIcon size={11} className="text-indigo-400" />
                      {formatDate(displayTask.dueDate, 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-zinc-500 italic text-[11px]">No deadline</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="px-6 border-b border-zinc-800/60 flex-shrink-0 bg-zinc-950/10">
            <div className="flex gap-1 -mb-px">
              {TABS.map((tab) => {
                let badgeVal = null;
                if (tab === 'Comments') badgeVal = comments.length;
                if (tab === 'Checklist') badgeVal = checklist.length > 0 ? `${completedChecklist}/${checklist.length}` : null;
                if (tab === 'Attachments') badgeVal = displayTask.attachments?.length || null;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-3.5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5',
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
                    )}
                  >
                    {tab}
                    {badgeVal !== null && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                        activeTab === tab ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-550"
                      )}>
                        {badgeVal}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Views */}
          <div className="flex-1 overflow-y-auto min-h-0">
            
            {/* 1. Overview */}
            {activeTab === 'Overview' && (
              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Task Description</h3>
                    {isAdmin && !isEditingDesc && (
                      <button onClick={() => setIsEditingDesc(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                        <Edit2 size={10} /> Edit
                      </button>
                    )}
                  </div>
                  {isEditingDesc ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={4}
                        value={editedDesc}
                        onChange={(e) => setEditedDesc(e.target.value)}
                        placeholder="Detail the target outcomes, criteria, or notes..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="ghost" onClick={() => { setIsEditingDesc(false); setEditedDesc(getCleanDescription(displayTask.description || '')); }}>
                          Cancel
                        </Button>
                        <Button size="xs" variant="primary" onClick={handleDescSubmit}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl whitespace-pre-wrap">
                      {getCleanDescription(displayTask.description) || 'No description provided for this task.'}
                    </p>
                  )}
                </div>

                {displayTask.labels?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Labels</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {displayTask.labels.map((l) => (
                        <span key={l} className="text-xs px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg font-bold border border-indigo-500/10">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Checklist */}
            {activeTab === 'Checklist' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Checklist Items</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Define smaller checkpoints to track task progress.</p>
                  </div>
                  {checklist.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                      {Math.round((completedChecklist / checklist.length) * 100)}% Done
                    </span>
                  )}
                </div>

                {/* Progress Visual */}
                {checklist.length > 0 && (
                  <div className="h-1 bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${(completedChecklist / checklist.length) * 100}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  {checklist.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl group hover:border-zinc-800 transition-all"
                    >
                      <button
                        onClick={() => toggleCheckItem(item.id)}
                        className="flex items-center gap-3 text-left min-w-0"
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                          item.completed ? "bg-emerald-500 border-emerald-600 text-white" : "border-zinc-700 hover:border-zinc-500"
                        )}>
                          {item.completed && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className={cn(
                          "text-xs leading-relaxed truncate font-medium",
                          item.completed ? "text-zinc-550 line-through" : "text-zinc-200"
                        )}>
                          {item.text}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => deleteCheckItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-opacity"
                        title="Delete checkpoint"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}

                  {checklist.length === 0 && (
                    <div className="text-center py-10 border border-zinc-800 border-dashed rounded-2xl flex flex-col items-center">
                      <ListTodo size={24} className="text-zinc-650 mb-2" />
                      <p className="text-xs text-zinc-550">No checkpoints created</p>
                    </div>
                  )}
                </div>

                <form onSubmit={addCheckItem} className="flex gap-2 mt-4 pt-2">
                  <Input
                    placeholder="Add a new checklist task..."
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                  <Button type="submit" size="xs" variant="primary" className="h-8">
                    <Plus size={12} className="mr-0.5" /> Add
                  </Button>
                </form>
              </div>
            )}

            {/* 3. Comments */}
            {activeTab === 'Comments' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-0">
                  {comments.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center">
                      <MessageSquare size={24} className="text-zinc-750 mb-2" />
                      <p className="text-xs text-zinc-550 font-medium">No comments posted. Start the conversation!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <motion.div
                        key={comment._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <Avatar user={comment.user} size="sm" className="ring-1 ring-zinc-800" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-zinc-200">{comment.user?.fullName}</span>
                            <span className="text-[9px] text-zinc-550 font-medium">{formatRelativeTime(comment.createdAt)}</span>
                            {comment.user?._id === user?.id && (
                              <button
                                onClick={() => deleteComment(comment._id)}
                                className="ml-auto text-zinc-655 hover:text-red-400 transition-colors p-0.5"
                                title="Delete Comment"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl px-4 py-2.5 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {comment.message}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Comment box */}
                <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/20 flex-shrink-0">
                  <div className="flex gap-3 items-end">
                    <Avatar user={user} size="sm" className="ring-1 ring-zinc-800" />
                    <div className="flex-1 flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2 focus-within:border-indigo-500/40 transition-colors">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                        placeholder="Add a reply, ask a question..."
                        className="flex-1 bg-transparent text-xs text-white placeholder-zinc-550 outline-none resize-none min-h-[30px] max-h-[100px] leading-relaxed scrollbar-none"
                        rows={1}
                      />
                      <button
                        onClick={submitComment}
                        disabled={!newComment.trim() || submitting}
                        className="h-6 w-6 rounded-lg bg-indigo-500 flex items-center justify-center hover:bg-indigo-400 disabled:opacity-40 transition-colors flex-shrink-0"
                      >
                        <Check size={11} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Attachments */}
            {activeTab === 'Attachments' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Task Attachments</h3>
                  <label className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                    <Paperclip size={11} />
                    <span>Upload Attachment</span>
                    <input 
                      type="file" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {isUploading && (
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-550 font-medium">Uploading to cloud storage...</span>
                  </div>
                )}

                {displayTask.attachments?.length === 0 ? (
                  <div className="text-center py-10 border border-zinc-800 border-dashed rounded-2xl flex flex-col items-center">
                    <Paperclip size={24} className="text-zinc-655 mb-2" />
                    <p className="text-xs text-zinc-550">No files attached to this task</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {displayTask.attachments?.map((att) => (
                      <div 
                        key={att.publicId || att._id}
                        className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl hover:border-zinc-800 transition-colors"
                      >
                        <a 
                          href={att.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 min-w-0 flex-1 hover:text-indigo-300 transition-colors"
                        >
                          <Paperclip size={13} className="text-zinc-500" />
                          <span className="text-xs text-zinc-350 font-medium truncate">{att.fileName}</span>
                        </a>
                        <div className="flex items-center gap-3">
                          <Avatar user={att.uploadedBy} size="xs" />
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
                            className="text-zinc-600 hover:text-red-400 p-1"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Activity */}
            {activeTab === 'Activity' && (
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Activity Timeline</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Audit log of all task edits, comments, and updates.</p>
                </div>

                <div className="space-y-4 mt-4 pl-1">
                  {activities.length === 0 ? (
                    <div className="text-center py-10 border border-zinc-800 border-dashed rounded-2xl flex flex-col items-center">
                      <ActIcon size={24} className="text-zinc-655 mb-2" />
                      <p className="text-xs text-zinc-550">No activities logged yet</p>
                    </div>
                  ) : (
                    activities.map((act, i) => (
                      <div key={act._id || i} className="flex items-start gap-3 relative">
                        {i !== activities.length - 1 && (
                          <span className="absolute top-6 bottom-0 left-[11px] w-px bg-zinc-800/60" />
                        )}
                        <Avatar user={act.user} size="xs" className="ring-1 ring-zinc-800 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                            <span className="font-bold text-zinc-200">{act.user?.fullName}</span>
                            {' '}{act.description}
                          </p>
                          <span className="text-[9px] text-zinc-550 mt-0.5 block font-semibold">
                            {formatRelativeTime(act.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. AI Tools */}
            {activeTab === 'AI' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Task Accelerator</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Optimize priorities and automatically decompose this feature into actionable checkpoints.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAISuggestPriority}
                    loading={aiLoading}
                    className="flex justify-start text-xs border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-800 font-bold"
                  >
                    <Flag size={12} className="mr-1 text-indigo-400" />
                    Suggest Priority
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAIBreakDown}
                    loading={aiLoading}
                    className="flex justify-start text-xs border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-800 font-bold"
                  >
                    <Wand2 size={12} className="mr-1 text-purple-400" />
                    Break into Checklist
                  </Button>
                </div>

                {subtasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 border border-zinc-800/80 p-4 rounded-xl bg-zinc-950/20"
                  >
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-emerald-400" />
                      Decomposed Items
                    </h4>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                      {subtasks.map((taskText, i) => (
                        <div 
                          key={i} 
                          className="flex items-start justify-between gap-3 p-2 bg-zinc-900 border border-zinc-850 rounded-xl"
                        >
                          <p className="text-xs text-zinc-300 leading-relaxed flex-1 mt-0.5">{taskText}</p>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => addAITaskToChecklist(taskText)}
                            className="text-[10px] text-indigo-400 hover:bg-indigo-500/10 font-bold flex-shrink-0"
                          >
                            + Add to checklist
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </Drawer>
  );
}
