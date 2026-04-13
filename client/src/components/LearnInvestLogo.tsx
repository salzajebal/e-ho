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
          <linearGradient id="mib-ibg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2C1A0A" />
            <stop offset="50%" stopColor="#1A0E06" />
            <stop offset="100%" stopColor="#0D0602" />
          </linearGradient>
          <radialGradient id="mib-ispot" cx="35%" cy="28%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#C9892A" stopOpacity="0.3" />
            <stop offset="55%" stopColor="#8B5523" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3D1F08" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mib-ishine" x1="0" y1="0" x2="0.65" y2="0.65" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="38%" stopColor="white" stopOpacity="0.04" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mib-igold1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5D08A" />
            <stop offset="50%" stopColor="#C9892A" />
            <stop offset="100%" stopColor="#8B5C1A" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="mib-igold2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0C060" />
            <stop offset="100%" stopColor="#A06B20" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="mib-irim" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#C9892A" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#8B5523" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#C9892A" stopOpacity="0.08" />
          </linearGradient>
          <filter id="mib-iglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="mib-itextglow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="76" height="76" rx="17" fill="url(#mib-ibg)" />
        <rect width="76" height="76" rx="17" fill="url(#mib-ispot)" />
        <rect width="76" height="76" rx="17" fill="url(#mib-ishine)" />

        <text
          x="38"
          y="48"
          fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontSize="30"
          fontWeight="800"
          letterSpacing="1"
          fill="url(#mib-igold1)"
          textAnchor="middle"
          filter="url(#mib-itextglow)"
        >
          MIB
        </text>

        <line x1="14" y1="57" x2="62" y2="57" stroke="url(#mib-igold2)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />

        <rect x="1" y="1" width="74" height="74" rx="16" stroke="url(#mib-irim)" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }

  const h = size ?? height ?? 48;
  const aspectRatio = 280 / 76;
  const w = Math.round(h * aspectRatio);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 280 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mib-bg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2C1A0A" />
          <stop offset="50%" stopColor="#1A0E06" />
          <stop offset="100%" stopColor="#0D0602" />
        </linearGradient>
        <radialGradient id="mib-spot" cx="35%" cy="28%" r="60%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#C9892A" stopOpacity="0.3" />
          <stop offset="55%" stopColor="#8B5523" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#3D1F08" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mib-shine" x1="0" y1="0" x2="0.65" y2="0.65" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="38%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mib-gold1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5D08A" />
          <stop offset="50%" stopColor="#C9892A" />
          <stop offset="100%" stopColor="#8B5C1A" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="mib-gold2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0C060" />
          <stop offset="100%" stopColor="#A06B20" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="mib-textmain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E8C0" />
          <stop offset="100%" stopColor="#D4A853" />
        </linearGradient>
        <linearGradient id="mib-textsub" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9892A" />
          <stop offset="60%" stopColor="#E8B84B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#D4A040" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="mib-divider" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9892A" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#8B5523" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C9892A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mib-rim" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#C9892A" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#8B5523" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#C9892A" stopOpacity="0.08" />
        </linearGradient>
        <filter id="mib-textglow" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="mib-subtextglow" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="76" height="76" rx="17" fill="url(#mib-bg)" />
      <rect width="76" height="76" rx="17" fill="url(#mib-spot)" />
      <rect width="76" height="76" rx="17" fill="url(#mib-shine)" />

      <text
        x="38"
        y="48"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="1"
        fill="url(#mib-gold1)"
        textAnchor="middle"
        filter="url(#mib-textglow)"
      >
        MIB
      </text>

      <line x1="14" y1="57" x2="62" y2="57" stroke="url(#mib-gold2)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />

      <rect x="1" y="1" width="74" height="74" rx="16" stroke="url(#mib-rim)" strokeWidth="1.2" fill="none" />

      <line x1="88" y1="10" x2="88" y2="66" stroke="#8B5523" strokeWidth="0.8" opacity="0.6" />

      <text
        x="100"
        y="35"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="5"
        fill="url(#mib-textmain)"
        filter="url(#mib-textglow)"
      >
        MIB
      </text>

      <line x1="100" y1="43" x2="272" y2="43" stroke="url(#mib-divider)" strokeWidth="0.7" />

      <text
        x="101"
        y="61"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="10"
        fontWeight="500"
        letterSpacing="4.5"
        fill="url(#mib-textsub)"
        filter="url(#mib-subtextglow)"
      >
        GLOBAL EXCHANGE
      </text>

      <text
        x="270"
        y="33"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="6"
        fontWeight="300"
        letterSpacing="1"
        fill="#8B6030"
        textAnchor="end"
        opacity="0.7"
      >
        PREMIUM
      </text>
    </svg>
  );
}
