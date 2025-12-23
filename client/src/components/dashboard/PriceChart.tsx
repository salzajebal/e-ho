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

  const durationMinutes = duration / 60;

  // Generate initial candle data
  const generateInitialCandles = useCallback((basePrice: number, candleDuration: number, series: any) => {
    if (!series || basePrice <= 0) return;

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    
    const candles: CandlestickData<Time>[] = [];
    const candleCount = 50;
    
    let price = basePrice * (0.995 + Math.random() * 0.01);
    
    for (let i = candleCount - 1; i >= 0; i--) {
      const candleTime = new Date(kstNow.getTime() - (i * candleDuration * 1000));
      const timestamp = Math.floor(candleTime.getTime() / 1000) as Time;
      
      const volatility = basePrice * 0.001;
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
    
    // Set last candle close to current price
    if (candles.length > 0) {
      const lastIdx = candles.length - 1;
      candles[lastIdx].close = basePrice;
      candles[lastIdx].high = Math.max(candles[lastIdx].high, basePrice);
      candles[lastIdx].low = Math.min(candles[lastIdx].low, basePrice);
    }
    
    try {
      series.setData(candles);
      setLastCandle(candles[candles.length - 1]);
    } catch (e) {
      console.error('Error setting chart data:', e);
    }
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Reset state
    setChartReady(false);
    setLastCandle(null);
    initPriceRef.current = 0;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    setChartReady(true);

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }
    };
  }, [symbol, duration]);

  // Generate candles when chart is ready and we have a valid price
  useEffect(() => {
    if (chartReady && candleSeriesRef.current && currentPrice > 0 && initPriceRef.current === 0) {
      initPriceRef.current = currentPrice;
      generateInitialCandles(currentPrice, duration, candleSeriesRef.current);
      
      // Fit content after data is set
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [chartReady, currentPrice, duration, generateInitialCandles]);

  // Update candle with real-time price
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
        // New candle
        const newCandle: CandlestickData<Time> = {
          time: candleStartTime as Time,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        };
        candleSeriesRef.current.update(newCandle);
        setLastCandle(newCandle);
      } else {
        // Update current candle
        const updatedCandle: CandlestickData<Time> = {
          ...lastCandle,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          close: currentPrice,
        };
        candleSeriesRef.current.update(updatedCandle);
        setLastCandle(updatedCandle);
      }

      // Update price line
      if (priceLineRef.current) {
        candleSeriesRef.current.removePriceLine(priceLineRef.current);
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
      // Ignore errors during updates
    }
  }, [currentPrice, duration, lastCandle]);

  const isUp = lastCandle ? lastCandle.close >= lastCandle.open : true;

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#131722' }} data-testid="chart-container">
      {/* Price Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e222d] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">{symbol}</span>
          <span className="text-xs text-gray-400">지수</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="bg-[#ef5350] text-white text-xs px-2 py-0.5 rounded font-semibold">
            {durationMinutes}분봉
          </span>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
