import { motion } from 'framer-motion';
import { Outlet, Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Left: Brand hero */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        {/* Gradient bg */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-zinc-950 to-violet-900/20" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 h-64 w-64 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">DevFlow AI</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold text-white mb-4 leading-tight"
          >
            Ship faster with
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              AI-powered workflows
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-zinc-400 text-lg max-w-sm mx-auto"
          >
            Project management that thinks with you. Built for software teams who move fast.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-6 mt-12"
          >
            {['Real-time sync', 'AI assistant', 'Kanban board'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-zinc-500">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {feature}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <Link
          to="/"
          className="absolute top-6 right-8 text-xs font-semibold text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">DevFlow AI</span>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
