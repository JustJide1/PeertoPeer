function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
} as const;

export default function Avatar({ name, size = 'md' }: { name: string; size?: keyof typeof SIZE_CLASSES }) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-blue-900 font-semibold text-white ${SIZE_CLASSES[size]}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
