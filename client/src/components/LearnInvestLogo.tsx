interface LogoProps {
  size?: number;
  height?: number;
  className?: string;
  variant?: "icon" | "full";
}

export function LearnInvestLogo({
  size,
  height,
  className = "",
  variant = "full",
}: LogoProps) {
  if (variant === "icon") {
    const h = size ?? height ?? 48;
    const w = h;
    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 76 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="li-ibg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1c3f8a" />
            <stop offset="60%" stopColor="#0e245c" />
            <stop offset="100%" stopColor="#071535" />
          </linearGradient>
          <linearGradient id="li-ishine" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="55%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="li-ibar1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="li-ibar2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ec8fb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="li-ibar3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a5d8ff" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="li-ibar4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="li-iline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          <filter id="li-iglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="76" height="76" rx="17" fill="url(#li-ibg)" />
        <rect width="76" height="76" rx="17" fill="url(#li-ishine)" />
        <rect x="10" y="52" width="9" height="14" rx="2.5" fill="url(#li-ibar1)" />
        <rect x="22" y="42" width="9" height="24" rx="2.5" fill="url(#li-ibar2)" />
        <rect x="34" y="30" width="9" height="36" rx="2.5" fill="url(#li-ibar3)" filter="url(#li-iglow)" />
        <rect x="46" y="18" width="9" height="48" rx="2.5" fill="url(#li-ibar4)" filter="url(#li-iglow)" />
        <line x1="7" y1="68" x2="60" y2="68" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <polyline
          points="14.5,50 27,39 39,28 50.5,16"
          stroke="url(#li-iline)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#li-iglow)"
        />
        <polygon points="50.5,16 57,20 53,24" fill="white" opacity="0.95" />
        <rect x="1" y="1" width="74" height="74" rx="16" stroke="white" strokeOpacity="0.08" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  const h = size ?? height ?? 48;
  const aspectRatio = 310 / 76;
  const w = Math.round(h * aspectRatio);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 310 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="li-bg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1c3f8a" />
          <stop offset="60%" stopColor="#0e245c" />
          <stop offset="100%" stopColor="#071535" />
        </linearGradient>
        <linearGradient id="li-shine" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="55%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="li-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="li-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ec8fb" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="li-bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5d8ff" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="li-bar4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="li-trendline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
        <linearGradient id="li-textlearn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f6ff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="li-textinvest" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="li-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
        <filter id="li-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="li-textglow" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="76" height="76" rx="17" fill="url(#li-bg)" />
      <rect width="76" height="76" rx="17" fill="url(#li-shine)" />

      <rect x="10" y="52" width="9" height="14" rx="2.5" fill="url(#li-bar1)" />
      <rect x="22" y="42" width="9" height="24" rx="2.5" fill="url(#li-bar2)" />
      <rect x="34" y="30" width="9" height="36" rx="2.5" fill="url(#li-bar3)" filter="url(#li-glow)" />
      <rect x="46" y="18" width="9" height="48" rx="2.5" fill="url(#li-bar4)" filter="url(#li-glow)" />

      <line x1="7" y1="68" x2="60" y2="68" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />

      <polyline
        points="14.5,50 27,39 39,28 50.5,16"
        stroke="url(#li-trendline)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#li-glow)"
      />
      <polygon points="50.5,16 57,20 53,24" fill="white" opacity="0.95" />

      <rect x="1" y="1" width="74" height="74" rx="16" stroke="white" strokeOpacity="0.08" strokeWidth="1" fill="none" />

      <line x1="90" y1="11" x2="90" y2="65" stroke="#2d4fa0" strokeWidth="1" opacity="0.6" />

      <text
        x="102"
        y="37"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="26"
        fontWeight="200"
        letterSpacing="5"
        fill="url(#li-textlearn)"
      >
        LEARN
      </text>

      <line x1="102" y1="43" x2="295" y2="43" stroke="url(#li-accent)" strokeWidth="0.7" />

      <text
        x="103"
        y="63"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="19"
        fontWeight="700"
        letterSpacing="7"
        fill="url(#li-textinvest)"
        filter="url(#li-textglow)"
      >
        INVEST
      </text>

      <text
        x="265"
        y="37"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="7.5"
        fontWeight="300"
        letterSpacing="1.2"
        fill="#64748b"
        textAnchor="end"
      >
        GLOBAL PLATFORM
      </text>
    </svg>
  );
}
