interface LogoProps {
  size?: number;
  className?: string;
}

export function LearnInvestLogo({ size = 48, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="24" fill="url(#bgGrad)" />
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e4d9b" />
          <stop offset="100%" stopColor="#0f2d6b" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="22" y1="0" x2="98" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      <rect x="22" y="72" width="14" height="20" rx="3" fill="#3b82f6" opacity="0.7" />
      <rect x="42" y="58" width="14" height="34" rx="3" fill="#3b82f6" opacity="0.85" />
      <rect x="62" y="44" width="14" height="48" rx="3" fill="#60a5fa" />
      <rect x="82" y="30" width="14" height="62" rx="3" fill="#93c5fd" />
      <polyline points="29,68 49,52 69,38 89,24" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="89,24 96,28 84,32" fill="#93c5fd" />
      <line x1="18" y1="96" x2="102" y2="96" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
