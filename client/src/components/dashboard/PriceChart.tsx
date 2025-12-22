import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";
import { calculateRoundNumber, getKSTDate } from "@shared/rounds";
import { useQuery } from "@tanstack/react-query";
import type { RoundResult } from "@shared/schema";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

function getKSTDateString(): string {
  const kst = getKSTDate();
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRoundTimestamp(roundNumber: number, durationSeconds: number, roundDate: string): number {
  const [year, month, day] = roundDate.split('-').map(Number);
  // Use KST time directly as the timestamp value
  // This way the chart displays KST time without conversion
  const kstMidnight = Date.UTC(year, month - 1, day, 0, 0, 0);
  const roundStartSeconds = (roundNumber - 1) * durationSeconds;
  return Math.floor(kstMidnight / 1000) + roundStartSeconds;
}

function generatePlaceholderCandles(basePrice: number, count: number, durationSeconds: number, symbol: string): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const currentRound = calculateRoundNumber(durationSeconds);
  const roundDate = getKSTDateString();
  
  // Create natural-looking candles with good visual volatility
  let price = basePrice;
  const candles: { round: number; open: number; high: number; low: number; close: number }[] = [];
  
  // Higher volatility for better visual appearance (0.8% - 1.2%)
  const baseVolatility = symbol === 'NDX' ? basePrice * 0.012 : basePrice * 0.008;
  
  // Generate prices backwards (from current round to older rounds)
  for (let i = 0; i < count; i++) {
    const round = currentRound - 1 - i;
    if (round < 1) break;
    
    // Use multiple seeded random values for variety
    const seed1 = round * 7919 + durationSeconds * 7907 + symbol.charCodeAt(0) * 7901;
    const seed2 = round * 3571 + durationSeconds * 2897 + symbol.charCodeAt(0) * 1571;
    const seed3 = round * 5501 + durationSeconds * 4007 + symbol.charCodeAt(0) * 3109;
    const seed4 = round * 6173 + durationSeconds * 5309 + symbol.charCodeAt(0) * 4217;
    
    const rand1 = ((seed1 * 9301 + 49297) % 233280) / 233280;
    const rand2 = ((seed2 * 9301 + 49297) % 233280) / 233280;
    const rand3 = ((seed3 * 9301 + 49297) % 233280) / 233280;
    const rand4 = ((seed4 * 9301 + 49297) % 233280) / 233280;
    
    // More dynamic direction with momentum
    const direction = rand1 > 0.5 ? 1 : -1;
    const momentum = 0.3 + rand4 * 0.7; // 30-100% strength
    const changePercent = direction * momentum * (0.5 + rand2 * 0.5);
    const volatility = baseVolatility * (0.6 + rand3 * 0.8); // Variable 60-140%
    const change = volatility * changePercent;
    
    const close = price;
    const open = price - change;
    
    // Larger wicks for more realistic candles
    const wickUp = volatility * (0.3 + rand1 * 0.5);
    const wickDown = volatility * (0.3 + rand2 * 0.5);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    
    candles.unshift({ round, open, high, low, close });
    price = open;
  }
  
  // Convert to chart data with timestamps
  for (const c of candles) {
    const time = getRoundTimestamp(c.round, durationSeconds, roundDate) as Time;
    data.push({ time, open: c.open, high: c.high, low: c.low, close: c.close });
  }
  
  return data;
}

