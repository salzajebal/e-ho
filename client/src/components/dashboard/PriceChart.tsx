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

  const generateInitialCandles = useCallback((basePrice: number, candleDuration: number, series: any) => {
    if (!series || basePrice <= 0) return;

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    
    const candles: CandlestickData<Time>[] = [];
    const candleCount = 100;
    
    let price = basePrice * (0.995 + Math.random() * 0.01);
    
    for (let i = candleCount - 1; i >= 0; i--) {
      const candleTime = new Date(kstNow.getTime() - (i * candleDuration * 1000));
      const timestamp = Math.floor(candleTime.getTime() / 1000) as Time;
      
      const volatility = basePrice * 0.0008;
      const open = price;
      const change = (Math.random() - 0.5) * 2 * volatility;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      candles.push({
        time: timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      });
      
      price = close;
    }
    
    if (candles.length > 0) {
      const lastIdx = candles.length - 1;
      candles[lastIdx].close = basePrice;
      candles[lastIdx].high = Math.max(candles[lastIdx].high, basePrice);
      candles[lastIdx].low = Math.min(candles[lastIdx].low, basePrice);
      setOhlc({
        open: candles[lastIdx].open,
        high: candles[lastIdx].high,
        low: candles[lastIdx].low,
        close: candles[lastIdx].close,
      });
    }
    
    try {
      series.setData(candles);
      setLastCandle(candles[candles.length - 1]);
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Observe container size changes
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

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Create chart when container has valid size
  useEffect(() => {
    if (!containerRef.current || containerSize.width === 0 || containerSize.height === 0) return;

    // Cleanup existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    }

    // Reset state
    setChartReady(false);
    setLastCandle(null);
    initPriceRef.current = 0;

    const chart = createChart(containerRef.current, {
      width: containerSize.width,
      height: containerSize.height,
      layout: {
        background: { color: '#131722' },
        textColor: '#787b86',
        fontFamily: "'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { 
          color: 'rgba(42, 46, 57, 0.6)',
          style: 1,
        },
        horzLines: { 
          color: 'rgba(42, 46, 57, 0.6)',
          style: 1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(152, 157, 174, 0.6)',
          width: 1,
          style: 0,
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          color: 'rgba(152, 157, 174, 0.6)',
          width: 1,
          style: 0,
          labelBackgroundColor: '#2a2e39',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.08,
        },
        borderVisible: true,
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 8,
        minBarSpacing: 4,
        fixLeftEdge: false,
        fixRightEdge: false,
        borderVisible: true,
      },
      localization: {
        locale: 'ko-KR',
        dateFormat: 'yyyy-MM-dd',
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      borderVisible: true,
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

  // Resize chart when container size changes
  useEffect(() => {
    if (chartRef.current && containerSize.width > 0 && containerSize.height > 0) {
      chartRef.current.applyOptions({
        width: containerSize.width,
        height: containerSize.height,
      });
    }
  }, [containerSize]);

  // Initialize candles when chart is ready and price is available
  useEffect(() => {
    if (chartReady && candleSeriesRef.current && currentPrice > 0 && initPriceRef.current === 0) {
      initPriceRef.current = currentPrice;
      generateInitialCandles(currentPrice, duration, candleSeriesRef.current);
      
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [chartReady, currentPrice, duration, generateInitialCandles]);

  // Update candles with real-time price
  useEffect(() => {
    if (!candleSeriesRef.current || !lastCandle || currentPrice <= 0) return;

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const currentTimestamp = Math.floor(kstNow.getTime() / 1000);
    
    const candleStartTime = Math.floor(currentTimestamp / duration) * duration;
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
        setOhlc({
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        });
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
        try {
          candleSeriesRef.current.removePriceLine(priceLineRef.current);
        } catch (e) {
          // Ignore
        }
      }
      priceLineRef.current = candleSeriesRef.current.createPriceLine({
        price: currentPrice,
        color: '#2962FF',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '',
      });
    } catch (e) {
      // Ignore errors
    }
  }, [currentPrice, duration, lastCandle]);

  const isUp = ohlc.close >= ohlc.open;
  const change = ohlc.close - ohlc.open;
  const changePercent = ohlc.open > 0 ? (change / ohlc.open) * 100 : 0;

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }} data-testid="chart-container">
      {/* TradingView Style Header */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-[#2a2e39] shrink-0">
        {/* Symbol Info */}
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">{symbol}</span>
          <span className="text-[#787b86] text-xs">• {durationMinutes}분</span>
        </div>
        
        {/* OHLC Values */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[#787b86]">O</span>
            <span className={isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {ohlc.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#787b86]">H</span>
            <span className={isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {ohlc.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#787b86]">L</span>
            <span className={isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {ohlc.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#787b86]">C</span>
            <span className={isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {ohlc.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Price Change */}
        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-lg font-semibold ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0" />
      
      {/* TradingView Style Footer */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-[#2a2e39] text-[10px] text-[#787b86] shrink-0">
        <div className="flex items-center gap-3">
          <span>UTC+9</span>
          <span>•</span>
          <span>{durationMinutes}분봉</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#26a69a]">▲</span>
          <span>실시간</span>
        </div>
      </div>
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
