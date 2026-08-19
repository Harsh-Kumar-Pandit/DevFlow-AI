import { useState, useEffect } from 'react';
import { projectService } from '../../services/project.service';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export function CreateProjectModal({ open, onClose, workspaceId, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '' });
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !workspaceId) return;
    setSubmitting(true);
    try {
      const res = await projectService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        workspaceId
      });
      toast.success('Project created successfully!');
      onCreated?.(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Name</label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Mobile Redesign, API integration"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe project outcomes, sprint schedules, and key deliverables..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
