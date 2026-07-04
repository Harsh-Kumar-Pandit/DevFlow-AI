import { formatDistanceToNow, format, isToday, isYesterday, isTomorrow } from 'date-fns';

export function formatRelativeTime(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '';
  return format(new Date(date), fmt);
}

export function formatDueDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return { label: 'Today', color: 'text-amber-400' };
  if (isYesterday(d)) return { label: 'Yesterday', color: 'text-red-400' };
  if (isTomorrow(d)) return { label: 'Tomorrow', color: 'text-blue-400' };
  const isPast = d < new Date();
  return {
    label: format(d, 'MMM d'),
    color: isPast ? 'text-red-400' : 'text-zinc-400',
  };
}
