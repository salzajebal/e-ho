import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

function generateCandleData(basePrice: number, count: number, intervalSeconds: number): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Align to interval boundary
  const alignedNow = Math.floor(now / intervalSeconds) * intervalSeconds;
  
  let currentPrice = basePrice * 0.995;
  const intervalMinutes = intervalSeconds / 60;
  
  // Volatility based on interval (longer intervals = bigger moves)
  const volatility = 0.003 * Math.sqrt(intervalMinutes);

  for (let i = count - 1; i >= 0; i--) {
    const time = (alignedNow - i * intervalSeconds) as Time;
    
    const open = currentPrice;
    const change = open * volatility * (Math.random() - 0.5) * 2;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

    data.push({ time, open, high, low, close });
    currentPrice = close;
  }

  return data;
}

export function PriceChart({ symbol, data, duration = 60 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastSymbolRef = useRef<string>(symbol);
  const lastDurationRef = useRef<number>(duration);
  const lastPriceRef = useRef<number>(data.price);
  const currentCandleRef = useRef<CandlestickData<Time> | null>(null);

  const isPositive = data.change >= 0;
  const durationMinutes = duration / 60;

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (timestamp: number) => {
          // Convert to KST (UTC+9)
          const date = new Date(timestamp * 1000);
          const kstHours = (date.getUTCHours() + 9) % 24;
          const minutes = date.getUTCMinutes();
          return `${kstHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Initial data
    const initialData = generateCandleData(data.price, 100, duration);
    candlestickSeries.setData(initialData);
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update data when symbol or duration changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    if (symbol !== lastSymbolRef.current || duration !== lastDurationRef.current) {
      const newData = generateCandleData(data.price, 100, duration);
      seriesRef.current.setData(newData);
      chartRef.current.timeScale().fitContent();
      lastSymbolRef.current = symbol;
      lastDurationRef.current = duration;
      
      // Reset current candle tracking
      if (newData.length > 0) {
        currentCandleRef.current = { ...newData[newData.length - 1] };
      }
    }
  }, [symbol, duration, data.price]);

  // Track price for real-time updates
  useEffect(() => {
    lastPriceRef.current = data.price;
  }, [data.price]);

  // Real-time candle updates
  useEffect(() => {
    if (!seriesRef.current) return;

    const intervalMs = duration * 1000;
    
    // Get current interval start time
    let currentIntervalStart = Math.floor(Date.now() / intervalMs) * intervalMs / 1000;
    
    // Initialize current candle
    currentCandleRef.current = {
      time: currentIntervalStart as Time,
      open: lastPriceRef.current,
      high: lastPriceRef.current,
      low: lastPriceRef.current,
      close: lastPriceRef.current,
    };

    const updateInterval = setInterval(() => {
      if (!seriesRef.current || !currentCandleRef.current) return;

      const now = Date.now();
      const newIntervalStart = Math.floor(now / intervalMs) * intervalMs / 1000;
      const price = lastPriceRef.current;

      if (newIntervalStart > currentIntervalStart) {
        // New candle period
        currentIntervalStart = newIntervalStart;
        currentCandleRef.current = {
          time: newIntervalStart as Time,
          open: price,
          high: price,
          low: price,
          close: price,
        };
      } else {
        // Update current candle
        currentCandleRef.current = {
          ...currentCandleRef.current,
          high: Math.max(currentCandleRef.current.high, price),
          low: Math.min(currentCandleRef.current.low, price),
          close: price,
        };
      }

      try {
        seriesRef.current.update(currentCandleRef.current);
      } catch {}
    }, 500);

    return () => clearInterval(updateInterval);
  }, [duration]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ backgroundColor: '#131722' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-[#2a2e39] z-10 shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-white">{symbol}</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
            {durationMinutes}분봉
          </span>
        </div>
        
        <div className="flex items-center gap-4 ml-2">
          <div className="flex flex-col">
            <span className={`text-xl font-mono font-bold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-6 ml-auto text-xs">
          <div className="flex flex-col">
            <span className="text-gray-500">24시간 고가</span>
            <span className="text-white font-mono">{data.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">24시간 저가</span>
            <span className="text-white font-mono">{data.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">24시간 거래량</span>
            <span className="text-white font-mono">{(data.volume || 920000).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* TradingView Logo */}
      <div className="absolute bottom-14 left-3 z-10 opacity-50">
        <div className="flex items-center gap-1 text-[#2962ff]">
          <svg width="20" height="20" viewBox="0 0 36 28" fill="currentColor">
            <path d="M14 22H7V6h7v16zm8-16h-7v16h7V6zm8 0h-7v16h7V6z"/>
          </svg>
          <span className="text-xs font-semibold">TradingView</span>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full min-h-0"
        data-testid="chart-container"
      />
    </div>
  );
}
