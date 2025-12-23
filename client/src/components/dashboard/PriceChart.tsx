import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

function getKSTTimestamp(): number {
  const now = new Date();
  const kstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return Math.floor(kstDate.getTime() / 1000);
}

function generateCandleData(basePrice: number, count: number, intervalSeconds: number): CandlestickData<Time>[] {
  const candles: CandlestickData<Time>[] = [];
  const kstNow = getKSTTimestamp();
  const alignedNow = Math.floor(kstNow / intervalSeconds) * intervalSeconds;
  
  let price = basePrice * 0.998;
  const volatility = 0.0015 * Math.sqrt(intervalSeconds / 60);

  for (let i = count - 1; i >= 0; i--) {
    const time = (alignedNow - i * intervalSeconds) as Time;
    const open = price;
    const change = open * volatility * (Math.random() - 0.5) * 2;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.3);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.3);
    candles.push({ time, open, high, low, close });
    price = close;
  }
  return candles;
}

export function PriceChart({ symbol, data, duration = 60 }: PriceChartProps) {
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
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
        },
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const candles = generateCandleData(data.price, 80, duration);
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

    const getAlignedKST = () => {
      const kstNow = getKSTTimestamp();
      return Math.floor(kstNow / duration) * duration;
    };
    
    let currentStart = getAlignedKST();

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

      const newStart = getAlignedKST();
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
    }, 500);

    return () => clearInterval(tick);
  }, [duration, isReady]);

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e222d]">
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

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e222d] text-xs text-gray-400">
        <span className="text-blue-400">{durationMinutes}분</span>
        <span>30분</span>
        <span>1시간</span>
        <span className="mx-2">|</span>
        <span>📊 지표</span>
      </div>

      <div className="flex items-center gap-4 px-3 py-1 border-b border-[#1e222d] text-xs">
        <span className="text-gray-500">나스닥 100 인덱스 · 1 · NASDAQ</span>
        <span className="text-gray-500">시</span>
        <span className="text-[#26a69a]">{(data.price - 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className="text-gray-500">고</span>
        <span className="text-[#26a69a]">{data.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className="text-gray-500">저</span>
        <span className="text-[#26a69a]">{data.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className="text-gray-500">종</span>
        <span className="text-[#26a69a]">{data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className={`${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
          {isUp ? '+' : ''}{data.change.toFixed(2)} ({isUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </span>
      </div>

      <div className="flex-1 relative min-h-0">
        <div ref={containerRef} className="absolute inset-0" data-testid="chart-container" />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[#2962ff] opacity-60 z-10">
          <svg width="16" height="16" viewBox="0 0 36 28" fill="currentColor">
            <path d="M14 22H7V6h7v16zm8-16h-7v16h7V6zm8 0h-7v16h7V6z"/>
          </svg>
          <span className="text-xs font-semibold">TradingView</span>
        </div>
      </div>
    </div>
  );
}
