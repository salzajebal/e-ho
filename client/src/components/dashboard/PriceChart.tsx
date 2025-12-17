import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
}

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '1d';

const timeFrameLabels: Record<TimeFrame, string> = {
  '1m': '1분',
  '5m': '5분',
  '15m': '15분',
  '1h': '1시간',
  '1d': '1일'
};

function generateCandleData(basePrice: number, count: number, intervalMinutes: number): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  let currentPrice = basePrice * 0.995;
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = intervalMinutes * 60;

  for (let i = count - 1; i >= 0; i--) {
    const time = (now - i * intervalSeconds) as Time;
    const volatility = 0.003;
    
    const open = currentPrice;
    const change = open * volatility * (Math.random() - 0.5) * 2;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.002);
    const low = Math.min(open, close) * (1 - Math.random() * 0.002);

    data.push({ time, open, high, low, close });
    currentPrice = close;
  }

  return data;
}

export function PriceChart({ symbol, data }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('5m');
  const lastSymbolRef = useRef<string>(symbol);
  const lastTimeFrameRef = useRef<TimeFrame>(timeFrame);
  const lastPriceRef = useRef<number>(data.price);

  const isPositive = data.change >= 0;

  const getIntervalMinutes = (tf: TimeFrame): number => {
    switch (tf) {
      case '1m': return 1;
      case '5m': return 5;
      case '15m': return 15;
      case '1h': return 60;
      case '1d': return 1440;
    }
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
          const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
          return kstDate.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    // v5 API: Use addSeries with CandlestickSeries
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderDownColor: '#F6465D',
      borderUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
    });

    // Set initial data
    const initialData = generateCandleData(data.price, 100, getIntervalMinutes(timeFrame));
    candlestickSeries.setData(initialData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

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

  // Update chart when symbol or timeframe changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    if (symbol !== lastSymbolRef.current || timeFrame !== lastTimeFrameRef.current) {
      const newData = generateCandleData(data.price, 100, getIntervalMinutes(timeFrame));
      seriesRef.current.setData(newData);
      chartRef.current.timeScale().fitContent();
      lastSymbolRef.current = symbol;
      lastTimeFrameRef.current = timeFrame;
    }
  }, [symbol, timeFrame, data.price]);

  // Track current candle state
  const currentCandleRef = useRef<CandlestickData<Time> | null>(null);
  const intervalStartRef = useRef<number>(0);

  // Update chart immediately when price changes
  useEffect(() => {
    if (!seriesRef.current || data.price === 0) return;
    
    lastPriceRef.current = data.price;
    
    const intervalMs = getIntervalMinutes(timeFrame) * 60 * 1000;
    const now = Date.now();
    const currentIntervalStart = Math.floor(now / intervalMs) * intervalMs / 1000;
    
    // Check if we need to start a new candle
    if (currentIntervalStart > intervalStartRef.current) {
      // New candle period
      intervalStartRef.current = currentIntervalStart;
      currentCandleRef.current = {
        time: currentIntervalStart as Time,
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
    } else {
      // Initialize first candle
      intervalStartRef.current = currentIntervalStart;
      currentCandleRef.current = {
        time: currentIntervalStart as Time,
        open: data.price,
        high: data.price,
        low: data.price,
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
  }, [data.price, timeFrame]);

  // Periodic check for new candle periods (in case price doesn't change)
  useEffect(() => {
    if (!seriesRef.current) return;

    const intervalMs = getIntervalMinutes(timeFrame) * 60 * 1000;
    
    const checkInterval = setInterval(() => {
      if (!seriesRef.current || !currentCandleRef.current) return;
      
      const now = Date.now();
      const currentIntervalStart = Math.floor(now / intervalMs) * intervalMs / 1000;
      
      if (currentIntervalStart > intervalStartRef.current) {
        // New candle period - create new candle with last known price
        intervalStartRef.current = currentIntervalStart;
        currentCandleRef.current = {
          time: currentIntervalStart as Time,
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
  }, [timeFrame, symbol]);

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{data.category}</span>
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

        <div className="ml-auto flex gap-1 text-xs font-medium">
          {(Object.keys(timeFrameLabels) as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              data-testid={`timeframe-${tf}`}
              className={`px-2 py-1 rounded transition-all ${
                timeFrame === tf
                  ? 'text-primary bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {timeFrameLabels[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* TradingView Lightweight Chart */}
      <div className="flex-1 w-full min-h-0" ref={chartContainerRef} />
    </div>
  );
}
