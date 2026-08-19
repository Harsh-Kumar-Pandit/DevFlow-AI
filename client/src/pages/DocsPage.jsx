import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Terminal, Copy, Check, ChevronRight, ChevronDown, 
  BookOpen, Sparkles, Layout, Calendar, Lock, Settings, Users, 
  CheckCircle2, AlertTriangle, Info, Clock, ArrowUp, HelpCircle, 
  ExternalLink, CornerDownLeft, Command, Menu, X, ArrowRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Mock database of documentation articles
const DOCS_DATA = {
  // Getting Started
  'intro': {
    title: 'Introduction to DevFlow AI',
    description: 'DevFlow AI is a context-aware developer project management suite designed to eliminate overhead alignment and clear roadmaps automatically.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          DevFlow AI combines lightning-fast Kanban boards, real-time socket-based communication, and an inline generative AI copilot to speed up product lifecycles. By indexing your project context directly, DevFlow AI acts as a smart team collaborator that plans sprints, writes task breakdowns, and automatically files roadmap updates.
        </p>

        {/* Info callout */}
        <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/[0.02] flex gap-3 text-zinc-300">
          <Info className="text-indigo-400 shrink-0 mt-0.5" size={18} />
          <div>
            <strong className="text-white block mb-0.5">Quick Start</strong>
            New to DevFlow AI? Jump straight to our <a href="#installation" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300">Installation Guide</a> to spin up your local server in under 5 minutes.
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-400" />
          Core Pillars of DevFlow AI
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="font-semibold text-white mb-1">Context-Aware AI Copilot</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">A specialized LLM agent connected to your project schema to auto-populate descriptions and prioritize backlogs.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="font-semibold text-white mb-1">Real-Time Synchronization</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Socket.io pipeline linking task updates instantly across all active developer workspaces.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="font-semibold text-white mb-1">Linear-Speed Kanban</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Highly responsive board interactions built using React-Aria and optimized windowed grids.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <h3 className="font-semibold text-white mb-1">Interactive Sprint Planning</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">Generate realistic developer estimations and distribute issues intelligently within active milestone periods.</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Design Ideology</h2>
        <p className="text-zinc-300 leading-relaxed">
          Inspired by Linear and Vercel, DevFlow AI is built with keyboard-first navigation and layout speeds in mind. We believe that developer tools shouldn't look boring. Our aesthetic emphasizes high-contrast matte surfaces, subtle stage-lighting radial vignettes, and frictionless micro-animations that make project management feel rewarding rather than tedious.
        </p>
      </div>
    ),
    toc: [
      { id: 'core-pillars-of-devflow-ai', text: 'Core Pillars' },
      { id: 'design-ideology', text: 'Design Ideology' }
    ]
  },
  'installation': {
    title: 'Installation & Setup',
    description: 'Learn how to set up the DevFlow AI web application and server on your local development machine.',
    readingTime: '5 min read',
    lastUpdated: 'Updated 1 day ago',
    content: (setActiveTab, activeTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          DevFlow AI runs on a monorepo setup containing a React + Vite frontend client and an Express + Node.js backend server. Follow this step-by-step guide to run the stack.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Prerequisites</h2>
        <p className="text-zinc-300">Ensure you have the following installed on your workspace machine:</p>
        <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
          <li>Node.js (v18.0.0 or higher)</li>
          <li>npm or yarn</li>
          <li>MongoDB (instance running locally or a URI string from MongoDB Atlas)</li>
        </ul>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Getting the Codebase</h2>
        <p className="text-zinc-300">Clone the repository and install the initial dependencies from the project root:</p>
        
        {/* Tabbed Code Snippet */}
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden my-4">
          <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('npm')}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${activeTab === 'npm' ? 'bg-white/[0.06] text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                npm
              </button>
              <button 
                onClick={() => setActiveTab('yarn')}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${activeTab === 'yarn' ? 'bg-white/[0.06] text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                yarn
              </button>
            </div>
            <CopyButton text={activeTab === 'npm' ? 'npm install\nnpm run bootstrap' : 'yarn install\nyarn bootstrap'} />
          </div>
          <div className="p-4 font-mono text-sm text-zinc-300 overflow-x-auto leading-relaxed">
            {activeTab === 'npm' ? (
              <div>
                <span className="text-zinc-500"># Install root dependencies</span><br />
                <span className="text-indigo-400">npm</span> install<br /><br />
                <span className="text-zinc-500"># Bootstrap packages & setup workspace</span><br />
                <span className="text-indigo-400">npm</span> run bootstrap
              </div>
            ) : (
              <div>
                <span className="text-zinc-500"># Install root dependencies</span><br />
                <span className="text-indigo-400">yarn</span> install<br /><br />
                <span className="text-zinc-500"># Bootstrap packages & setup workspace</span><br />
                <span className="text-indigo-400">yarn</span> bootstrap
              </div>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Environment Setup</h2>
        <p className="text-zinc-300">Create a <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-indigo-300 font-mono text-sm">.env</code> file inside the root server directory:</p>
        
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden my-4">
          <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">server/.env</span>
            <CopyButton text={`PORT=5000\nMONGODB_URI=mongodb://localhost:27017/devflow\nJWT_SECRET=your_jwt_secret\nJWT_EXPIRES_IN=7d\nOPENAI_API_KEY=your_openai_api_key`} />
          </div>
          <pre className="p-4 font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed">
{`PORT=5000
MONGODB_URI=mongodb://localhost:27017/devflow
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_api_key`}
          </pre>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Starting the Servers</h2>
        <p className="text-zinc-300">Launch the local client and server instances concurrently using the bootstrap utility:</p>

        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden my-4">
          <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">Terminal</span>
            <CopyButton text="npm run dev" />
          </div>
          <div className="p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
            <span className="text-indigo-400">npm</span> run dev
          </div>
        </div>

        {/* Warning callout */}
        <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] flex gap-3 text-zinc-300">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div>
            <strong className="text-white block mb-0.5">API Keys</strong>
            If <code className="text-amber-300 font-mono">OPENAI_API_KEY</code> is not provided, the local server will run, but interactive AI suggestions, automations, and copilot prompts will fail gracefully.
          </div>
        </div>
      </div>
    ),
    toc: [
      { id: 'prerequisites', text: 'Prerequisites' },
      { id: 'getting-the-codebase', text: 'Getting Codebase' },
      { id: 'environment-setup', text: 'Environment Setup' },
      { id: 'starting-the-servers', text: 'Starting Servers' }
    ]
  },
  'auth': {
    title: 'Authentication Strategy',
    description: 'Deep dive into DevFlow AI session control, HTTP-Only Cookie configurations, and workspace safety policies.',
    readingTime: '4 min read',
    lastUpdated: 'Updated 3 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          DevFlow AI utilizes a secure token-based authentication mechanism where JSON Web Tokens (JWT) are stored and managed inside secure, HTTP-only cookies. This keeps user login sessions fully immune to Cross-Site Scripting (XSS) extraction.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Cookie Security Flags</h2>
        <p className="text-zinc-300">
          When a user registers or logs in, the backend issues a cookie containing the payload token with these strict header directives:
        </p>

        <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white">
                <th className="p-3 font-semibold">Directive</th>
                <th className="p-3 font-semibold">Setting</th>
                <th className="p-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-white/[0.04]">
              <tr>
                <td className="p-3 font-mono text-indigo-300">httpOnly</td>
                <td className="p-3 text-emerald-400 font-semibold">true</td>
                <td className="p-3">Prevents Javascript engines (<code className="font-mono text-xs">document.cookie</code>) from reading token payloads.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-indigo-300">secure</td>
                <td className="p-3 text-zinc-300">env conditional</td>
                <td className="p-3">Requires HTTPS connection. Set to <code className="font-mono text-xs">true</code> in production pipelines.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-indigo-300">sameSite</td>
                <td className="p-3 text-indigo-300">Lax / Strict</td>
                <td className="p-3">Protects workspace state transitions from Cross-Site Request Forgery (CSRF) vectors.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Protecting Client Routes</h2>
        <p className="text-zinc-300">
          React application routers secure routes using a dedicated wrapper component that reads auth profiles from the global context provider:
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden my-4">
          <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">React ProtectedRoute component</span>
            <CopyButton text={`function ProtectedRoute({ children }) {\n  const { user, loading } = useAuth();\n  if (loading) return <Loader />;\n  if (!user) return <Navigate to="/login" replace />;\n  return children;\n}`} />
          </div>
          <pre className="p-4 font-mono text-xs text-indigo-300/80 overflow-x-auto leading-relaxed">
{`function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}`}
          </pre>
        </div>
      </div>
    ),
    toc: [
      { id: 'cookie-security-flags', text: 'Security Flags' },
      { id: 'protecting-client-routes', text: 'Protecting Routes' }
    ]
  },
  'create-workspace': {
    title: 'Creating your first Workspace',
    description: 'Set up your developer space, claim your custom subdomain routing, and map workspaces to external repos.',
    readingTime: '4 min read',
    lastUpdated: 'Updated 3 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          A workspace acts as the master directory for all projects, tasks, socket rooms, and documentation in DevFlow AI. Organizations can partition workspaces to segment different product segments.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Step-by-Step Creation</h2>
        
        {/* Step Guide */}
        <div className="space-y-4 my-6">
          <div className="flex gap-4">
            <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-400">1</div>
            <div>
              <h4 className="font-semibold text-white">Navigate to App Setup</h4>
              <p className="text-sm text-zinc-400 mt-0.5">Click the "Open Workspace" CTA from the landing page. If you are a new user, you will be automatically routed to the onboard setup screen.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-400">2</div>
            <div>
              <h4 className="font-semibold text-white">Choose Workspace Name & Slug</h4>
              <p className="text-sm text-zinc-400 mt-0.5">Enter a name (e.g. Acme engineering). The onboarding system will automatically compile a clean, unique URL slug for browser index references.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-400">3</div>
            <div>
              <h4 className="font-semibold text-white">Select AI Preference</h4>
              <p className="text-sm text-zinc-400 mt-0.5">Specify whether the AI assistant should auto-suggest descriptions, index issue tags, or generate sprint schedules in the background.</p>
            </div>
          </div>
        </div>

        {/* Tip callout */}
        <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] flex gap-3 text-zinc-300">
          <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
          <div>
            <strong className="text-white block mb-0.5">Best Practice</strong>
            Keep slugs short and memorable. Slugs like <code className="text-emerald-300 font-mono">acme-eng</code> are much cleaner for command line utility flags than <code className="text-emerald-300 font-mono">acme-engineering-internal-development</code>.
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Workspace Settings & Limits</h2>
        <p className="text-zinc-300">Free tier workspaces support up to 10 active developers and 500 open items. Organizations requiring custom data policies or higher rates can upgrade from the workspace dashboard.</p>
      </div>
    ),
    toc: [
      { id: 'step-by-step-creation', text: 'Step Guide' },
      { id: 'workspace-settings--limits', text: 'Settings & Limits' }
    ]
  },
  'ai-copilot': {
    title: 'Context-Aware AI Copilot',
    description: 'Unlock maximum developer productivity using inline smart agents that write task scripts and prioritize schedules.',
    readingTime: '5 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          The AI Copilot in DevFlow AI is directly integrated with your active Kanban board, team milestones, and task history. Instead of typing lengthy descriptions, users can trigger AI completions inline using hotkeys.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">How it works</h2>
        <p className="text-zinc-300">
          The engine builds context queries by analyzing:
        </p>
        <ol className="list-decimal list-inside text-zinc-400 space-y-2 ml-2">
          <li>Active columns and task list tags</li>
          <li>Recently completed milestones and commit messages</li>
          <li>Active workspace members and role domains</li>
        </ol>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">AI Commands Reference</h2>
        <p className="text-zinc-300">Use these commands in your task description boxes to activate specific actions:</p>

        <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white">
                <th className="p-3 font-semibold">Command</th>
                <th className="p-3 font-semibold">Action Trigger</th>
                <th className="p-3 font-semibold">Target Output</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-white/[0.04]">
              <tr>
                <td className="p-3 font-mono text-indigo-300">/spec</td>
                <td className="p-3 text-zinc-300">Write Spec File</td>
                <td className="p-3">Generates complete task specifications and checklist validation items automatically.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-indigo-300">/refine</td>
                <td className="p-3 text-zinc-300">Refine Sprint Issues</td>
                <td className="p-3">Analyzes task blockages, sets tags, and re-allocates workload items to active developers.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-indigo-300">/estimate</td>
                <td className="p-3 text-zinc-300">Sprint Estimations</td>
                <td className="p-3">Compares task details against historical durations to output estimated points (Fibonacci).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
    toc: [
      { id: 'how-it-works', text: 'How it works' },
      { id: 'ai-commands-reference', text: 'AI Commands' }
    ]
  },
  'invite-members': {
    title: 'Inviting Team Members',
    description: 'Learn how to generate invite codes, accept collaborator requests, and manage workspace membership.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          DevFlow AI is built to support fluid, real-time collaboration. Adding team members is done via a secure workspace-specific invite code.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Finding the Invite Code</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Every workspace has a unique invite code. To find it, go to the Workspace overview page and check the <strong className="text-white">Invite Collaborators</strong> panel on the right sidebar. You can copy the code with a single click and send it to your team.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Requesting to Join</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          When a developer joins your team:
        </p>
        <ol className="list-decimal list-inside text-zinc-400 space-y-2 ml-2 font-sans">
          <li>They log in to DevFlow AI.</li>
          <li>If they have no active workspace, they are directed to the Onboarding Setup Wizard.</li>
          <li>They select <strong className="text-white">Join with Invite</strong>, paste the invite code, and click <strong className="text-white">Join Team</strong>.</li>
        </ol>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Approving Join Requests</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          For security, pasting the code sends a membership request to the workspace owner. The owner will see a real-time notification in the <strong className="text-white">Join Requests</strong> card on the workspace page, where they can click the checkmark to accept or cross to decline.
        </p>
      </div>
    ),
    toc: [
      { id: 'finding-the-invite-code', text: 'Finding Invite Code' },
      { id: 'requesting-to-join', text: 'Requesting to Join' },
      { id: 'approving-join-requests', text: 'Approving Requests' }
    ]
  },
  'roles-policies': {
    title: 'Roles & Security Policies',
    description: 'Learn about workspace administration, project visibility rules, and roles structure.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          DevFlow AI structures access control around workspaces, giving distinct administrative authority to owners while keeping tasks interactive for members.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Role Classification</h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white">
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Capabilities</th>
                <th className="p-3 font-semibold">Scope</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-white/[0.04]">
              <tr>
                <td className="p-3 font-semibold text-amber-400">Workspace Owner</td>
                <td className="p-3">Manage settings, accept join requests, delete workspace, manage billing.</td>
                <td className="p-3">Full control over entire workspace structure.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-indigo-400">Workspace Member</td>
                <td className="p-3">Create projects, add tasks, drag board cards, edit descriptions, run AI queries.</td>
                <td className="p-3">Collaborator access to all active workspace boards.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Security Audits</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          All workspace events (member additions, project deletions, backlog refactorings) are logged to the <strong className="text-white">Recent Updates</strong> feed, providing clear audit trails for engineering leads.
        </p>
      </div>
    ),
    toc: [
      { id: 'role-classification', text: 'Role Classification' },
      { id: 'security-audits', text: 'Security Audits' }
    ]
  },
  'create-project': {
    title: 'Managing Projects',
    description: 'Learn how to partition your workspace into active project repositories and sprint roadmaps.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          Projects are isolated containers within a workspace designed to track specific milestones, repositories, or services.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Creating a Project</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Workspace members can create a project by clicking <strong className="text-white">New Project</strong> (or hitting the shortcut <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400">N → P</kbd> globally). You will be prompted to supply a unique project name and a brief description explaining project deliverables.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Project Overview Dashboard</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Once created, projects feature an isolated task queue, a calendar schedule, and custom task filters, allowing developers to focus on relevant code repositories without noise.
        </p>
      </div>
    ),
    toc: [
      { id: 'creating-a-project', text: 'Creating a Project' },
      { id: 'project-overview-dashboard', text: 'Project Overview' }
    ]
  },
  'kanban-board': {
    title: 'Interactive Kanban Board',
    description: 'Structure work visually and move tasks dynamically through customizable status columns.',
    readingTime: '4 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          The Kanban board is the central dashboard for active development tasks, built with performance in mind.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Workflow Columns</h2>
        <p className="text-zinc-350 font-sans leading-relaxed">Tasks flow linearly through five predefined status categories:</p>
        <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2 font-sans">
          <li><strong className="text-white">Backlog</strong>: Ideas, suggestions, or postponed sprint items.</li>
          <li><strong className="text-white">Todo</strong>: Triage items scheduled for the current iteration.</li>
          <li><strong className="text-white">In Progress</strong>: Code currently being authored by assigned developers.</li>
          <li><strong className="text-white">Review</strong>: Pull requests pending review or QA inspection.</li>
          <li><strong className="text-white">Completed</strong>: Released, verified, and closed tasks.</li>
        </ul>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Drag-and-Drop Interaction</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Simply grab a task card and slide it between columns to update status. This updates the database instantly and broadcasts websocket signals to all logged-in teammates, updating their boards in real-time.
        </p>
      </div>
    ),
    toc: [
      { id: 'workflow-columns', text: 'Workflow Columns' },
      { id: 'drag-and-drop-interaction', text: 'Drag & Drop' }
    ]
  },
  'calendar-view': {
    title: 'Sprint Calendar View',
    description: 'Track due dates and plan project milestones in a clean monthly grid layout.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          The Calendar view allows engineering managers and developers to plan sprint boundaries and track incoming task deadlines visually.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Interactive Timeline</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          The Calendar displays task cards arranged on their assigned due dates. Hovering over a card shows its details, assigned developer, and priority. Clicking a task opens the card details drawer immediately.
        </p>
      </div>
    ),
    toc: [
      { id: 'interactive-timeline', text: 'Interactive Timeline' }
    ]
  },
  'tasks-backlog': {
    title: 'Tasks & Backlog Management',
    description: 'Learn how to create detailed issues, set priority tags, and organize backlog cards.',
    readingTime: '4 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          Robust issue tracking keeps your codebase deliverables organized.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Creating Tasks</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Create new tasks using the global shortcut <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400">N → T</kbd> or clicking the "+" buttons on the Kanban board.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Task Attributes</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Every task supports:
        </p>
        <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2 font-sans">
          <li><strong className="text-white">Assignees</strong>: Distribute responsibility to specific team members.</li>
          <li><strong className="text-white">Priority</strong>: Tag issues as Low, Medium, High, or Urgent.</li>
          <li><strong className="text-white">Checklists</strong>: Break down complex tickets into actionable steps.</li>
          <li><strong className="text-white">Comments</strong>: Centralize discussion directly on the task page.</li>
        </ul>
      </div>
    ),
    toc: [
      { id: 'creating-tasks', text: 'Creating Tasks' },
      { id: 'task-attributes', text: 'Task Attributes' }
    ]
  },
  'sprint-planner': {
    title: 'AI Sprint Planner',
    description: 'Auto-allocate issues, predict story points, and optimize velocity with artificial intelligence.',
    readingTime: '4 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          The Sprint Planner leverages AI models (configured via the OpenAI/DeepSeek key) to help teams structure milestones.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Predictive Estimation</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          By comparing new ticket descriptions to previously resolved issues, the AI Sprint Planner forecasts estimated hours and assigns Fibonacci complexity points automatically.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Velocity Balancing</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          The engine analyzes current workloads to ensure no single engineer is overloaded, highlighting bottleneck risks before the sprint kick-off.
        </p>
      </div>
    ),
    toc: [
      { id: 'predictive-estimation', text: 'Predictive Estimation' },
      { id: 'velocity-balancing', text: 'Velocity Balancing' }
    ]
  },
  'endpoints': {
    title: 'REST API Reference',
    description: 'Technical reference of major endpoints for integration and authentication.',
    readingTime: '5 min read',
    lastUpdated: 'Updated 1 day ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          DevFlow AI provides a clean JSON API. All routes require bearer tokens inside request headers or cookies.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Auth Endpoints</h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white">
                <th className="p-3 font-semibold">Method</th>
                <th className="p-3 font-semibold">Route</th>
                <th className="p-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-white/[0.04] font-mono text-xs">
              <tr>
                <td className="p-3 text-emerald-400 font-bold">POST</td>
                <td className="p-3 text-zinc-300">/api/auth/register</td>
                <td className="p-3 text-zinc-400 font-sans">Register new user account.</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400 font-bold">POST</td>
                <td className="p-3 text-zinc-300">/api/auth/login</td>
                <td className="p-3 text-zinc-400 font-sans">Login session and issue secure cookie.</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400 font-bold">POST</td>
                <td className="p-3 text-zinc-300">/api/auth/logout</td>
                <td className="p-3 text-zinc-400 font-sans">Clear session cookies.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Workspace & Task Endpoints</h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white">
                <th className="p-3 font-semibold">Method</th>
                <th className="p-3 font-semibold">Route</th>
                <th className="p-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-white/[0.04] font-mono text-xs">
              <tr>
                <td className="p-3 text-indigo-400 font-bold">GET</td>
                <td className="p-3 text-zinc-300">/api/workspaces</td>
                <td className="p-3 text-zinc-400 font-sans">Get all workspaces the current user belongs to.</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400 font-bold">POST</td>
                <td className="p-3 text-zinc-300">/api/workspaces</td>
                <td className="p-3 text-zinc-400 font-sans">Create a brand new workspace.</td>
              </tr>
              <tr>
                <td className="p-3 text-indigo-400 font-bold">GET</td>
                <td className="p-3 text-zinc-300">/api/projects/workspace/:id</td>
                <td className="p-3 text-zinc-400 font-sans">Get all active projects inside a workspace.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
    toc: [
      { id: 'auth-endpoints', text: 'Auth Endpoints' },
      { id: 'workspace--task-endpoints', text: 'Workspace & Task Endpoints' }
    ]
  },
  'websocket-actions': {
    title: 'Real-time WebSocket Events',
    description: 'Understand the event schemas powering DevFlow live synchronization via socket channels.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          Live sync operates via Socket.IO connection rooms mapped to specific workspaces.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Supported Events</h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white">
                <th className="p-3 font-semibold">Event Name</th>
                <th className="p-3 font-semibold">Payload Content</th>
                <th className="p-3 font-semibold">Trigger Condition</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-white/[0.04] font-mono text-xs">
              <tr>
                <td className="p-3 text-indigo-300">MEMBER_JOINED</td>
                <td className="p-3 text-zinc-450">{`{ userId, workspaceId }`}</td>
                <td className="p-3 text-zinc-400 font-sans">Owner approves join request.</td>
              </tr>
              <tr>
                <td className="p-3 text-indigo-300">TASK_UPDATED</td>
                <td className="p-3 text-zinc-450">{`{ taskId, updates }`}</td>
                <td className="p-3 text-zinc-400 font-sans">Task metadata, description, or checklist item is updated.</td>
              </tr>
              <tr>
                <td className="p-3 text-indigo-300">TASK_MOVED</td>
                <td className="p-3 text-zinc-450">{`{ taskId, fromColumn, toColumn }`}</td>
                <td className="p-3 text-zinc-400 font-sans">Task card dragged between board columns.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
    toc: [
      { id: 'supported-events', text: 'Supported Events' }
    ]
  },
  'deployment-guide': {
    title: 'Production Deployment Guide',
    description: 'Steps to build the client bundles and deploy DevFlow AI to production cloud hosting platforms.',
    readingTime: '4 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          Follow these procedures to prepare and deploy your React frontend and Node server for public distribution.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Building the Client</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          Compile static HTML/JS assets to the dist folder by running the build script:
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden my-4">
          <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">Terminal</span>
            <CopyButton text="npm run build" />
          </div>
          <div className="p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
            <span className="text-indigo-400">npm</span> run build
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Database & Hosting</h2>
        <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2 font-sans">
          <li><strong className="text-white">Database</strong>: Host MongoDB on MongoDB Atlas or provisioning cloud server blocks.</li>
          <li><strong className="text-white">Server Hosting</strong>: Deploy the Node/Express application to services like Railway, Render, or Heroku. Make sure environment variables are fully bound in the dashboard panel.</li>
          <li><strong className="text-white">Static Assets</strong>: Deploy the React <code>dist</code> package to Vercel, Netlify, or AWS S3.</li>
        </ul>
      </div>
    ),
    toc: [
      { id: '1-building-the-client', text: 'Building the Client' },
      { id: '2-database--hosting', text: 'Database & Hosting' }
    ]
  },
  'faqs': {
    title: 'Frequently Asked Questions',
    description: 'Get solutions to common queries regarding workspace limits, AI credits, and configuration issues.',
    readingTime: '3 min read',
    lastUpdated: 'Updated 2 days ago',
    content: (setActiveTab) => (
      <div className="space-y-6">
        <p className="text-zinc-300 leading-relaxed">
          Can't find the answers you're looking for? Reach out to support or open an issue on our GitHub repository.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">How does AI Copilot fetch context?</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          The copilot scans task text descriptions, active labels, sprint milestones, and other boards inside the same workspace using index lookups to construct precise prompt structures for DeepSeek/OpenAI.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Can I disable cookies?</h2>
        <p className="text-zinc-300 font-sans leading-relaxed">
          DevFlow AI relies on HTTP-only cookie parameters for session persistence. Disabling cookies will cause logins to fail.
        </p>
      </div>
    ),
    toc: [
      { id: 'how-does-ai-copilot-fetch-context', text: 'AI Context FAQs' },
      { id: 'can-i-disable-cookies', text: 'Cookie configurations' }
    ]
  }
};

