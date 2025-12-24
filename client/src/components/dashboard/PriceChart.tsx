import { useEffect, useRef, memo, useState, useCallback } from "react";
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";

interface PriceChartProps {
  symbol: string;
  duration?: number;
  currentPrice: number;
}

function PriceChartComponent({ symbol, duration = 60, currentPrice }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const [lastCandle, setLastCandle] = useState<CandlestickData<Time> | null>(null);
  const priceLineRef = useRef<any>(null);
  const [chartReady, setChartReady] = useState(false);
  const initPriceRef = useRef<number>(0);
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const durationMinutes = duration / 60;
  const symbolName = symbol === 'NDX' ? '나스닥 100 인덱스' : symbol === 'GOLD' ? '골드 스팟' : symbol;

  const generateInitialCandles = useCallback((basePrice: number, candleDuration: number, series: any, chart: IChartApi) => {
    if (!series || !chart || basePrice <= 0) return;

    // Use UTC timestamp (lightweight-charts expects UTC)
    const now = Math.floor(Date.now() / 1000);
    const currentCandleTime = Math.floor(now / candleDuration) * candleDuration;
    
    const candles: CandlestickData<Time>[] = [];
    const candleCount = 100;
    
    // Generate continuous candles with realistic price movement
    let prevClose = basePrice;
    
    for (let i = candleCount - 1; i >= 0; i--) {
      const candleTime = (currentCandleTime - (i * candleDuration)) as Time;
      
      // Realistic price variation
      const volatility = basePrice * 0.0003;
      const trend = (Math.random() - 0.5) * volatility * 2;
      
      const open = prevClose;
      const close = open + trend;
      const wickSize = Math.abs(trend) * 0.5 + volatility * Math.random();
      const high = Math.max(open, close) + wickSize;
      const low = Math.min(open, close) - wickSize;
      
      candles.push({
        time: candleTime,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      });
      
      prevClose = close;
    }
    
    // Adjust last candle to match current price
    if (candles.length > 0) {
      const lastIdx = candles.length - 1;
      const lastOpen = candles[lastIdx].open;
      candles[lastIdx].close = basePrice;
      candles[lastIdx].high = Math.max(candles[lastIdx].high, basePrice);
      candles[lastIdx].low = Math.min(candles[lastIdx].low, basePrice);
      
      setOhlc({
        open: lastOpen,
        high: candles[lastIdx].high,
        low: candles[lastIdx].low,
        close: basePrice,
      });
    }
    
    try {
      series.setData(candles);
      setLastCandle(candles[candles.length - 1]);
      
      // Scroll to show recent candles
      chart.timeScale().scrollToRealTime();
    } catch (e) {
      try { chart.timeScale().fitContent(); } catch (err) {}
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || containerSize.width === 0 || containerSize.height === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    }

    setChartReady(false);
    setLastCandle(null);
    initPriceRef.current = 0;

    const chart = createChart(containerRef.current, {
      width: containerSize.width,
      height: containerSize.height,
      layout: {
        background: { color: '#131722' },
        textColor: '#B2B5BE',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1e222d', style: 0 },
        horzLines: { color: '#1e222d', style: 0 },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 0,
          labelBackgroundColor: '#2A2E39',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 0,
          labelBackgroundColor: '#2A2E39',
        },
      },
      rightPriceScale: {
        borderColor: '#1e222d',
        scaleMargins: { top: 0.1, bottom: 0.1 },
        borderVisible: true,
        textColor: '#B2B5BE',
      },
      timeScale: {
        borderColor: '#1e222d',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 4,
        fixLeftEdge: false,
        fixRightEdge: true,
        borderVisible: true,
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (time: number) => {
          // Convert UTC to KST (UTC+9) for display
          const date = new Date((time + 9 * 60 * 60) * 1000);
          const hours = date.getUTCHours().toString().padStart(2, '0');
          const minutes = date.getUTCMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26A69A',
      downColor: '#EF5350',
      borderUpColor: '#26A69A',
      borderDownColor: '#EF5350',
      wickUpColor: '#26A69A',
      wickDownColor: '#EF5350',
      borderVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    setChartReady(true);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }
    };
  }, [symbol, duration, containerSize.width, containerSize.height]);

  useEffect(() => {
    if (chartRef.current && containerSize.width > 0 && containerSize.height > 0) {
      chartRef.current.applyOptions({
        width: containerSize.width,
        height: containerSize.height,
      });
    }
  }, [containerSize]);

  useEffect(() => {
    if (chartReady && candleSeriesRef.current && chartRef.current && currentPrice > 0 && initPriceRef.current === 0) {
      initPriceRef.current = currentPrice;
      generateInitialCandles(currentPrice, duration, candleSeriesRef.current, chartRef.current);
    }
  }, [chartReady, currentPrice, duration, generateInitialCandles]);

  useEffect(() => {
    if (!candleSeriesRef.current || !lastCandle || currentPrice <= 0) return;

    // Use UTC timestamp (same as initial candle generation)
    const now = Math.floor(Date.now() / 1000);
    const candleStartTime = Math.floor(now / duration) * duration;
    const lastCandleTime = lastCandle.time as number;
    
    try {
      if (candleStartTime > lastCandleTime) {
        const newCandle: CandlestickData<Time> = {
          time: candleStartTime as Time,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        };
        candleSeriesRef.current.update(newCandle);
        setLastCandle(newCandle);
        setOhlc({ open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice });
      } else {
        const updatedCandle: CandlestickData<Time> = {
          ...lastCandle,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          close: currentPrice,
        };
        candleSeriesRef.current.update(updatedCandle);
        setLastCandle(updatedCandle);
        setOhlc({
          open: updatedCandle.open,
          high: updatedCandle.high,
          low: updatedCandle.low,
          close: updatedCandle.close,
        });
      }

      if (priceLineRef.current) {
        try { candleSeriesRef.current.removePriceLine(priceLineRef.current); } catch (e) {}
      }
      priceLineRef.current = candleSeriesRef.current.createPriceLine({
        price: currentPrice,
        color: '#2962FF',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '',
      });
    } catch (e) {}
  }, [currentPrice, duration, lastCandle]);

  const isUp = ohlc.close >= ohlc.open;
  const priceChange = currentPrice - ohlc.open;
  const priceChangePercent = ohlc.open > 0 ? (priceChange / ohlc.open) * 100 : 0;

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }} data-testid="chart-container">
      {/* TradingView Header - Top Bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#2A2E39]" style={{ backgroundColor: '#1E222D' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{symbol}</span>
          <span className="text-[#787B86] text-xs">지수</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold ${isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs ${isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>
            {isUp ? '+' : ''}{priceChange.toFixed(2)} ({isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </span>
          <div className="ml-2 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#2962FF', color: 'white' }}>
            {durationMinutes}분봉
          </div>
        </div>
      </div>

      {/* TradingView Symbol Info Bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#2A2E39]" style={{ backgroundColor: '#131722' }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F7931A' }}></div>
          <span className="text-[#B2B5BE] text-xs">{symbolName}</span>
          <span className="text-[#787B86] text-xs">• {durationMinutes} •</span>
          <span className="text-[#787B86] text-xs">{symbol === 'NDX' ? 'NASDAQ' : 'FOREX'}</span>
        </div>
        <div className="flex items-center gap-3 ml-4 text-xs">
          <span className="text-[#787B86]">시</span>
          <span className={isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}>
            {ohlc.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#787B86]">고</span>
          <span className={isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}>
            {ohlc.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#787B86]">저</span>
          <span className={isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}>
            {ohlc.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#787B86]">종</span>
          <span className={isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}>
            {ohlc.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`ml-1 ${isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>
            {isUp ? '+' : ''}{(ohlc.close - ohlc.open).toFixed(2)} ({isUp ? '+' : ''}{((ohlc.close - ohlc.open) / ohlc.open * 100).toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {/* TradingView Logo */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-[#363A45]">
          <svg width="20" height="20" viewBox="0 0 36 28" fill="currentColor">
            <path d="M14 22H7V6h7v16zm8 0h-7V2h7v20zm8 0h-7v-8h7v8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
