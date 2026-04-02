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
            <stop offset="0%" stopColor="#1a3a80" />
            <stop offset="45%" stopColor="#0c1e52" />
            <stop offset="100%" stopColor="#060d28" />
          </linearGradient>
          <radialGradient id="li-ispot" cx="35%" cy="28%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#3b6fd4" stopOpacity="0.4" />
            <stop offset="55%" stopColor="#1a3580" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0a1540" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="li-ishine" x1="0" y1="0" x2="0.65" y2="0.65" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="38%" stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="li-ibar1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d90ef" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1a3a8a" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="li-ibar2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e4ccc" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="li-ibar3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="50%" stopColor="#5ba8fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2555cc" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="li-ibar4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8f4ff" />
            <stop offset="30%" stopColor="#bfdfff" />
            <stop offset="100%" stopColor="#4090f5" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="li-iline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7eb8fa" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#c0ddff" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          <linearGradient id="li-irim" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.04" />
          </linearGradient>
          <filter id="li-ibar-glow" x="-30%" y="-15%" width="160%" height="130%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="li-iline-glow" x="-25%" y="-80%" width="150%" height="260%">
            <feGaussianBlur stdDeviation="2.8" result="b1" />
            <feGaussianBlur stdDeviation="1.1" result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="li-iarrow-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="76" height="76" rx="17" fill="url(#li-ibg)" />
        <rect width="76" height="76" rx="17" fill="url(#li-ispot)" />
        <rect width="76" height="76" rx="17" fill="url(#li-ishine)" />

        <rect x="11" y="53" width="8" height="13" rx="2" fill="url(#li-ibar1)" />
        <rect x="23" y="43" width="8" height="23" rx="2" fill="url(#li-ibar2)" />
        <rect x="35" y="31" width="8" height="35" rx="2" fill="url(#li-ibar3)" filter="url(#li-ibar-glow)" />
        <rect x="47" y="19" width="8" height="47" rx="2" fill="url(#li-ibar4)" filter="url(#li-ibar-glow)" />

        <rect x="11" y="53" width="8" height="2" rx="1" fill="white" fillOpacity="0.25" />
        <rect x="23" y="43" width="8" height="2" rx="1" fill="white" fillOpacity="0.2" />
        <rect x="35" y="31" width="8" height="2" rx="1" fill="white" fillOpacity="0.3" />
        <rect x="47" y="19" width="8" height="2.5" rx="1" fill="white" fillOpacity="0.45" />

        <line x1="7" y1="68" x2="62" y2="68" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

        <polyline
          points="15,51 27,40 39,29 51,17"
          stroke="url(#li-iline)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#li-iline-glow)"
        />

        <polygon points="51,17 58,21.5 54,25.5" fill="white" opacity="0.98" filter="url(#li-iarrow-glow)" />
        <circle cx="51" cy="17" r="2" fill="white" fillOpacity="0.6" filter="url(#li-iarrow-glow)" />

        <rect x="1" y="1" width="74" height="74" rx="16" stroke="url(#li-irim)" strokeWidth="1.2" fill="none" />
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
          <stop offset="0%" stopColor="#1a3a80" />
          <stop offset="45%" stopColor="#0c1e52" />
          <stop offset="100%" stopColor="#060d28" />
        </linearGradient>
        <radialGradient id="li-spot" cx="35%" cy="28%" r="60%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#3b6fd4" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#1a3580" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0a1540" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="li-shine" x1="0" y1="0" x2="0.65" y2="0.65" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="38%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="li-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d90ef" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1a3a8a" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="li-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#1e4ccc" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="li-bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#5ba8fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2555cc" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="li-bar4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f4ff" />
          <stop offset="30%" stopColor="#bfdfff" />
          <stop offset="100%" stopColor="#4090f5" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="li-trendline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7eb8fa" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#c0ddff" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
        <linearGradient id="li-textlearn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f9ff" />
          <stop offset="100%" stopColor="#c8d8f0" />
        </linearGradient>
        <linearGradient id="li-textinvest" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a9af5" />
          <stop offset="45%" stopColor="#7ec8fc" />
          <stop offset="100%" stopColor="#a8d8ff" />
        </linearGradient>
        <linearGradient id="li-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="li-rim" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.04" />
        </linearGradient>
        <filter id="li-bar-glow" x="-30%" y="-15%" width="160%" height="130%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="li-line-glow" x="-25%" y="-80%" width="150%" height="260%">
          <feGaussianBlur stdDeviation="2.8" result="b1" />
          <feGaussianBlur stdDeviation="1.1" result="b2" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="li-arrow-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="li-textglow" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="76" height="76" rx="17" fill="url(#li-bg)" />
      <rect width="76" height="76" rx="17" fill="url(#li-spot)" />
      <rect width="76" height="76" rx="17" fill="url(#li-shine)" />

      <rect x="11" y="53" width="8" height="13" rx="2" fill="url(#li-bar1)" />
      <rect x="23" y="43" width="8" height="23" rx="2" fill="url(#li-bar2)" />
      <rect x="35" y="31" width="8" height="35" rx="2" fill="url(#li-bar3)" filter="url(#li-bar-glow)" />
      <rect x="47" y="19" width="8" height="47" rx="2" fill="url(#li-bar4)" filter="url(#li-bar-glow)" />

      <rect x="11" y="53" width="8" height="2" rx="1" fill="white" fillOpacity="0.25" />
      <rect x="23" y="43" width="8" height="2" rx="1" fill="white" fillOpacity="0.2" />
      <rect x="35" y="31" width="8" height="2" rx="1" fill="white" fillOpacity="0.3" />
      <rect x="47" y="19" width="8" height="2.5" rx="1" fill="white" fillOpacity="0.45" />

      <line x1="7" y1="68" x2="62" y2="68" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" opacity="0.28" />

      <polyline
        points="15,51 27,40 39,29 51,17"
        stroke="url(#li-trendline)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#li-line-glow)"
      />

      <polygon points="51,17 58,21.5 54,25.5" fill="white" opacity="0.98" filter="url(#li-arrow-glow)" />
      <circle cx="51" cy="17" r="2" fill="white" fillOpacity="0.6" filter="url(#li-arrow-glow)" />

      <rect x="1" y="1" width="74" height="74" rx="16" stroke="url(#li-rim)" strokeWidth="1.2" fill="none" />

      <line x1="90" y1="10" x2="90" y2="66" stroke="#2a4b96" strokeWidth="1" opacity="0.55" />

      <text
        x="102"
        y="37"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="26"
        fontWeight="100"
        letterSpacing="6"
        fill="url(#li-textlearn)"
      >
        LEARN
      </text>

      <line x1="102" y1="43" x2="300" y2="43" stroke="url(#li-accent)" strokeWidth="0.8" />

      <text
        x="103"
        y="63"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="19"
        fontWeight="700"
        letterSpacing="8"
        fill="url(#li-textinvest)"
        filter="url(#li-textglow)"
      >
        INVEST
      </text>

      <text
        x="298"
        y="36"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="7"
        fontWeight="300"
        letterSpacing="1.5"
        fill="#4a6490"
        textAnchor="end"
        opacity="0.75"
      >
        GLOBAL PLATFORM
      </text>
    </svg>
  );
}
