import { useEffect, useRef, memo } from "react";

interface PriceChartProps {
  symbol: string;
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

function PriceChartComponent({ symbol, duration = 60 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const tvSymbol = getTradingViewSymbol(symbol);
  const interval = getInterval(duration);

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
      className="h-full w-full" 
      style={{ backgroundColor: '#131722' }}
      data-testid="chart-container"
    >
      <div 
        ref={widgetRef}
        className="tradingview-widget-container h-full w-full"
      >
        <div 
          className="tradingview-widget-container__widget" 
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
