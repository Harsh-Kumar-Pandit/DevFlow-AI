import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  primary: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
  accent: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const sizes = {
  sm: 'h-5 px-1.5 text-[10px] rounded-md',
  md: 'h-6 px-2 text-xs rounded-lg',
  lg: 'h-7 px-2.5 text-sm rounded-lg',
};

export function Badge({ children, variant = 'default', size = 'md', className = '', dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'primary' && 'bg-indigo-400',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'accent' && 'bg-violet-400',
            variant === 'default' && 'bg-zinc-400',
          )}
        />
      )}
      {children}
    </span>
  );
}
