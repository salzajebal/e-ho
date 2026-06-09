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

  const GeminiSymbol = ({ w, h }: { w: number; h: number }) => (
    <svg width={w} height={h} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="50" r="21" stroke="#00CFFF" strokeWidth="8" fill="none"/>
      <circle cx="65" cy="50" r="21" stroke="#00CFFF" strokeWidth="8" fill="none"/>
      <rect x="31" y="29" width="38" height="42" fill="white"/>
      <line x1="35" y1="29" x2="35" y2="71" stroke="#00CFFF" strokeWidth="8"/>
      <line x1="65" y1="29" x2="65" y2="71" stroke="#00CFFF" strokeWidth="8"/>
      <line x1="31" y1="50" x2="69" y2="50" stroke="#00CFFF" strokeWidth="8"/>
    </svg>
  );

  if (variant === "icon") {
    const h = size ?? height ?? 32;
    return <GeminiSymbol w={h} h={h} />;
  }

  const h = size ?? height ?? 32;
  const iconSize = Math.round(h * 1.1);

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ height: h }}>
      <GeminiSymbol w={iconSize} h={iconSize} />
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
