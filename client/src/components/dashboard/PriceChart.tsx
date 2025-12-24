import { useEffect, useRef, memo, useState } from "react";

interface PriceChartProps {
  symbol: string;
  duration?: number;
  currentPrice: number;
}

function PriceChartComponent({ symbol, duration = 60, currentPrice }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const durationMinutes = duration / 60;
  
  // TradingView symbol mapping
  const getTradingViewSymbol = () => {
    if (symbol === 'NDX') {
      return 'OANDA:NAS100USD'; // NASDAQ 100 CFD - closely tracks NDX
    } else if (symbol === 'GOLD') {
      return 'OANDA:XAUUSD'; // Gold spot
    }
    return 'OANDA:NAS100USD';
  };

  // TradingView interval mapping
  const getInterval = () => {
    if (durationMinutes === 1) return '1';
    if (durationMinutes === 3) return '3';
    if (durationMinutes === 5) return '5';
    return '1';
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';
    setWidgetLoaded(false);

    // Create TradingView widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    containerRef.current.appendChild(widgetContainer);

    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: getTradingViewSymbol(),
      interval: getInterval(),
      timezone: "Asia/Seoul",
      theme: "dark",
      style: "1",
      locale: "kr",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(19, 23, 34, 1)",
      gridColor: "rgba(30, 34, 45, 0.6)",
    });

    script.onload = () => {
      setWidgetLoaded(true);
    };

    widgetContainer.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, duration]);

  const isUp = currentPrice > 0;
  const symbolName = symbol === 'NDX' ? '나스닥 100' : symbol === 'GOLD' ? '골드' : symbol;

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }} data-testid="chart-container">
      {/* Price Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2E39]" style={{ backgroundColor: '#1E222D' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{symbol}</span>
          <span className="text-[#787B86] text-xs">{symbolName}</span>
          <span className="text-[#787B86] text-xs">• {durationMinutes}분</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#26A69A] text-base font-bold">
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#2962FF', color: 'white' }}>
            {durationMinutes}분봉
          </div>
        </div>
      </div>

      {/* TradingView Widget */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {!widgetLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#2962FF] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#787B86] text-sm">차트 로딩 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with current betting price */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#2A2E39]" style={{ backgroundColor: '#1E222D' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#26A69A] animate-pulse"></div>
          <span className="text-[#787B86] text-xs">실시간 베팅가</span>
        </div>
        <span className="text-[#F0B90B] text-sm font-bold">
          {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
