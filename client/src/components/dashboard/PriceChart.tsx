import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";
import { calculateRoundNumber, getKSTDate } from "@shared/rounds";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number; // Game duration in seconds (60, 180, 300)
}

// Get round start time in seconds since epoch (for chart timestamp)
// Returns UTC timestamp that when converted to KST shows correct time
function getRoundStartTimeSeconds(durationSeconds: number, roundNumber: number): number {
  // Get current time in KST
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in ms
  const kstTime = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + kstOffset);
  
  // Get start of day in KST (midnight KST)
  const kstMidnight = new Date(kstTime);
  kstMidnight.setHours(0, 0, 0, 0);
  
  // Calculate round start time in KST
  const roundStartSecondsFromMidnight = (roundNumber - 1) * durationSeconds;
  
  // Convert KST midnight back to UTC timestamp, then add round offset
  // KST midnight = UTC (midnight - 9 hours)
  const utcMidnight = kstMidnight.getTime() - kstOffset;
  
  return Math.floor(utcMidnight / 1000) + roundStartSecondsFromMidnight;
}

// Generate deterministic candle data based on round history
function generateRoundCandles(basePrice: number, count: number, durationSeconds: number, symbol: string): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const currentRound = calculateRoundNumber(durationSeconds);
  
  // Start from earliest round to show
  const startRound = Math.max(1, currentRound - count);
  
  let price = basePrice * 0.995; // Start slightly below base price
  
  for (let round = startRound; round < currentRound; round++) {
    const time = getRoundStartTimeSeconds(durationSeconds, round) as Time;
    
    // Use deterministic random based on round, duration, and symbol
    const seed = round * 7919 + durationSeconds * 7907 + symbol.charCodeAt(0) * 7901;
    const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
    
    const open = price;
    const volatility = basePrice * 0.002; // 0.2% volatility per round
    const change = volatility * (pseudoRandom - 0.5) * 2;
    const close = open + change;
    
    // Create wicks
    const wickRandom = ((seed * 1234 + 56789) % 100000) / 100000;
    const wickSize = Math.abs(change) * 0.3 + volatility * 0.2 * wickRandom;
    const high = Math.max(open, close) + wickSize;
    const low = Math.min(open, close) - wickSize;
    
    data.push({ time, open, high, low, close });
    price = close;
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
  const currentRoundRef = useRef<number>(0);
  const roundStartPriceRef = useRef<number>(data.price);

  const isPositive = data.change >= 0;

  // Get duration label
  const getDurationLabel = (d: number): string => {
    return `${d / 60}분`;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#2B2B43',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#2B2B43',
        },
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderDownColor: '#F6465D',
      borderUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
    });

    // Set initial data
    const initialData = generateRoundCandles(data.price, 50, duration, symbol);
    candlestickSeries.setData(initialData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Initialize round tracking
    const currentRound = calculateRoundNumber(duration);
    currentRoundRef.current = currentRound;
    
    // Use the last candle's close price as the starting point for the current candle
    // This ensures price continuity and prevents jumps
    const lastCandleClose = initialData.length > 0 ? initialData[initialData.length - 1].close : data.price;
    roundStartPriceRef.current = lastCandleClose;
    
    // Create initial current candle starting from last candle's close
    const roundStartTime = getRoundStartTimeSeconds(duration, currentRound);
    currentCandleRef.current = {
      time: roundStartTime as Time,
      open: lastCandleClose,
      high: lastCandleClose,
      low: lastCandleClose,
      close: lastCandleClose,
    };

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

  // Update chart when symbol or duration changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    if (symbol !== lastSymbolRef.current || duration !== lastDurationRef.current) {
      const newData = generateRoundCandles(data.price, 50, duration, symbol);
      seriesRef.current.setData(newData);
      chartRef.current.timeScale().fitContent();
      lastSymbolRef.current = symbol;
      lastDurationRef.current = duration;
      
      // Reinitialize round tracking
      const currentRound = calculateRoundNumber(duration);
      currentRoundRef.current = currentRound;
      
      // Use last candle's close price for continuity
      const lastCandleClose = newData.length > 0 ? newData[newData.length - 1].close : data.price;
      roundStartPriceRef.current = lastCandleClose;
      
      const roundStartTime = getRoundStartTimeSeconds(duration, currentRound);
      currentCandleRef.current = {
        time: roundStartTime as Time,
        open: lastCandleClose,
        high: lastCandleClose,
        low: lastCandleClose,
        close: lastCandleClose,
      };
    }
  }, [symbol, duration, data.price]);

  // Update chart immediately when price changes
  useEffect(() => {
    if (!seriesRef.current || data.price === 0) return;
    
    lastPriceRef.current = data.price;
    
    const currentRound = calculateRoundNumber(duration);
    
    // Check if we moved to a new round
    if (currentRound !== currentRoundRef.current) {
      // Close the old candle and start a new one
      currentRoundRef.current = currentRound;
      roundStartPriceRef.current = data.price;
      
      const roundStartTime = getRoundStartTimeSeconds(duration, currentRound);
      currentCandleRef.current = {
        time: roundStartTime as Time,
        open: data.price,
        high: data.price,
        low: data.price,
        close: data.price,
      };
    } else if (currentCandleRef.current) {
      // Update existing candle with new price
      currentCandleRef.current = {
        time: currentCandleRef.current.time,
        open: currentCandleRef.current.open,
        high: Math.max(currentCandleRef.current.high, data.price),
        low: Math.min(currentCandleRef.current.low, data.price),
        close: data.price,
      };
    }

    // Update the chart
    try {
      if (currentCandleRef.current) {
        seriesRef.current.update(currentCandleRef.current);
      }
    } catch {
      // Silently ignore update errors
    }
  }, [data.price, duration]);

  // Periodic check for new rounds (in case price doesn't change)
  useEffect(() => {
    if (!seriesRef.current) return;
    
    const checkInterval = setInterval(() => {
      if (!seriesRef.current || !currentCandleRef.current) return;
      
      const currentRound = calculateRoundNumber(duration);
      
      if (currentRound !== currentRoundRef.current) {
        // New round - create new candle
        currentRoundRef.current = currentRound;
        roundStartPriceRef.current = lastPriceRef.current;
        
        const roundStartTime = getRoundStartTimeSeconds(duration, currentRound);
        currentCandleRef.current = {
          time: roundStartTime as Time,
          open: lastPriceRef.current,
          high: lastPriceRef.current,
          low: lastPriceRef.current,
          close: lastPriceRef.current,
        };
        
        try {
          seriesRef.current.update(currentCandleRef.current);
        } catch {}
      }
    }, 1000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [duration, symbol]);

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            {getDurationLabel(duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-4 ml-2">
          <div className="flex flex-col">
            <span className={`text-xl font-mono font-bold ${isPositive ? 'text-up' : 'text-down'}`}>
              {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">
              {data.symbol.includes('KRW') ? '₩' : '$'}{data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-muted-foreground">24시간 변동</span>
            <span className={`text-sm font-mono ${isPositive ? 'text-up' : 'text-down'}`}>
              {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
          
          <div className="flex flex-col hidden md:flex">
            <span className="text-xs text-muted-foreground">24시간 고가</span>
            <span className="text-sm font-mono text-foreground">{data.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div className="flex flex-col hidden md:flex">
            <span className="text-xs text-muted-foreground">24시간 저가</span>
            <span className="text-sm font-mono text-foreground">{data.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col hidden lg:flex">
            <span className="text-xs text-muted-foreground">24시간 거래량</span>
            <span className="text-sm font-mono text-foreground">{data.volume.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* TradingView Lightweight Chart */}
      <div className="flex-1 w-full min-h-0" ref={chartContainerRef} />
    </div>
  );
}
