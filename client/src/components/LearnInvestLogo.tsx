interface LogoProps {
  size?: number;
  height?: number;
  className?: string;
  variant?: "icon" | "full";
  dark?: boolean;
}

export function LearnInvestLogo({
  size,
  height,
  className = "",
  variant = "full",
  dark = false,
}: LogoProps) {
  const textColor = dark ? "#ffffff" : "#0d0d0d";
  const accentColor = dark ? "#c9a84c" : "#b8922a";
  const gemColor1 = dark ? "#e8c96a" : "#c9a84c";
  const gemColor2 = dark ? "#f0d88a" : "#dbb85e";
  const gemShadow = dark ? "#a07820" : "#8a6010";

  const GemIcon = ({ w, h }: { w: number; h: number }) => (
    <svg width={w} height={h} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer gem shape — hexagonal diamond */}
      <polygon
        points="20,3 33,11 33,29 20,37 7,29 7,11"
        fill="none"
        stroke={gemColor1}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner gem facets */}
      <polygon
        points="20,3 33,11 20,20"
        fill={gemColor1}
        fillOpacity="0.25"
      />
      <polygon
        points="20,3 7,11 20,20"
        fill={gemColor2}
        fillOpacity="0.18"
      />
      <polygon
        points="7,11 7,29 20,20"
        fill={gemShadow}
        fillOpacity="0.22"
      />
      <polygon
        points="33,11 33,29 20,20"
        fill={gemColor1}
        fillOpacity="0.30"
      />
      <polygon
        points="7,29 20,37 20,20"
        fill={gemColor2}
        fillOpacity="0.20"
      />
      <polygon
        points="33,29 20,37 20,20"
        fill={gemColor1}
        fillOpacity="0.15"
      />
      {/* Center highlight */}
      <circle cx="20" cy="20" r="2.5" fill={gemColor2} fillOpacity="0.7" />
      {/* Top sparkle */}
      <line x1="20" y1="0" x2="20" y2="3" stroke={gemColor2} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="1.2" x2="22" y2="1.2" stroke={gemColor2} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );

  if (variant === "icon") {
    const h = size ?? height ?? 32;
    return <GemIcon w={h} h={h} />;
  }

  const h = size ?? height ?? 32;
  const iconSize = Math.round(h * 1.15);

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ height: h }}>
      <GemIcon w={iconSize} h={iconSize} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 300,
            fontSize: h * 0.78,
            letterSpacing: "0.22em",
            color: textColor,
            lineHeight: 1,
            textTransform: "uppercase" as const,
          }}
        >
          GEMINI
        </span>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: h * 0.28,
            letterSpacing: "0.38em",
            color: accentColor,
            lineHeight: 1,
            marginTop: "3px",
            textTransform: "uppercase" as const,
          }}
        >
          INVESTMENT
        </span>
      </div>
    </div>
  );
}
