import { useEffect, useRef, memo, useState } from "react";
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

  const durationMinutes = duration / 60;

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
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

    // Generate initial candle data based on current price
    generateInitialCandles(currentPrice, duration);

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
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, duration]);

  // Generate initial candle data
  const generateInitialCandles = (basePrice: number, candleDuration: number) => {
    if (!candleSeriesRef.current) return;

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
    
    candleSeriesRef.current.setData(candles);
    setLastCandle(candles[candles.length - 1]);
    
    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  // Update candle with real-time price
  useEffect(() => {
    if (!candleSeriesRef.current || !lastCandle || currentPrice <= 0) return;

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const currentTimestamp = Math.floor(kstNow.getTime() / 1000);
    
    const candleStartTime = Math.floor(currentTimestamp / duration) * duration;
    const lastCandleTime = lastCandle.time as number;
    
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
    if (candleSeriesRef.current) {
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
