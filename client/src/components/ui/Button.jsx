import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-[#7C6CF2] hover:bg-[#8B7CF6] text-white font-semibold shadow-[0_1px_1px_rgba(255,255,255,0.25)_inset,0_2px_6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(124,108,242,0.8)]',
  secondary: 'bg-[#0A0A0A] hover:bg-[#111111] text-[#ECECEC] font-medium border border-white/[0.08] shadow-[0_1px_1px_rgba(255,255,255,0.08)_inset,0_2px_8px_rgba(0,0,0,0.5)]',
  ghost: 'text-zinc-400 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
  gradient: 'bg-[#ECECEC] hover:bg-white text-[#0A0A0A] font-semibold border border-white/10 shadow-[0_1px_2px_rgba(255,255,255,0.9)_inset,0_4px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.2)]',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs rounded-lg',
  sm: 'h-8 px-3 text-sm rounded-xl',
  md: 'h-9 px-4 text-sm rounded-xl',
  lg: 'h-10 px-5 text-base rounded-xl',
  xl: 'h-11 px-6 text-base rounded-2xl',
  icon: 'h-9 w-9 rounded-xl',
  'icon-sm': 'h-7 w-7 rounded-lg',
  'icon-lg': 'h-11 w-11 rounded-xl',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium cursor-pointer select-none',
        'transition-all duration-[250ms] ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
}
