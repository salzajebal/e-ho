interface LogoProps {
  size?: number;
  height?: number;
  className?: string;
  variant?: "icon" | "full";
  dark?: boolean;
}

function GeminiMark({ size = 32, color = "#0f0f0f" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="34" cy="50" r="34" stroke={color} strokeWidth="8.5" />
      <circle cx="76" cy="50" r="22" stroke={color} strokeWidth="8.5" />
      <line x1="0" y1="50" x2="98" y2="50" stroke={color} strokeWidth="8.5" strokeLinecap="round" />
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
  const textColor = dark ? "#ffffff" : "#0f0f0f";

  const h = size ?? height ?? 32;
  const iconSize = Math.round(h * 1.1);

  if (variant === "icon") {
    return (
      <div className={className}>
        <GeminiMark size={h} color={markColor} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{ height: h }}
    >
      <GeminiMark size={iconSize} color={markColor} />
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 300,
          fontSize: h * 0.82,
          letterSpacing: "0.18em",
          color: textColor,
          lineHeight: 1,
          textTransform: "uppercase" as const,
          whiteSpace: "nowrap" as const,
        }}
      >
        GEMINI
      </span>
    </div>
  );
}
