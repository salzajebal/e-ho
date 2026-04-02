import { useState } from "react";

interface SymbolIconProps {
  symbol: string;
  size?: number;
}

const LOGO_URLS: Record<string, string> = {
  SP500: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/S%26P_500_logo.svg/200px-S%26P_500_logo.svg.png",
  DOW: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Dow_Jones_Logo.svg/200px-Dow_Jones_Logo.svg.png",
};

export function SymbolIcon({ symbol, size = 22 }: SymbolIconProps) {
  const base = symbol.split("-")[0];
  const [imgError, setImgError] = useState(false);

  if ((base === "SP500" || base === "DOW") && !imgError) {
    return (
      <img
        src={LOGO_URLS[base]}
        alt={base}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          objectFit: "contain",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }

  if (base === "DXY") {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dxy-bg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1a3a1a" />
            <stop offset="100%" stopColor="#0f2d0f" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" rx="6" fill="url(#dxy-bg)" />
        <circle cx="14" cy="14" r="10" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.4" />
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fontFamily="'Georgia', 'Times New Roman', serif"
          fontSize="15"
          fontWeight="bold"
          fill="#4ade80"
        >$</text>
        <line x1="14" y1="4.5" x2="14" y2="7.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="14" y1="20.5" x2="14" y2="23.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="0.5" y="0.5" width="27" height="27" rx="5.5" stroke="#22c55e" strokeOpacity="0.2" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="5" fill="#1e293b" />
      <text x="14" y="18" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial" fontWeight="bold">
        {base.slice(0, 2)}
      </text>
    </svg>
  );
}
