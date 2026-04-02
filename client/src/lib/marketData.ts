import { useState, useEffect, useRef } from 'react';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  category: '통화';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'SP500', name: 'S&P500', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, category: '통화' },
  { symbol: 'DOW', name: '다우존스', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, category: '통화' },
  { symbol: 'DXY', name: '달러(DXY)', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, category: '통화' },
];

export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const updateCounter = useRef(0);

  useEffect(() => {
    const fetchFromServerApi = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/market/prices', {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (!result.prices || result.prices.length === 0) return;

        updateCounter.current++;
        
        const newData = result.prices.map((apiPrice: any) => {
          const existing = INITIAL_MARKET_DATA.find(m => m.symbol === apiPrice.symbol);
          return {
            symbol: apiPrice.symbol,
            name: existing?.name || apiPrice.symbol,
            price: apiPrice.price,
            change: apiPrice.change,
            changePercent: apiPrice.changePercent,
            high: apiPrice.high,
            low: apiPrice.low,
            volume: 0,
            category: '통화' as const,
          };
        });
        
        if (updateCounter.current <= 3 || updateCounter.current % 30 === 0) {
          console.log('[MarketData] Updated:', newData.map((d: MarketData) => `${d.symbol}: ${d.price}`).join(', '));
        }
        
        setData(newData);
      } catch (error) {
        // Silently handle errors
      }
    };

    fetchFromServerApi();
    const apiInterval = setInterval(fetchFromServerApi, 1000);

    return () => {
      clearInterval(apiInterval);
    };
  }, []);

  return data;
}

function generateInitialChartData(price: number, count: number = 60): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let current = price * 0.999;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000);
    const volatility = 0.0005;
    const change = current * volatility * (Math.random() - 0.5) * 2;
    const close = current + change;
    
    data.push({
      time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      close: close,
      timestamp: time.getTime()
    });
    current = close;
  }
  return data;
}

interface ChartDataPoint {
  time: string;
  close: number;
  timestamp: number;
}

export function useChartData(symbol: string, currentPrice: number): ChartDataPoint[] {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(() => 
    generateInitialChartData(currentPrice)
  );
  const lastSymbolRef = useRef<string>(symbol);
  const lastPriceRef = useRef<number>(currentPrice);

  useEffect(() => {
    if (symbol !== lastSymbolRef.current) {
      setChartData(generateInitialChartData(currentPrice));
      lastSymbolRef.current = symbol;
    }
  }, [symbol, currentPrice]);

  useEffect(() => {
    lastPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return generateInitialChartData(lastPriceRef.current);
        
        const now = new Date();
        const lastPoint = prev[prev.length - 1];
        const timeDiff = now.getTime() - lastPoint.timestamp;
        
        if (timeDiff >= 60000) {
          const newPoint: ChartDataPoint = {
            time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            close: lastPriceRef.current,
            timestamp: now.getTime()
          };
          return [...prev.slice(1), newPoint];
        } else {
          const updatedLast = { ...lastPoint, close: lastPriceRef.current };
          return [...prev.slice(0, -1), updatedLast];
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return chartData;
}

export function generateCandleData(currentPrice: number, count: number = 50) {
  const data = [];
  let current = currentPrice * 0.999;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000);
    const volatility = 0.0003;
    const change = current * volatility * (Math.random() - 0.5) * 2;
    const close = current + change;
    
    data.push({
      time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      open: current,
      close: close,
      high: Math.max(current, close) * 1.0001,
      low: Math.min(current, close) * 0.9999,
      volume: Math.floor(Math.random() * 1000)
    });
    current = close;
  }
  return data;
}
