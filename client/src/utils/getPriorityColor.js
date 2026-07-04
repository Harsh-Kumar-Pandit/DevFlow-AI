export function getPriorityConfig(priority) {
  const configs = {
    Low: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      dot: 'bg-emerald-400',
      border: 'border-emerald-400/30',
      label: 'Low',
    },
    Medium: {
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      dot: 'bg-amber-400',
      border: 'border-amber-400/30',
      label: 'Medium',
    },
    High: {
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      dot: 'bg-orange-400',
      border: 'border-orange-400/30',
      label: 'High',
    },
    Critical: {
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      dot: 'bg-red-400',
      border: 'border-red-400/30',
      label: 'Critical',
    },
  };
  return configs[priority] || configs.Medium;
}