function convertRoundResultsToCandles(results: RoundResult[], durationSeconds: number): CandlestickData<Time>[] {
  return results
    .map(r => ({
      time: getRoundTimestamp(r.roundNumber, durationSeconds, r.roundDate) as Time,
      open: parseFloat(r.openPrice),
      high: parseFloat(r.highPrice),
      low: parseFloat(r.lowPrice),
      close: parseFloat(r.closePrice),
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function PriceChart({ symbol, data, duration = 60 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastSymbolRef = useRef<string>(symbol);
  const lastDurationRef = useRef<number>(duration);
  const currentCandleRef = useRef<CandlestickData<Time> | null>(null);
  const currentRoundRef = useRef<number>(0);

  const isPositive = data.change >= 0;

  const { data: roundResults } = useQuery<RoundResult[]>({
    queryKey: ['/api/rounds/candles', symbol, duration],
    queryFn: async () => {
      const res = await fetch(`/api/rounds/candles?symbol=${symbol}&duration=${duration}&limit=50`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const getDurationLabel = (d: number): string => {
    return `${d / 60}분`;
  };

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
          // Timestamp already represents KST time, just format it
          const date = new Date(time * 1000);
          const hours = date.getUTCHours().toString().padStart(2, '0');
          const mins = date.getUTCMinutes().toString().padStart(2, '0');
          return `${hours}:${mins}`;
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

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

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

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    // Only rebuild chart data when symbol, duration, or roundResults change
    // NOT when price changes (price updates handled by separate effect)
    const symbolChanged = symbol !== lastSymbolRef.current;
    const durationChanged = duration !== lastDurationRef.current;
    
    let candleData: CandlestickData<Time>[];
    
    if (roundResults && roundResults.length > 0) {
      candleData = convertRoundResultsToCandles(roundResults, duration);
    } else {
      candleData = generatePlaceholderCandles(data.price, 30, duration, symbol);
    }

    if (candleData.length > 0) {
      const lastCandle = candleData[candleData.length - 1];
      
      const currentRound = calculateRoundNumber(duration);
      const roundDate = getKSTDateString();
      const currentRoundTime = getRoundTimestamp(currentRound, duration, roundDate) as Time;
      
      currentRoundRef.current = currentRound;
      
      currentCandleRef.current = {
        time: currentRoundTime,
        open: lastCandle.close,
        high: Math.max(lastCandle.close, data.price),
        low: Math.min(lastCandle.close, data.price),
        close: data.price,
      };
      
      seriesRef.current.setData([...candleData, currentCandleRef.current]);
    } else {
      const currentRound = calculateRoundNumber(duration);
      const roundDate = getKSTDateString();
      const currentRoundTime = getRoundTimestamp(currentRound, duration, roundDate) as Time;
      
      currentRoundRef.current = currentRound;
      currentCandleRef.current = {
        time: currentRoundTime,
        open: data.price,
        high: data.price,
        low: data.price,
        close: data.price,
      };
      
      seriesRef.current.setData([currentCandleRef.current]);
    }

    // Only fit content when symbol or duration changes, not on every update
    if (symbolChanged || durationChanged) {
      chartRef.current.timeScale().fitContent();
    }
    
    lastSymbolRef.current = symbol;
    lastDurationRef.current = duration;
  }, [symbol, duration, roundResults]);

  useEffect(() => {
    if (!seriesRef.current || data.price === 0) return;
    
    const currentRound = calculateRoundNumber(duration);
    const roundDate = getKSTDateString();
    
    if (currentRound !== currentRoundRef.current) {
      currentRoundRef.current = currentRound;
      const roundTime = getRoundTimestamp(currentRound, duration, roundDate) as Time;
      
      currentCandleRef.current = {
        time: roundTime,
        open: data.price,
        high: data.price,
        low: data.price,
        close: data.price,
      };
    } else if (currentCandleRef.current) {
      currentCandleRef.current = {
        time: currentCandleRef.current.time,
        open: currentCandleRef.current.open,
        high: Math.max(currentCandleRef.current.high, data.price),
        low: Math.min(currentCandleRef.current.low, data.price),
        close: data.price,
      };
    }

    if (currentCandleRef.current) {
      try {
        seriesRef.current.update(currentCandleRef.current);
      } catch {
      }
    }
  }, [data.price, duration]);

  useEffect(() => {
    if (!seriesRef.current) return;
    
    const checkInterval = setInterval(() => {
      if (!seriesRef.current || !currentCandleRef.current) return;
      
      const currentRound = calculateRoundNumber(duration);
      const roundDate = getKSTDateString();
      
      if (currentRound !== currentRoundRef.current) {
        currentRoundRef.current = currentRound;
        const roundTime = getRoundTimestamp(currentRound, duration, roundDate) as Time;
        
        currentCandleRef.current = {
          time: roundTime,
          open: data.price,
          high: data.price,
          low: data.price,
          close: data.price,
        };
        
        try {
          seriesRef.current.update(currentCandleRef.current);
        } catch {}
      }
    }, 1000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [duration, data.price]);

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
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

      <div className="flex-1 w-full min-h-0" ref={chartContainerRef} />
    </div>
  );
}
