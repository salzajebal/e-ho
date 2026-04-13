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
          <linearGradient id="mi-ibg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1C0F07" />
            <stop offset="50%" stopColor="#120906" />
            <stop offset="100%" stopColor="#0A0503" />
          </linearGradient>
          <radialGradient id="mi-iglow" cx="50%" cy="45%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#C9892A" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#8B5523" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mi-igold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7E08A" />
            <stop offset="35%" stopColor="#D4A045" />
            <stop offset="70%" stopColor="#A8701E" />
            <stop offset="100%" stopColor="#7A4E12" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="mi-igold2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8C060" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="mi-irim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4A045" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#8B5A20" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A045" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="mi-ibar1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7E08A" />
            <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="mi-ibar2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EDD070" />
            <stop offset="100%" stopColor="#8B5A18" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="mi-ibar3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7E08A" />
            <stop offset="100%" stopColor="#A07020" stopOpacity="0.8" />
          </linearGradient>
          <filter id="mi-ibarglow" x="-40%" y="-30%" width="180%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="mi-itextglow" x="-15%" y="-40%" width="130%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="76" height="76" rx="16" fill="url(#mi-ibg)" />
        <rect width="76" height="76" rx="16" fill="url(#mi-iglow)" />

        <rect x="16" y="48" width="7" height="14" rx="1.5" fill="url(#mi-ibar1)" />
        <rect x="27" y="37" width="7" height="25" rx="1.5" fill="url(#mi-ibar2)" />
        <rect x="38" y="25" width="7" height="37" rx="1.5" fill="url(#mi-ibar3)" filter="url(#mi-ibarglow)" />

        <polyline
          points="19.5,46 30.5,35 41.5,23"
          stroke="url(#mi-igold2)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#mi-ibarglow)"
        />
        <polygon points="41.5,23 47,27 44,30.5" fill="#F7E08A" opacity="0.95" filter="url(#mi-ibarglow)" />

        <text
          x="56"
          y="55"
          fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontSize="11"
          fontWeight="800"
          letterSpacing="0.5"
          fill="url(#mi-igold)"
          textAnchor="middle"
          filter="url(#mi-itextglow)"
        >
          MIB
        </text>

        <line x1="8" y1="66" x2="68" y2="66" stroke="url(#mi-igold2)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />

        <rect x="1" y="1" width="74" height="74" rx="15" stroke="url(#mi-irim)" strokeWidth="1" fill="none" />

        <rect x="4" y="4" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="4" y="4" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="67" y="4" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="70.5" y="4" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="4" y="70.5" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="4" y="67" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="67" y="70.5" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
        <rect x="70.5" y="67" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
      </svg>
    );
  }

  const h = size ?? height ?? 48;
  const aspectRatio = 300 / 76;
  const w = Math.round(h * aspectRatio);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 300 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mi-bg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C0F07" />
          <stop offset="50%" stopColor="#120906" />
          <stop offset="100%" stopColor="#0A0503" />
        </linearGradient>
        <radialGradient id="mi-glow" cx="50%" cy="45%" r="55%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#C9892A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8B5523" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mi-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" />
          <stop offset="35%" stopColor="#D4A045" />
          <stop offset="70%" stopColor="#A8701E" />
          <stop offset="100%" stopColor="#7A4E12" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="mi-gold2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C060" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="mi-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#8B5A20" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A045" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="mi-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" />
          <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="mi-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDD070" />
          <stop offset="100%" stopColor="#8B5A18" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="mi-bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" />
          <stop offset="100%" stopColor="#A07020" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="mi-textmib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E8B0" />
          <stop offset="40%" stopColor="#D4A045" />
          <stop offset="100%" stopColor="#9B6B1A" />
        </linearGradient>
        <linearGradient id="mi-textsub" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#B8893A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#D4A045" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mi-divline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#D4A045" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4A045" stopOpacity="0" />
        </linearGradient>
        <filter id="mi-barglow" x="-40%" y="-30%" width="180%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="mi-textglow" x="-5%" y="-25%" width="110%" height="150%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="mi-subtextglow" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="76" height="76" rx="16" fill="url(#mi-bg)" />
      <rect width="76" height="76" rx="16" fill="url(#mi-glow)" />

      <rect x="16" y="48" width="7" height="14" rx="1.5" fill="url(#mi-bar1)" />
      <rect x="27" y="37" width="7" height="25" rx="1.5" fill="url(#mi-bar2)" />
      <rect x="38" y="25" width="7" height="37" rx="1.5" fill="url(#mi-bar3)" filter="url(#mi-barglow)" />

      <polyline
        points="19.5,46 30.5,35 41.5,23"
        stroke="url(#mi-gold2)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#mi-barglow)"
      />
      <polygon points="41.5,23 47,27 44,30.5" fill="#F7E08A" opacity="0.95" filter="url(#mi-barglow)" />

      <text
        x="56"
        y="55"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.5"
        fill="url(#mi-gold)"
        textAnchor="middle"
        filter="url(#mi-textglow)"
      >
        MIB
      </text>

      <line x1="8" y1="66" x2="68" y2="66" stroke="url(#mi-gold2)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />

      <rect x="1" y="1" width="74" height="74" rx="15" stroke="url(#mi-rim)" strokeWidth="1" fill="none" />

      <rect x="4" y="4" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="4" y="4" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="67" y="4" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="70.5" y="4" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="4" y="70.5" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="4" y="67" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="67" y="70.5" width="5" height="1.5" rx="0.5" fill="#D4A045" opacity="0.5" />
      <rect x="70.5" y="67" width="1.5" height="5" rx="0.5" fill="#D4A045" opacity="0.5" />

      <line x1="88" y1="10" x2="88" y2="66" stroke="#7A4E12" strokeWidth="0.8" opacity="0.5" />

      <text
        x="100"
        y="42"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="32"
        fontWeight="800"
        letterSpacing="6"
        fill="url(#mi-textmib)"
        filter="url(#mi-textglow)"
      >
        MIB
      </text>

      <line x1="100" y1="50" x2="292" y2="50" stroke="url(#mi-divline)" strokeWidth="0.7" />

      <text
        x="101"
        y="64"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="9.5"
        fontWeight="400"
        letterSpacing="5"
        fill="url(#mi-textsub)"
        filter="url(#mi-subtextglow)"
      >
        GLOBAL EXCHANGE
      </text>
    </svg>
  );
}
