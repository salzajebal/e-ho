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
  const color = dark ? "#ffffff" : "#0a0a0a";

  if (variant === "icon") {
    const h = size ?? height ?? 32;
    const w = h;
    return (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Gemini symbol: two arcs facing each other with horizontal bars */}
        <line x1="4" y1="8" x2="28" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="4" y1="24" x2="28" y2="24" strokeWidth="2.5" strokeLinecap="round" stroke={color}/>
        <path d="M8 8 Q4 16 8 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M24 8 Q28 16 24 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    );
  }

  const h = size ?? height ?? 32;

  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ height: h }}>
      <svg width={h} height={h} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="8" x2="28" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="4" y1="24" x2="28" y2="24" strokeWidth="2.5" strokeLinecap="round" stroke={color}/>
        <path d="M8 8 Q4 16 8 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M24 8 Q28 16 24 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontSize: h * 0.72,
          letterSpacing: "0.04em",
          color: color,
          lineHeight: 1,
        }}
      >
        GEMINI
      </span>
    </div>
  );
}
