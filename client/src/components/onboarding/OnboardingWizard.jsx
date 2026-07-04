import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Building, ArrowRight, ArrowLeft, Key, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { workspaceService } from '../../services/workspace.service';
import toast from 'react-hot-toast';

const SUGGESTIONS = {
  Software: ['CodeCrafters', 'DevFlow Devs', 'Acme Engineers', 'Apex Software'],
  Design: ['Pixel Perfect', 'Creative Flow', 'Spark Studio', 'Nova Design'],
  Marketing: ['Growth Lab', 'Vanguard Media', 'Echo Campaigns', 'Synergy Brand'],
  Startup: ['Velocity Launch', 'Bootstrap Co', 'Stealth Mode', 'Unicorn Labs']
};

export function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(''); // 'create' | 'join'
  
  // Forms
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDesc, setWorkspaceDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [industry, setIndustry] = useState('Software');
  
  // States
  const [submitting, setSubmitting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  const handleSuggestionClick = (name) => {
    setWorkspaceName(name);
  };

  const startSimulation = (callback) => {
    setStep(3);
    const messages = [
      { text: 'Provisioning secure database shards...', pct: 25 },
      { text: 'Setting up Socket.IO authentication rooms...', pct: 50 },
      { text: 'Initializing DeepSeek AI Copilot instructions...', pct: 75 },
      { text: 'Configuring session cookies and token variables...', pct: 100 }
    ];

    let current = 0;
    const run = () => {
      if (current < messages.length) {
        setProgressText(messages[current].text);
        setProgressPct(messages[current].pct);
        current++;
        setTimeout(run, 1200);
      } else {
        callback();
      }
    };
    run();
  };

  const handleCreate = async () => {
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    setSubmitting(true);
    try {
      // Simulate Setup Steps for Linear/Notion feel
      startSimulation(async () => {
        try {
          await workspaceService.create({ name: workspaceName, description: workspaceDesc });
          toast.success('Workspace created successfully!');
          await onComplete();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Workspace creation failed');
          setStep(2);
        } finally {
          setSubmitting(false);
        }
      });
    } catch {
      setSubmitting(false);
      setStep(2);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }
    setSubmitting(true);
    try {
      startSimulation(async () => {
        try {
          await workspaceService.join(inviteCode.trim());
          toast.success('Joined workspace successfully!');
          await onComplete();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Invalid invite code or server error');
          setStep(2);
        } finally {
          setSubmitting(false);
        }
      });
    } catch {
      setSubmitting(false);
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(99,102,241,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Progress Header */}
      {step < 3 && (
        <div className="w-full max-w-lg mb-8 flex justify-between items-center text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-indigo-400 animate-pulse" />
            <span className="text-zinc-300">DevFlow Setup Wizard</span>
          </div>
          <span>Step {step} of 2</span>
        </div>
      )}

      {/* Main Container Card */}
      <motion.div
        layout
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                  <Zap size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Setup your space</h2>
                <p className="text-sm text-zinc-400 mt-2">
                  Let's configure your DevFlow environment. Choose how you want to proceed.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => {
                    setMode('create');
                    setStep(2);
                  }}
                  className="flex flex-col items-center text-center p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Building size={16} className="text-indigo-455 text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Create Workspace</h3>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Start a fresh, standalone space for your project roadmap and collaborators.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setMode('join');
                    setStep(2);
                  }}
                  className="flex flex-col items-center text-center p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Key size={16} className="text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Join with Invite</h3>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Paste an invitation key to connect with an active development workspace.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && mode === 'create' && (
            <motion.div
              key="step-2-create"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-white">Let's name your workspace</h3>
                <p className="text-xs text-zinc-400 mt-1">This will be the workspace name shown in your team sidebar.</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Workspace Name"
                  placeholder="e.g. Acme Engineering"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                />
                <Textarea
                  label="Description (Optional)"
                  placeholder="Tell us what this space is for"
                  value={workspaceDesc}
                  onChange={(e) => setWorkspaceDesc(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-3 p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-450 font-semibold">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span>AI Suggestions</span>
                  </div>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="text-[10px] bg-zinc-800 border-zinc-700 rounded-lg text-zinc-300 py-1 px-2 focus:ring-0 focus:border-zinc-700"
                  >
                    <option value="Software">Software</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Startup">Startup</option>
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS[industry].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="px-2.5 py-1 bg-zinc-905 hover:bg-zinc-800 border border-zinc-800 text-[10px] rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <Button onClick={handleCreate} variant="gradient">
                  Launch Workspace
                  <ArrowRight size={13} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && mode === 'join' && (
            <motion.div
              key="step-2-join"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-white">Enter invite code</h3>
                <p className="text-xs text-zinc-400 mt-1">Provide the invite token generated by your administrator.</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Invite Code"
                  placeholder="e.g. WS-XXXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <Button onClick={handleJoin} variant="secondary">
                  Join Team
                  <ArrowRight size={13} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-6 text-center"
            >
              <div className="relative h-16 w-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10 animate-ping" />
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Zap size={24} className="text-white animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Configuring workspace</h3>
                <p className="text-xs text-zinc-400 font-mono h-4">{progressText}</p>
              </div>

              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
