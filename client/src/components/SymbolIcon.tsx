import { useState } from "react";

interface SymbolIconProps {
  symbol: string;
  size?: number;
}

function USFlagBadge({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ display: "block", flexShrink: 0, borderRadius: "50%", overflow: "hidden" }}
    >
      {/* Red and white stripes */}
      <rect width="20" height="20" fill="#B22234" />
      <rect y="1.54" width="20" height="1.54" fill="white" />
      <rect y="4.62" width="20" height="1.54" fill="white" />
      <rect y="7.69" width="20" height="1.54" fill="white" />
      <rect y="10.77" width="20" height="1.54" fill="white" />
      <rect y="13.85" width="20" height="1.54" fill="white" />
      <rect y="16.92" width="20" height="1.54" fill="white" />
      {/* Blue canton */}
      <rect width="8" height="10.77" fill="#3C3B6E" />
      {/* Stars - simplified dots */}
      <circle cx="1.3" cy="1.5" r="0.7" fill="white" />
      <circle cx="3.9" cy="1.5" r="0.7" fill="white" />
      <circle cx="6.5" cy="1.5" r="0.7" fill="white" />
      <circle cx="2.6" cy="3.0" r="0.7" fill="white" />
      <circle cx="5.2" cy="3.0" r="0.7" fill="white" />
      <circle cx="1.3" cy="4.5" r="0.7" fill="white" />
      <circle cx="3.9" cy="4.5" r="0.7" fill="white" />
      <circle cx="6.5" cy="4.5" r="0.7" fill="white" />
      <circle cx="2.6" cy="6.0" r="0.7" fill="white" />
      <circle cx="5.2" cy="6.0" r="0.7" fill="white" />
      <circle cx="1.3" cy="7.5" r="0.7" fill="white" />
      <circle cx="3.9" cy="7.5" r="0.7" fill="white" />
      <circle cx="6.5" cy="7.5" r="0.7" fill="white" />
      <circle cx="2.6" cy="9.0" r="0.7" fill="white" />
      <circle cx="5.2" cy="9.0" r="0.7" fill="white" />
    </svg>
  );
}

function SP500Logo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="7" fill="#C81F31" />
      <text
        x="18"
        y="15"
        textAnchor="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="10"
        fontWeight="900"
        fill="white"
        letterSpacing="-0.5"
      >S&amp;P</text>
      <text
        x="18"
        y="27"
        textAnchor="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="11"
        fontWeight="900"
        fill="white"
        letterSpacing="0.5"
      >500</text>
    </svg>
  );
}

function DOWLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="7" fill="#0D2B5E" />
      <text
        x="18"
        y="16"
        textAnchor="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="11"
        fontWeight="900"
        fill="white"
        letterSpacing="1"
      >DOW</text>
      <rect x="6" y="19" width="24" height="1.5" fill="#E8A020" rx="0.75" />
      <text
        x="18"
        y="29"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="8"
        fontWeight="bold"
        fill="#A8C4E8"
        letterSpacing="0.5"
      >JONES</text>
    </svg>
  );
}

function DXYLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="7" fill="#1A5F3C" />
      <text
        x="18"
        y="23"
        textAnchor="middle"
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize="22"
        fontWeight="bold"
        fill="#4ADE80"
      >$</text>
      <line x1="18" y1="3" x2="18" y2="7" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="29" x2="18" y2="33" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const LOGO_URLS: Record<string, string> = {
  SP500: "https://logo.clearbit.com/spglobal.com",
  DOW: "https://logo.clearbit.com/dowjones.com",
};

export function SymbolIcon({ symbol, size = 22 }: SymbolIconProps) {
  const base = symbol.split("-")[0];
  const [imgError, setImgError] = useState(false);

  const badgeSize = Math.round(size * 0.45);

  const renderLogo = () => {
    if (!imgError && LOGO_URLS[base]) {
      return (
        <img
          src={LOGO_URLS[base]}
          alt={base}
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
            borderRadius: 6,
          }}
        />
      );
    }
    if (base === "SP500") return <SP500Logo size={size} />;
    if (base === "DOW") return <DOWLogo size={size} />;
    if (base === "DXY") return <DXYLogo size={size} />;
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="5" fill="#1e293b" />
        <text x="14" y="18" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial" fontWeight="bold">
          {base.slice(0, 2)}
        </text>
      </svg>
    );
  };

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", flexShrink: 0 }}>
      {renderLogo()}
      <div
        style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          width: badgeSize,
          height: badgeSize,
          borderRadius: "50%",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          flexShrink: 0,
        }}
      >
        <USFlagBadge size={badgeSize} />
      </div>
    </div>
  );
}
