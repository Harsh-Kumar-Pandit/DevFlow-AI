import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icon size={15} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-10 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500',
            'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30',
            'transition-all duration-150',
            Icon ? 'pl-9 pr-4' : 'px-4',
            error && 'border-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500',
          'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30',
          'transition-all duration-150 resize-none p-3',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});
