import { useEffect, useRef, memo } from "react";
import { MarketData } from "@/lib/marketData";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

function getTradingViewSymbol(symbol: string): string {
  switch (symbol) {
    case "NDX":
      return "OANDA:NAS100USD";
    case "GOLD":
      return "OANDA:XAUUSD";
    default:
      return "OANDA:NAS100USD";
  }
}

function getInterval(durationSeconds: number): string {
  const minutes = durationSeconds / 60;
  switch (minutes) {
    case 1:
      return "1";
    case 3:
      return "3";
    case 5:
      return "5";
    default:
      return "1";
  }
}

function PriceChartComponent({ symbol, data, duration = 60 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const tvSymbol = getTradingViewSymbol(symbol);
  const interval = getInterval(duration);
  const durationMinutes = duration / 60;
  const isUp = data.change >= 0;

  useEffect(() => {
    if (!widgetRef.current) return;

    // Clear previous widget
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      timezone: "Asia/Seoul",
      theme: "dark",
      style: "1",
      locale: "ko_KR",
      backgroundColor: "rgba(19, 23, 34, 1)",
      gridColor: "rgba(30, 34, 45, 0.6)",
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
    });

    widgetRef.current.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = "";
      }
    };
  }, [tvSymbol, interval]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full w-full" 
      style={{ backgroundColor: '#131722' }}
      data-testid="chart-container"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e222d] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">{symbol}</span>
          <span className="text-xs text-gray-400">지수</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {isUp ? '+' : ''}{data.change.toFixed(2)} ({isUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </span>
          <span className="bg-[#ef5350] text-white text-xs px-2 py-0.5 rounded font-semibold">
            {durationMinutes}분봉
          </span>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <div 
          ref={widgetRef}
          className="tradingview-widget-container absolute inset-0"
          style={{ height: '100%', width: '100%' }}
        >
          <div 
            className="tradingview-widget-container__widget" 
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
