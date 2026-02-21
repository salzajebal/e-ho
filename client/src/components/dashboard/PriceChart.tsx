import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";
import { FOREX_DISPLAY, type ForexSymbol } from "@/lib/tradingGames";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

const KST_OFFSET = 9 * 60 * 60;

function getKSTAlignedTime(intervalSeconds: number): number {
  const now = Math.floor(Date.now() / 1000) + KST_OFFSET;
  return Math.floor(now / intervalSeconds) * intervalSeconds;
}

async function fetchServerCandles(symbol: string, duration: number): Promise<CandlestickData<Time>[]> {
  try {
    const response = await fetch(`/api/market/candles/${symbol}?duration=${duration}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.candles || data.candles.length === 0) return [];
    
    return data.candles.map((c: any) => ({
      time: (c.time + KST_OFFSET) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  } catch (error) {
    console.warn('[PriceChart] Failed to fetch candles from server:', error);
    return [];
  }
}

function generateFallbackCandles(basePrice: number, count: number, intervalSeconds: number): CandlestickData<Time>[] {
  const alignedNow = getKSTAlignedTime(intervalSeconds);
  const volatility = basePrice > 100 ? 0.0005 : 0.0008;
  
  let price = basePrice;
  const tempCandles: CandlestickData<Time>[] = [];
  
  for (let i = 0; i < count; i++) {
    const time = (alignedNow - i * intervalSeconds) as Time;
    const change = price * volatility * (Math.random() - 0.5) * 2;
    const open = price - change;
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.0003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0003);
    tempCandles.unshift({ time, open, high, low, close });
    price = open;
  }
  
  return tempCandles;
}

function getDecimalPlaces(symbol: string): number {
  if (symbol === 'JPY') return 3;
  return 5;
}

function PriceChartComponent({ symbol, data, duration = 60 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceRef = useRef(data.price);
  const lastBarRef = useRef<CandlestickData<Time> | null>(null);
  const basePriceRef = useRef<number>(0);
  const currentStartRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  const durationMinutes = duration / 60;
  const isUp = data.change >= 0;
  const displayInfo = FOREX_DISPLAY[symbol as ForexSymbol];
  const decimals = getDecimalPlaces(symbol);

  useEffect(() => {
    if (data.price > 0) {
      priceRef.current = data.price;
      
      if (seriesRef.current && lastBarRef.current && isInitialized) {
        const newStart = getKSTAlignedTime(duration);
        
        if (newStart > currentStartRef.current) {
          currentStartRef.current = newStart;
          lastBarRef.current = { 
            time: newStart as Time, 
            open: data.price, 
            high: data.price, 
            low: data.price, 
            close: data.price 
          };
        } else {
          lastBarRef.current = {
            ...lastBarRef.current,
            high: Math.max(lastBarRef.current.high, data.price),
            low: Math.min(lastBarRef.current.low, data.price),
            close: data.price,
          };
        }
        
        try { 
          seriesRef.current.update(lastBarRef.current); 
        } catch {}
      }
    }
  }, [data.price, duration, isInitialized]);

  useEffect(() => {
    setIsInitialized(false);
    lastBarRef.current = null;
    basePriceRef.current = 0;
    currentStartRef.current = 0;
  }, [symbol, duration]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#505050', width: 1, style: 0, labelBackgroundColor: '#363a45' },
        horzLine: { color: '#505050', width: 1, style: 0, labelBackgroundColor: '#363a45' },
      },
      rightPriceScale: {
        borderColor: '#1e222d',
        scaleMargins: { top: 0.2, bottom: 0.2 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#1e222d',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          const hours = date.getUTCHours().toString().padStart(2, '0');
          const minutes = date.getUTCMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const series = (chart as any).addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        chartRef.current.timeScale().fitContent();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    setTimeout(() => {
      resize();
      setIsReady(true);
    }, 50);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setIsReady(false);
    };
  }, [symbol, duration, chartKey]);

  useEffect(() => {
    if (!seriesRef.current || !isReady) return;
    if (basePriceRef.current !== 0) return;
    
    const initializeChart = async () => {
      if (!seriesRef.current) return;
      
      let candles = await fetchServerCandles(symbol, duration);
      
      if (candles.length === 0 && data.price > 0) {
        candles = generateFallbackCandles(data.price, 50, duration);
      }
      
      if (candles.length > 0 && seriesRef.current) {
        seriesRef.current.setData(candles);
        
        const lastCandle = candles[candles.length - 1];
        lastBarRef.current = { ...lastCandle };
        basePriceRef.current = lastCandle.close;
        currentStartRef.current = lastCandle.time as number;
        
        chartRef.current?.timeScale().fitContent();
        setIsInitialized(true);
        console.log(`[PriceChart] ${symbol} 차트 초기화 완료: ${candles.length}개 캔들`);
      }
    };
    
    initializeChart();
  }, [symbol, isReady, duration, data.price]);

  useEffect(() => {
    if (!seriesRef.current || !isReady || !isInitialized) return;

    const tick = setInterval(() => {
      if (!seriesRef.current || !lastBarRef.current) return;

      const p = priceRef.current;
      if (p <= 0) return;

      const newStart = getKSTAlignedTime(duration);

      if (newStart > currentStartRef.current) {
        currentStartRef.current = newStart;
        lastBarRef.current = { 
          time: newStart as Time, 
          open: p, 
          high: p, 
          low: p, 
          close: p 
        };
      } else {
        lastBarRef.current = {
          ...lastBarRef.current,
          high: Math.max(lastBarRef.current.high, p),
          low: Math.min(lastBarRef.current.low, p),
          close: p,
        };
      }

      try { 
        seriesRef.current.update(lastBarRef.current); 
      } catch {}
    }, 100);

    return () => clearInterval(tick);
  }, [duration, isReady, isInitialized]);

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }} data-testid="chart-container">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e222d] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">{displayInfo?.pair || symbol}</span>
          <span className="text-xs text-gray-400">FX</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {data.price.toFixed(decimals)}
          </span>
          <span className={`text-sm ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {isUp ? '+' : ''}{data.change.toFixed(decimals)} ({isUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </span>
          <span className="bg-[#ef5350] text-white text-xs px-2 py-0.5 rounded font-semibold">
            {durationMinutes}분봉
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e222d] text-xs text-gray-400 shrink-0">
        <span className="text-blue-400">{durationMinutes}분</span>
        <span>|</span>
        <span>서버 동기화 (KST)</span>
        {!isInitialized && <span className="text-yellow-500 ml-2">로딩중...</span>}
      </div>

      <div 
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{ width: '100%' }}
      />
    </div>
  );
}

export const PriceChart = PriceChartComponent;
