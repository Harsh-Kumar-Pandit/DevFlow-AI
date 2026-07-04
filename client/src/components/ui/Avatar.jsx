import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/getInitials';

const sizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

const colors = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-orange-500',
];

function getColorForName(name = '') {
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ user, size = 'md', online = false, className = '' }) {
  const name = user?.fullName || user?.username || '?';
  const color = getColorForName(name);

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white',
            sizes[size],
            color
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full ring-2 ring-zinc-950" />
      )}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 4, size = 'sm' }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div
          key={user._id || i}
          className="-ml-2 first:ml-0 ring-2 ring-zinc-950 rounded-full"
        >
          <Avatar user={user} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            '-ml-2 ring-2 ring-zinc-950 rounded-full bg-zinc-700 flex items-center justify-center font-medium text-zinc-300',
            sizes[size]
          )}
        >
          <span className="text-xs">+{overflow}</span>
        </div>
      )}
    </div>
  );
}
