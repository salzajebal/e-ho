import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";

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

// Binance에서 실제 과거 캔들 데이터 가져오기
async function fetchBinanceKlines(symbol: string, intervalSeconds: number, limit: number = 100): Promise<CandlestickData<Time>[]> {
  try {
    // 초 단위를 Binance interval 형식으로 변환
    let interval = '1m';
    if (intervalSeconds === 60) interval = '1m';
    else if (intervalSeconds === 120) interval = '1m'; // 2분봉은 1분 데이터로 합성
    else if (intervalSeconds === 180) interval = '3m';
    else if (intervalSeconds === 300) interval = '5m';
    else if (intervalSeconds === 900) interval = '15m';
    else if (intervalSeconds === 1800) interval = '30m';
    else if (intervalSeconds === 3600) interval = '1h';
    
    const SYMBOL_TO_BINANCE: Record<string, string> = { USD: 'BTCUSDT', JPY: 'ETHUSDT', EUR: 'SOLUSDT', AUD: 'XRPUSDT', BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', XRP: 'XRPUSDT' };
    const binanceSymbol = SYMBOL_TO_BINANCE[symbol] || `${symbol}USDT`;
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch klines');
    
    const data = await response.json();
    
    // Binance kline 형식: [openTime, open, high, low, close, volume, closeTime, ...]
    const candles: CandlestickData<Time>[] = data.map((kline: any[]) => ({
      time: (Math.floor(kline[0] / 1000) + KST_OFFSET) as Time,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
    }));
    
    // 2분봉인 경우 1분 데이터를 합성
    if (intervalSeconds === 120 && candles.length > 1) {
      const merged: CandlestickData<Time>[] = [];
      for (let i = 0; i < candles.length - 1; i += 2) {
        const first = candles[i];
        const second = candles[i + 1] || first;
        merged.push({
          time: first.time,
          open: first.open,
          high: Math.max(first.high, second.high),
          low: Math.min(first.low, second.low),
          close: second.close,
        });
      }
      return merged;
    }
    
    return candles;
  } catch (error) {
    console.warn('[PriceChart] Failed to fetch Binance klines:', error);
    return [];
  }
}

// 폴백용 랜덤 캔들 생성 (Binance 호출 실패 시)
function generateFallbackCandles(basePrice: number, count: number, intervalSeconds: number): CandlestickData<Time>[] {
  const alignedNow = getKSTAlignedTime(intervalSeconds);
  const volatility = 0.002; // 더 현실적인 변동성
  
  let price = basePrice;
  const tempCandles: CandlestickData<Time>[] = [];
  
  for (let i = 0; i < count; i++) {
    const time = (alignedNow - i * intervalSeconds) as Time;
    const change = price * volatility * (Math.random() - 0.5) * 2;
    const open = price - change;
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.001);
    const low = Math.min(open, close) * (1 - Math.random() * 0.001);
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
  const lastBarRef = useRef<CandlestickData<Time> | null>(null);
  const basePriceRef = useRef<number>(0);
  const currentStartRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  const durationMinutes = duration / 60;
  const isUp = data.change >= 0;

  useEffect(() => {
    if (data.price > 0) {
      const oldPrice = priceRef.current;
      priceRef.current = data.price;
      
      // 가격 변동 시 즉시 차트 업데이트
      if (seriesRef.current && lastBarRef.current && isInitialized) {
        const newStart = getKSTAlignedTime(duration);
        
        if (newStart > currentStartRef.current) {
          // 새로운 캔들 시작
          currentStartRef.current = newStart;
          lastBarRef.current = { 
            time: newStart as Time, 
            open: data.price, 
            high: data.price, 
            low: data.price, 
            close: data.price 
          };
        } else {
          // 현재 캔들 업데이트
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

  // 2% 임계값 리셋 로직 제거 - 실제 Binance 데이터 사용 시 불필요

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
    if (basePriceRef.current !== 0) return; // 이미 초기화됨
    
    // Binance에서 실제 과거 캔들 데이터 가져오기
    const initializeChart = async () => {
      if (!seriesRef.current) return;
      
      let candles = await fetchBinanceKlines(symbol, duration, 100);
      
      // Binance 호출 실패 시 폴백 데이터 사용
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
