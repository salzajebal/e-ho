import { useEffect, useRef, useState, memo } from "react";
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

function generateInitialCandles(basePrice: number, count: number, intervalSeconds: number): CandlestickData<Time>[] {
  const candles: CandlestickData<Time>[] = [];
  const now = Math.floor(Date.now() / 1000);
  const alignedNow = Math.floor(now / intervalSeconds) * intervalSeconds;
  
  const volatility = 0.0008 * Math.sqrt(intervalSeconds / 60);
  
  let price = basePrice;
  const tempCandles: CandlestickData<Time>[] = [];
  
  for (let i = 0; i < count; i++) {
    const time = (alignedNow - i * intervalSeconds) as Time;
    const close = price;
    const change = close * volatility * (Math.random() - 0.5) * 2;
    const open = close - change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.3);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.3);
    tempCandles.unshift({ time, open, high, low, close });
    price = open;
  }
  
  return tempCandles;
}

function PriceChartComponent({ symbol, data, duration = 60 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceRef = useRef(data.price);
  const candleRef = useRef<CandlestickData<Time> | null>(null);
  const [isReady, setIsReady] = useState(false);

  const durationMinutes = duration / 60;
  const isUp = data.change >= 0;

  useEffect(() => {
    priceRef.current = data.price;
  }, [data.price]);

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
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1e222d',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: 'ko-KR',
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

    const candles = generateInitialCandles(data.price, 100, duration);
    series.setData(candles);
    if (candles.length > 0) {
      candleRef.current = { ...candles[candles.length - 1] };
    }

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
  }, [symbol, duration]);

  useEffect(() => {
    if (!seriesRef.current || !isReady) return;

    const getAlignedTime = () => {
      const now = Math.floor(Date.now() / 1000);
      return Math.floor(now / duration) * duration;
    };
    
    let currentStart = getAlignedTime();

    if (!candleRef.current) {
      candleRef.current = {
        time: currentStart as Time,
        open: priceRef.current,
        high: priceRef.current,
        low: priceRef.current,
        close: priceRef.current,
      };
    }

    const tick = setInterval(() => {
      if (!seriesRef.current || !candleRef.current) return;

      const newStart = getAlignedTime();
      const p = priceRef.current;

      if (newStart > currentStart) {
        currentStart = newStart;
        candleRef.current = { time: newStart as Time, open: p, high: p, low: p, close: p };
      } else {
        candleRef.current = {
          ...candleRef.current,
          high: Math.max(candleRef.current.high, p),
          low: Math.min(candleRef.current.low, p),
          close: p,
        };
      }

      try { seriesRef.current.update(candleRef.current); } catch {}
    }, 200);

    return () => clearInterval(tick);
  }, [duration, isReady]);

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }} data-testid="chart-container">
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

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e222d] text-xs text-gray-400 shrink-0">
        <span className="text-blue-400">{durationMinutes}분</span>
        <span>|</span>
        <span>서버 동기화</span>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{ width: '100%' }}
      />
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
