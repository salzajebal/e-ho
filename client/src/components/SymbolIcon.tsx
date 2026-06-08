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
      <rect width="20" height="20" fill="#B22234" />
      <rect y="1.54" width="20" height="1.54" fill="white" />
      <rect y="4.62" width="20" height="1.54" fill="white" />
      <rect y="7.69" width="20" height="1.54" fill="white" />
      <rect y="10.77" width="20" height="1.54" fill="white" />
      <rect y="13.85" width="20" height="1.54" fill="white" />
      <rect y="16.92" width="20" height="1.54" fill="white" />
      <rect width="8" height="10.77" fill="#3C3B6E" />
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

function BTCLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M22.1 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.6 2.6c-.4-.1-.9-.2-1.3-.3l.6-2.6-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3v0l-2.2-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .1.1-.1 0-.1 0-.2-.1l-1.1 4.5c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3L9 20.9l2.1.5c.4.1.8.2 1.2.3l-.7 2.7 1.6.4.7-2.7c.5.1.9.3 1.4.4l-.7 2.7 1.6.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.0-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2-3.8 1-4.9.7l.9-3.4c1.1.3 4.5.9 4 2.7zm.5-5.4c-.5 1.8-3.3 1-4.2.7l.8-3.1c.9.2 3.9.7 3.4 2.4z"
        fill="white"
      />
    </svg>
  );
}

function ETHLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16 5.5L9 16.2l7 4.1 7-4.1L16 5.5z" fill="white" fillOpacity="0.9" />
      <path d="M9 16.2L16 20.3v-7.2L9 16.2z" fill="white" fillOpacity="0.6" />
      <path d="M23 16.2L16 13.1v7.2L23 16.2z" fill="white" fillOpacity="0.8" />
      <path d="M16 21.7L9 17.6l7 8.9 7-8.9-7 4.1z" fill="white" fillOpacity="0.9" />
      <path d="M9 17.6L16 21.7v-4.1L9 17.6z" fill="white" fillOpacity="0.6" />
      <path d="M23 17.6L16 21.7v-4.1L23 17.6z" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

function GOLDLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#C8960C" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id="gold-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF176" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#gold-grad)" />
      <circle cx="16" cy="16" r="16" fill="url(#gold-shine)" />
      {/* Gold bar shape */}
      <rect x="8" y="11" width="16" height="10" rx="2" fill="white" fillOpacity="0.15" />
      <rect x="9" y="12" width="14" height="8" rx="1.5" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.8" />
      {/* "Au" chemical symbol */}
      <text
        x="16"
        y="19.5"
        textAnchor="middle"
        fontFamily="'Georgia', serif"
        fontSize="9"
        fontWeight="bold"
        fill="white"
        fillOpacity="0.95"
      >Au</text>
      {/* Top shine */}
      <ellipse cx="12" cy="13.5" rx="3" ry="1.5" fill="white" fillOpacity="0.25" transform="rotate(-20 12 13.5)" />
    </svg>
  );
}

function SP500Logo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="7" fill="#C81F31" />
      <text x="18" y="15" textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif" fontSize="10" fontWeight="900" fill="white" letterSpacing="-0.5">S&amp;P</text>
      <text x="18" y="27" textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif" fontSize="11" fontWeight="900" fill="white" letterSpacing="0.5">500</text>
    </svg>
  );
}

function DOWLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="7" fill="#0D2B5E" />
      <text x="18" y="16" textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif" fontSize="11" fontWeight="900" fill="white" letterSpacing="1">DOW</text>
      <rect x="6" y="19" width="24" height="1.5" fill="#E8A020" rx="0.75" />
      <text x="18" y="29" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#A8C4E8" letterSpacing="0.5">JONES</text>
    </svg>
  );
}

function DXYLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="7" fill="#1A5F3C" />
      <text x="18" y="23" textAnchor="middle" fontFamily="'Georgia', 'Times New Roman', serif" fontSize="22" fontWeight="bold" fill="#4ADE80">$</text>
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
    if (base === "BTC") return <BTCLogo size={size} />;
    if (base === "ETH") return <ETHLogo size={size} />;
    if (base === "GOLD") return <GOLDLogo size={size} />;
    if (!imgError && LOGO_URLS[base]) {
      return (
        <img
          src={LOGO_URLS[base]}
          alt={base}
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ objectFit: "contain", display: "block", flexShrink: 0, borderRadius: 6 }}
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
