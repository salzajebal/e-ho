interface SymbolIconProps {
  symbol: string;
  size?: number;
}

export function SymbolIcon({ symbol, size = 22 }: SymbolIconProps) {
  const base = symbol.split('-')[0];

  if (base === 'SP500') {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sp-bg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3faa" />
            <stop offset="100%" stopColor="#1a2e8a" />
          </linearGradient>
          <linearGradient id="sp-bar4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" rx="5" fill="url(#sp-bg)" />
        <rect x="4"  y="20" width="3.5" height="5"  rx="0.8" fill="#60a5fa" />
        <rect x="9"  y="16" width="3.5" height="9"  rx="0.8" fill="#93c5fd" />
        <rect x="14" y="11" width="3.5" height="14" rx="0.8" fill="#bfdbfe" />
        <rect x="19" y="6"  width="3.5" height="19" rx="0.8" fill="url(#sp-bar4)" />
        <polyline
          points="5.75,19 10.75,15 15.75,10 21,5"
          stroke="white"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.7"
        />
        <rect x="0.5" y="0.5" width="27" height="27" rx="4.5" stroke="white" strokeOpacity="0.1" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  if (base === 'DOW') {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dj-bg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f1f5a" />
            <stop offset="100%" stopColor="#0a1440" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" rx="5" fill="url(#dj-bg)" />
        <rect x="3"  y="13" width="4" height="12" rx="1" fill="#334f99" />
        <rect x="8.5"  y="10" width="4" height="15" rx="1" fill="#3d5db5" />
        <rect x="14" y="7"  width="4" height="18" rx="1" fill="#4f75d0" />
        <rect x="19.5" y="4"  width="4" height="21" rx="1" fill="#6b94e8" />
        <rect x="3" y="25" width="21" height="1.2" rx="0.6" fill="#4a6ab0" opacity="0.6" />
        <text
          x="5"
          y="10"
          fontFamily="'Arial Black', Arial, sans-serif"
          fontSize="6.5"
          fontWeight="900"
          fill="white"
          opacity="0.85"
          letterSpacing="0.5"
        >DJ</text>
        <rect x="0.5" y="0.5" width="27" height="27" rx="4.5" stroke="white" strokeOpacity="0.1" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  if (base === 'DXY') {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dxy-bg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <linearGradient id="dxy-dollar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" rx="5" fill="url(#dxy-bg)" />
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fontFamily="'Arial Black', Arial, sans-serif"
          fontSize="16"
          fontWeight="900"
          fill="url(#dxy-dollar)"
        >$</text>
        <line x1="14" y1="4"  x2="14" y2="7.5"  stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="20.5" x2="14" y2="24" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="0.5" y="0.5" width="27" height="27" rx="4.5" stroke="white" strokeOpacity="0.1" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="5" fill="#1e293b" />
      <text x="14" y="18" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial" fontWeight="bold">
        {symbol.slice(0, 2)}
      </text>
    </svg>
  );
}
