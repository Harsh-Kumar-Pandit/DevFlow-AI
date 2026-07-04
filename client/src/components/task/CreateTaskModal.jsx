import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Calendar, User, Tag, Sparkles, Wand2 } from 'lucide-react';
import { taskService } from '../../services/task.service';
import { aiService } from '../../services/ai.service';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getPriorityConfig } from '../../utils/getPriorityColor';
import toast from 'react-hot-toast';
import { workspaceService } from '../../services/workspace.service';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];

export function CreateTaskModal({ open, onClose, projectId, workspaceId, defaultStatus = 'Todo', onCreated, members = [], taskToEdit = null }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: defaultStatus,
    assignedTo: '',
    dueDate: '',
    labels: [],
  });
  const [labelInput, setLabelInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setForm({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority || 'Medium',
        status: taskToEdit.status || defaultStatus,
        assignedTo: typeof taskToEdit.assignedTo === 'object' ? taskToEdit.assignedTo?._id : taskToEdit.assignedTo || '',
        dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '',
        labels: taskToEdit.labels || [],
      });
    } else {
      setForm({
        title: '',
        description: '',
        priority: 'Medium',
        status: defaultStatus,
        assignedTo: '',
        dueDate: '',
        labels: [],
      });
    }
  }, [taskToEdit, defaultStatus, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      if (taskToEdit) {
        const res = await taskService.updateTask(taskToEdit._id, {
          ...form,
          assignedTo: form.assignedTo || undefined,
          dueDate: form.dueDate || undefined,
        });
        toast.success('Task updated!');
        onCreated?.(res.data.task);
      } else {
        const res = await taskService.create({
          ...form,
          projectId,
          assignedTo: form.assignedTo || undefined,
          dueDate: form.dueDate || undefined,
        });
        toast.success('Task created!');
        onCreated?.(res.data.task);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!form.title) { toast.error('Enter a title first'); return; }
    setAiLoading(true);
    try {
      const res = await aiService.generateDescription(form.title);
      setForm((p) => ({ ...p, description: res.data.description }));
      toast.success('Description generated!');
    } catch { toast.error('AI unavailable'); } finally { setAiLoading(false); }
  };

  const addLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      setForm((p) => ({ ...p, labels: [...p.labels, labelInput.trim()] }));
      setLabelInput('');
    }
  };

  const removeLabel = (label) => setForm((p) => ({ ...p, labels: p.labels.filter((l) => l !== label) }));

  return (
    <Modal open={open} onClose={onClose} title={taskToEdit ? "Edit Task" : "Create Task"} width="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <Input
          label="Title *"
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          required
        />

        {/* Description with AI */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <Button type="button" size="xs" variant="ghost" onClick={generateDescription} loading={aiLoading}>
              <Wand2 size={11} />
              AI Generate
            </Button>
          </div>
          <Textarea
            placeholder="Add more context..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* Priority + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Priority</label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => {
                const config = getPriorityConfig(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      form.priority === p
                        ? `${config.bg} ${config.color} ${config.border} border`
                        : 'bg-zinc-800 text-zinc-550 hover:bg-zinc-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white px-3 outline-none focus:border-indigo-500"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Assignee select */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Assignee</label>
          <select
            value={form.assignedTo}
            onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
            className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white px-3 outline-none focus:border-indigo-500"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.fullName} {member.username ? `(@${member.username})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <Input
          type="date"
          label="Due Date"
          value={form.dueDate}
          onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
          className="[color-scheme:dark]"
        />

        {/* Labels */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Labels</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.labels.map((label) => (
              <button
                type="button"
                key={label}
                onClick={() => removeLabel(label)}
                className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                {label} ×
              </button>
            ))}
          </div>
          <Input
            placeholder="Type label and press Enter"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={addLabel}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>{taskToEdit ? "Save Changes" : "Create Task"}</Button>
        </div>
      </form>
    </Modal>
  );
}
