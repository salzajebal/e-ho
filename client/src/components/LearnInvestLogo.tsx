interface LogoProps {
  size?: number;
  height?: number;
  className?: string;
  variant?: "icon" | "full";
  dark?: boolean;
}

function GeminiMark({ size = 32, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle
        cx="36"
        cy="50"
        r="30"
        stroke={color}
        strokeWidth="8"
        fill="none"
      />
      <circle
        cx="72"
        cy="50"
        r="22"
        stroke={color}
        strokeWidth="8"
        fill="none"
      />
      <line
        x1="6"
        y1="50"
        x2="94"
        y2="50"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LearnInvestLogo({
  size,
  height,
  className = "",
  variant = "full",
  dark = false,
}: LogoProps) {
  const markColor = dark ? "#ffffff" : "#0f0f0f";
  const textColor = dark ? "#ffffff" : "#0d0d0d";
  const accentColor = dark ? "#c9a84c" : "#b8922a";

  const h = size ?? height ?? 32;
  const iconSize = Math.round(h * 1.15);

  if (variant === "icon") {
    return (
      <div className={className}>
        <GeminiMark size={h} color={markColor} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      style={{ height: h }}
    >
      <GeminiMark size={iconSize} color={markColor} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 300,
            fontSize: h * 0.76,
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
            fontSize: h * 0.27,
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
