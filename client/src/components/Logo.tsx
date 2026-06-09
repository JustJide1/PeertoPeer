interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bowen P2P"
    >
      <rect width="32" height="32" rx="7" fill="#1e3a8a" />
      <path d="M10 13 L10 19 A6 4.5 0 0 1 22 19 L22 13 Z" fill="white" opacity="0.9" />
      <polygon points="16,4 27,10 16,16 5,10" fill="white" />
      <line x1="27" y1="10" x2="27" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="27" cy="23.5" r="2" fill="white" />
    </svg>
  );
}
