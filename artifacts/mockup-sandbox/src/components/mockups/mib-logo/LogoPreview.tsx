export function LogoPreview() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-16 px-12 py-16" style={{ background: "#1a1008" }}>

      <div className="text-center">
        <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#8B6020", fontFamily: "Helvetica Neue, sans-serif" }}>현재 로고</p>
        <CurrentLogo />
      </div>

      <div style={{ width: "100%", height: "1px", background: "linear-gradient(to right, transparent, #4a2e08, transparent)" }} />

      <div className="text-center">
        <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#D4A045", fontFamily: "Helvetica Neue, sans-serif" }}>새 로고 (제안)</p>
        <NewLogo />
      </div>

    </div>
  );
}

function CurrentLogo() {
  return (
    <svg width="300" height="76" viewBox="0 0 300 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="c-bg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C0F07" />
          <stop offset="50%" stopColor="#120906" />
          <stop offset="100%" stopColor="#0A0503" />
        </linearGradient>
        <radialGradient id="c-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C9892A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8B5523" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="c-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" />
          <stop offset="35%" stopColor="#D4A045" />
          <stop offset="70%" stopColor="#A8701E" />
          <stop offset="100%" stopColor="#7A4E12" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="c-gold2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C060" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="c-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#8B5A20" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A045" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="c-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" /><stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="c-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDD070" /><stop offset="100%" stopColor="#8B5A18" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="c-bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" /><stop offset="100%" stopColor="#A07020" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="c-textmib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E8B0" /><stop offset="40%" stopColor="#D4A045" /><stop offset="100%" stopColor="#9B6B1A" />
        </linearGradient>
        <linearGradient id="c-textsub" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.9" /><stop offset="60%" stopColor="#B8893A" stopOpacity="0.7" /><stop offset="100%" stopColor="#D4A045" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="c-divline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.8" /><stop offset="50%" stopColor="#D4A045" stopOpacity="0.4" /><stop offset="100%" stopColor="#D4A045" stopOpacity="0" />
        </linearGradient>
        <filter id="c-barglow" x="-40%" y="-30%" width="180%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="c-textglow" x="-5%" y="-25%" width="110%" height="150%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="c-subtextglow" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="76" height="76" rx="16" fill="url(#c-bg)" />
      <rect width="76" height="76" rx="16" fill="url(#c-glow)" />
      <rect x="16" y="48" width="7" height="14" rx="1.5" fill="url(#c-bar1)" />
      <rect x="27" y="37" width="7" height="25" rx="1.5" fill="url(#c-bar2)" />
      <rect x="38" y="25" width="7" height="37" rx="1.5" fill="url(#c-bar3)" filter="url(#c-barglow)" />
      <polyline points="19.5,46 30.5,35 41.5,23" stroke="url(#c-gold2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#c-barglow)" />
      <polygon points="41.5,23 47,27 44,30.5" fill="#F7E08A" opacity="0.95" filter="url(#c-barglow)" />
      <text x="56" y="55" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="11" fontWeight="800" letterSpacing="0.5" fill="url(#c-gold)" textAnchor="middle" filter="url(#c-textglow)">MIB</text>
      <line x1="8" y1="66" x2="68" y2="66" stroke="url(#c-gold2)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
      <rect x="1" y="1" width="74" height="74" rx="15" stroke="url(#c-rim)" strokeWidth="1" fill="none" />
      <line x1="88" y1="10" x2="88" y2="66" stroke="#7A4E12" strokeWidth="0.8" opacity="0.5" />
      <text x="100" y="42" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="32" fontWeight="800" letterSpacing="6" fill="url(#c-textmib)" filter="url(#c-textglow)">MIB</text>
      <line x1="100" y1="50" x2="292" y2="50" stroke="url(#c-divline)" strokeWidth="0.7" />
      <text x="101" y="64" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="9.5" fontWeight="400" letterSpacing="5" fill="url(#c-textsub)" filter="url(#c-subtextglow)">GLOBAL EXCHANGE</text>
    </svg>
  );
}

function NewLogo() {
  return (
    <svg width="320" height="76" viewBox="0 0 320 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="n-bg" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C0F07" />
          <stop offset="50%" stopColor="#120906" />
          <stop offset="100%" stopColor="#0A0503" />
        </linearGradient>
        <radialGradient id="n-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C9892A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8B5523" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="n-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" />
          <stop offset="35%" stopColor="#D4A045" />
          <stop offset="70%" stopColor="#A8701E" />
          <stop offset="100%" stopColor="#7A4E12" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="n-gold2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C060" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="n-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#8B5A20" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A045" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="n-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" /><stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="n-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDD070" /><stop offset="100%" stopColor="#8B5A18" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="n-bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E08A" /><stop offset="100%" stopColor="#A07020" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="n-textmib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E8B0" />
          <stop offset="40%" stopColor="#D4A045" />
          <stop offset="100%" stopColor="#9B6B1A" />
        </linearGradient>
        <linearGradient id="n-textidx" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#B8893A" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#9B6B1A" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="n-divline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A045" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#D4A045" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A045" stopOpacity="0" />
        </linearGradient>
        <filter id="n-barglow" x="-40%" y="-30%" width="180%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="n-textglow" x="-5%" y="-25%" width="110%" height="150%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="n-idxglow" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* 아이콘 박스 */}
      <rect width="76" height="76" rx="16" fill="url(#n-bg)" />
      <rect width="76" height="76" rx="16" fill="url(#n-glow)" />

      {/* 바 차트 */}
      <rect x="16" y="48" width="7" height="14" rx="1.5" fill="url(#n-bar1)" />
      <rect x="27" y="37" width="7" height="25" rx="1.5" fill="url(#n-bar2)" />
      <rect x="38" y="25" width="7" height="37" rx="1.5" fill="url(#n-bar3)" filter="url(#n-barglow)" />

      {/* 상승 화살표 라인 */}
      <polyline points="19.5,46 30.5,35 41.5,23" stroke="url(#n-gold2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#n-barglow)" />
      <polygon points="41.5,23 47,27 44,30.5" fill="#F7E08A" opacity="0.95" filter="url(#n-barglow)" />

      {/* 아이콘 내 MIB 텍스트 */}
      <text x="56" y="55" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="11" fontWeight="800" letterSpacing="0.5" fill="url(#n-gold)" textAnchor="middle" filter="url(#n-textglow)">MIB</text>

      {/* 하단 구분선 */}
      <line x1="8" y1="66" x2="68" y2="66" stroke="url(#n-gold2)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />

      {/* 아이콘 테두리 */}
      <rect x="1" y="1" width="74" height="74" rx="15" stroke="url(#n-rim)" strokeWidth="1" fill="none" />

      {/* 수직 구분선 */}
      <line x1="92" y1="10" x2="92" y2="66" stroke="#7A4E12" strokeWidth="0.8" opacity="0.5" />

      {/* MIB 대형 텍스트 */}
      <text x="104" y="40" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="30" fontWeight="900" letterSpacing="5" fill="url(#n-textmib)" filter="url(#n-textglow)">MIB</text>

      {/* INDEX 서브텍스트 */}
      <line x1="104" y1="47" x2="315" y2="47" stroke="url(#n-divline)" strokeWidth="0.7" />
      <text x="104" y="63" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing="8" fill="url(#n-textidx)" filter="url(#n-idxglow)">INDEX</text>
    </svg>
  );
}