// Helper components
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04]"
      title="Copy snippet"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
};

export function DocsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeDocId, setActiveDocId] = useState('intro');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    'getting-started': false,
    'workspace': false,
    'projects': false,
    'ai-features': false,
    'api': false,
  });
  
  // Custom tab state for installation pages (npm vs yarn)
  const [activeTab, setActiveTab] = useState('npm');

  const activeDoc = DOCS_DATA[activeDocId] || DOCS_DATA['intro'];

  const handleDocChange = (docId) => {
    setActiveDocId(docId);
    setMenuOpen(false);
  };

  const DOC_ORDER = [
    'intro',
    'installation',
    'auth',
    'create-workspace',
    'invite-members',
    'roles-policies',
    'create-project',
    'kanban-board',
    'calendar-view',
    'tasks-backlog',
    'ai-copilot',
    'sprint-planner',
    'endpoints',
    'websocket-actions',
    'deployment-guide',
    'faqs'
  ];

  const currentIndex = DOC_ORDER.indexOf(activeDocId);
  const prevDocId = currentIndex > 0 ? DOC_ORDER[currentIndex - 1] : null;
  const nextDocId = currentIndex < DOC_ORDER.length - 1 ? DOC_ORDER[currentIndex + 1] : null;

  // Toggle sections
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Keyboard shortcut listener for Ctrl + K search command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter searches
  const searchResults = searchQuery.trim() === '' ? [] : Object.entries(DOCS_DATA).filter(([id, data]) => {
    return data.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           data.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSearchSelect = (docId) => {
    setActiveDocId(docId);
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-300 relative overflow-hidden font-sans">
      
      {/* ── PREMIUM LIGHTING VIGNETTE ── */}
      <div 
        className="absolute pointer-events-none z-0"
        style={{
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "radial-gradient(ellipse 65% 80% at 15% 30%, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.02) 40%, transparent 70%)",
          filter: "blur(40px)"
        }}
      />
      <div 
        className="absolute pointer-events-none z-0"
        style={{
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "radial-gradient(ellipse 80% 90% at 85% 55%, rgba(0,0,0,0.3) 0%, transparent 75%)"
        }}
      />

      {/* ── TOP NAV BAR ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-md transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-white/[0.02] border border-white/8 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">DevFlow AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Features</Link>
            <Link to="/#pricing" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/docs" className="text-xs font-medium text-white transition-colors">Docs</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={logout} 
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                  Sign Out
                </button>
                <button 
                  onClick={() => navigate('/app')} 
                  className="text-xs font-medium text-black bg-white hover:bg-zinc-200 px-3.5 py-1.5 rounded-lg font-semibold tracking-wide transition-all duration-200 flex items-center gap-1 cursor-pointer"
                >
                  Open App
                  <ArrowRight size={13} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block cursor-pointer bg-transparent border-none"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-xs font-medium text-black bg-white hover:bg-zinc-200 px-3.5 py-1.5 rounded-lg font-semibold tracking-wide transition-all duration-200 flex items-center gap-1 cursor-pointer"
                >
                  Open App
                  <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Docs Sub-navigation Bar */}
        <div className="border-t border-white/[0.04] bg-white/[0.01]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <button 
                onClick={() => setMenuOpen(prev => !prev)}
                className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Toggle documentation menu"
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
              <span className="hidden md:inline text-xs font-semibold text-white tracking-wider uppercase">Documentation</span>
              <div className="hidden md:block h-4 w-[1px] bg-white/[0.08]" />
              <div className="relative">
                <select className="appearance-none bg-white/[0.02] border border-white/[0.06] rounded-md px-2.5 py-1 pr-7 text-[11px] font-medium text-zinc-400 hover:text-white focus:outline-none transition-colors cursor-pointer">
                  <option value="v1.0.0">v1.0.0 (Latest)</option>
                  <option value="v0.9.0">v0.9.0 (Beta)</option>
                </select>
                <ChevronDown className="absolute right-2 top-[50%] -translate-y-[50%] text-zinc-500 pointer-events-none" size={10} />
              </div>
            </div>

            {/* Quick search input trigger */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center md:justify-between w-9 h-7 md:w-60 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] px-2 md:px-3 py-1.5 rounded-lg text-xs text-zinc-500 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                <span className="hidden md:inline group-hover:text-zinc-400 transition-colors">Search docs...</span>
              </div>
              <span className="hidden md:flex text-[10px] font-mono bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-600 border border-white/[0.02] items-center gap-0.5">
                <Command size={9} />K
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN THREE-COLUMN WORKSPACE ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_200px] gap-8">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block sticky top-[130px] h-[calc(100vh-170px)] overflow-y-auto pr-4 scrollbar-thin">
            <DocsNavigation 
              activeDocId={activeDocId}
              handleDocChange={handleDocChange}
              collapsedSections={collapsedSections}
              toggleSection={toggleSection}
            />
          </aside>

          {/* CENTER CONTENT ARTICLE */}
          <main className="min-w-0 pr-0 xl:pr-6">
            
            {/* Header info */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} />
                <span>Docs</span>
                <ChevronRight size={10} />
                <span className="text-zinc-400 capitalize">{activeDocId.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Clock size={11} /> {activeDoc.readingTime}</span>
                <span>•</span>
                <span>{activeDoc.lastUpdated}</span>
              </div>
            </div>

            <article className="prose prose-invert max-w-none">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3 font-display">
                {activeDoc.title}
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed font-sans mb-8">
                {activeDoc.description}
              </p>

              {/* Dynamic Content Renderer */}
              {activeDoc.content(setActiveTab, activeTab)}
            </article>

            {/* Pagination links at bottom */}
            <div className="mt-16 pt-8 border-t border-white/[0.06] flex items-center justify-between">
              <button 
                onClick={() => prevDocId && setActiveDocId(prevDocId)}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                disabled={!prevDocId}
              >
                <ChevronRight size={14} className="rotate-180" /> Previous
              </button>
              <button 
                onClick={() => nextDocId && setActiveDocId(nextDocId)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!nextDocId}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </main>

          {/* RIGHT SIDEBAR OUTLINE */}
          <aside className="hidden xl:block sticky top-[130px] h-[calc(100vh-170px)]">
            <div className="space-y-6">
              
              {/* Table of contents */}
              {activeDoc.toc && activeDoc.toc.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">On this page</h4>
                  <ul className="space-y-2.5 text-xs text-zinc-400 border-l border-white/[0.04] pl-2 ml-0.5">
                    {activeDoc.toc.map((item) => (
                      <li key={item.id}>
                        <a 
                          href={`#${item.id}`} 
                          className="hover:text-white transition-colors leading-relaxed block"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="h-[1px] bg-white/[0.04]" />

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Helpful resources</h4>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                        GitHub Repository <ExternalLink size={10} className="text-zinc-600" />
                      </a>
                    </li>
                    <li>
                      <a href="#discord" className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                        Join Discord <ExternalLink size={10} className="text-zinc-600" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Back to Top */}
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors pt-2 cursor-pointer"
                >
                  <ArrowUp size={12} />
                  Back to top
                </button>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* ── COMMAND PALETTE SEARCH MODAL ── */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-28 px-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Command Palette Card */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[550px] bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-[0_30px_100px_-10px_rgba(0,0,0,1)] overflow-hidden"
            >
              
              {/* Input wrapper */}
              <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
                <Search size={16} className="text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documentation, API endpoints..."
                  className="w-full bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none"
                  autoFocus
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="text-[10px] font-mono text-zinc-500 border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.05] hover:text-white px-2 py-0.5 rounded transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Suggestions / Results */}
              <div className="max-h-[350px] overflow-y-auto p-2.5 space-y-4">
                {searchQuery.trim() === '' ? (
                  <>
                    {/* Recent Pages */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">Pages</h4>
                      <div className="space-y-0.5">
                        <SearchItem icon={<BookOpen size={14} />} title="Introduction to DevFlow AI" category="Getting Started" onClick={() => handleSearchSelect('intro')} />
                        <SearchItem icon={<Terminal size={14} />} title="Installation & Setup Guide" category="Getting Started" onClick={() => handleSearchSelect('installation')} />
                        <SearchItem icon={<Lock size={14} />} title="Authentication & Cookies" category="Getting Started" onClick={() => handleSearchSelect('auth')} />
                        <SearchItem icon={<Layout size={14} />} title="Creating workspace" category="Workspace" onClick={() => handleSearchSelect('create-workspace')} />
                        <SearchItem icon={<Sparkles size={14} />} title="Context-Aware AI Copilot" category="AI Features" onClick={() => handleSearchSelect('ai-copilot')} />
                      </div>
                    </div>

                    {/* Developer Shortcuts / Commands */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">Quick Commands</h4>
                      <div className="space-y-0.5">
                        <SearchItem icon={<Terminal size={14} />} title="Go to Dashboard" category="Navigation" onClick={() => { setSearchOpen(false); navigate('/app'); }} />
                        <SearchItem icon={<HelpCircle size={14} />} title="Contact Support" category="Help" onClick={() => { setSearchOpen(false); }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">Search Results ({searchResults.length})</h4>
                    <div className="space-y-0.5">
                      {searchResults.length > 0 ? (
                        searchResults.map(([id, item]) => (
                          <SearchItem 
                            key={id}
                            icon={<BookOpen size={14} />} 
                            title={item.title} 
                            category="Doc Article" 
                            onClick={() => handleSearchSelect(id)} 
                          />
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 px-2 py-4">No results found for "{searchQuery}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile navigation menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm top-[100px]"
            />
            {/* Sidebar drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-[100px] bottom-0 w-72 z-35 bg-[#09090B] border-r border-white/[0.06] overflow-y-auto p-6 scrollbar-thin"
            >
              <DocsNavigation 
                activeDocId={activeDocId} 
                handleDocChange={handleDocChange} 
                collapsedSections={collapsedSections} 
                toggleSection={toggleSection} 
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// Subcomponents helper for Sidebar Link
function SidebarLink({ children, active, disabled, onClick }) {
  if (disabled) {
    return (
      <span className="text-[13px] text-zinc-600 cursor-not-allowed pl-3 py-1 block">
        {children}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`text-[13px] text-left pl-3 py-1 rounded-md w-full transition-all duration-200 block cursor-pointer ${
        active 
          ? 'bg-white/[0.04] text-white font-medium shadow-sm' 
          : 'text-zinc-400 hover:text-zinc-100 hover:pl-3.5'
      }`}
    >
      {children}
    </button>
  );
}

// Search result item
function SearchItem({ icon, title, category, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-left transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-2.5">
        <div className="text-zinc-500 group-hover:text-white transition-colors">{icon}</div>
        <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{title}</span>
      </div>
      <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors uppercase tracking-wider font-semibold font-mono">{category}</span>
    </button>
  );
}

// Docs Navigation menu
function DocsNavigation({ activeDocId, handleDocChange, collapsedSections, toggleSection }) {
  return (
    <nav className="space-y-6">
      
      {/* Getting Started Category */}
      <div>
        <button 
          onClick={() => toggleSection('getting-started')}
          className="flex items-center justify-between w-full text-xs font-semibold text-white hover:text-zinc-300 tracking-wider uppercase mb-2.5 text-left transition-colors"
        >
          <span>Getting Started</span>
          {collapsedSections['getting-started'] ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </button>
        {!collapsedSections['getting-started'] && (
          <div className="space-y-1.5 pl-1.5 border-l border-white/[0.04] ml-1">
            <SidebarLink active={activeDocId === 'intro'} onClick={() => handleDocChange('intro')}>Introduction</SidebarLink>
            <SidebarLink active={activeDocId === 'installation'} onClick={() => handleDocChange('installation')}>Installation</SidebarLink>
            <SidebarLink active={activeDocId === 'auth'} onClick={() => handleDocChange('auth')}>Authentication</SidebarLink>
          </div>
        )}
      </div>

      {/* Workspace Category */}
      <div>
        <button 
          onClick={() => toggleSection('workspace')}
          className="flex items-center justify-between w-full text-xs font-semibold text-white hover:text-zinc-300 tracking-wider uppercase mb-2.5 text-left transition-colors"
        >
          <span>Workspace</span>
          {collapsedSections['workspace'] ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </button>
        {!collapsedSections['workspace'] && (
          <div className="space-y-1.5 pl-1.5 border-l border-white/[0.04] ml-1">
            <SidebarLink active={activeDocId === 'create-workspace'} onClick={() => handleDocChange('create-workspace')}>Creating Workspace</SidebarLink>
            <SidebarLink active={activeDocId === 'invite-members'} onClick={() => handleDocChange('invite-members')}>Inviting Members</SidebarLink>
            <SidebarLink active={activeDocId === 'roles-policies'} onClick={() => handleDocChange('roles-policies')}>Roles & Policies</SidebarLink>
          </div>
        )}
      </div>

      {/* Projects Category */}
      <div>
        <button 
          onClick={() => toggleSection('projects')}
          className="flex items-center justify-between w-full text-xs font-semibold text-white hover:text-zinc-300 tracking-wider uppercase mb-2.5 text-left transition-colors"
        >
          <span>Projects</span>
          {collapsedSections['projects'] ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </button>
        {!collapsedSections['projects'] && (
          <div className="space-y-1.5 pl-1.5 border-l border-white/[0.04] ml-1">
            <SidebarLink active={activeDocId === 'create-project'} onClick={() => handleDocChange('create-project')}>Create Project</SidebarLink>
            <SidebarLink active={activeDocId === 'kanban-board'} onClick={() => handleDocChange('kanban-board')}>Kanban Board</SidebarLink>
            <SidebarLink active={activeDocId === 'calendar-view'} onClick={() => handleDocChange('calendar-view')}>Calendar View</SidebarLink>
            <SidebarLink active={activeDocId === 'tasks-backlog'} onClick={() => handleDocChange('tasks-backlog')}>Tasks & Backlog</SidebarLink>
          </div>
        )}
      </div>

      {/* AI Features Category */}
      <div>
        <button 
          onClick={() => toggleSection('ai-features')}
          className="flex items-center justify-between w-full text-xs font-semibold text-white hover:text-zinc-300 tracking-wider uppercase mb-2.5 text-left transition-colors"
        >
          <span>AI Features</span>
          {collapsedSections['ai-features'] ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </button>
        {!collapsedSections['ai-features'] && (
          <div className="space-y-1.5 pl-1.5 border-l border-white/[0.04] ml-1">
            <SidebarLink active={activeDocId === 'ai-copilot'} onClick={() => handleDocChange('ai-copilot')}>AI Copilot</SidebarLink>
            <SidebarLink active={activeDocId === 'sprint-planner'} onClick={() => handleDocChange('sprint-planner')}>Sprint Planner</SidebarLink>
          </div>
        )}
      </div>

      {/* API Category */}
      <div>
        <button 
          onClick={() => toggleSection('api')}
          className="flex items-center justify-between w-full text-xs font-semibold text-white hover:text-zinc-300 tracking-wider uppercase mb-2.5 text-left transition-colors"
        >
          <span>API Reference</span>
          {collapsedSections['api'] ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </button>
        {!collapsedSections['api'] && (
          <div className="space-y-1.5 pl-1.5 border-l border-white/[0.04] ml-1">
            <SidebarLink active={activeDocId === 'endpoints'} onClick={() => handleDocChange('endpoints')}>Endpoints</SidebarLink>
            <SidebarLink active={activeDocId === 'websocket-actions'} onClick={() => handleDocChange('websocket-actions')}>WebSocket Actions</SidebarLink>
          </div>
        )}
      </div>

      <div className="h-[1px] bg-white/[0.04]" />
      
      <div className="space-y-3">
        <SidebarLink active={activeDocId === 'deployment-guide'} onClick={() => handleDocChange('deployment-guide')}>Deployment Guide</SidebarLink>
        <SidebarLink active={activeDocId === 'faqs'} onClick={() => handleDocChange('faqs')}>FAQs</SidebarLink>
      </div>

    </nav>
  );
}
