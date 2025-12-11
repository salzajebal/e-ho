import { useState, useEffect, useRef, useMemo } from 'react';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  category: '가상자산' | '외환' | '원자재' | '지수';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC/USDT', name: '비트코인', price: 98450.00, change: 1250.00, changePercent: 1.28, high: 99000.00, low: 97500.00, volume: 45000, category: '가상자산' },
  { symbol: 'ETH/USDT', name: '이더리움', price: 2750.50, change: -15.20, changePercent: -0.55, high: 2800.00, low: 2720.00, volume: 120000, category: '가상자산' },
  { symbol: 'USD/KRW', name: '미국 달러', price: 1432.50, change: 5.50, changePercent: 0.38, high: 1435.00, low: 1425.00, volume: 0, category: '외환' },
  { symbol: 'XAU/USD', name: '금', price: 2650.00, change: 12.40, changePercent: 0.47, high: 2660.00, low: 2640.00, volume: 15000, category: '원자재' },
  { symbol: 'WTI', name: '크루드 오일', price: 71.50, change: -0.85, changePercent: -1.18, high: 72.50, low: 70.80, volume: 85000, category: '원자재' },
  { symbol: 'HSI', name: '항생 지수', price: 19800.00, change: -230.00, changePercent: -1.15, high: 20100.00, low: 19700.00, volume: 200000, category: '지수' },
];

// Hook to manage real-time data
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const wsRef = useRef<WebSocket | null>(null);
  const previousPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    // Initialize previous prices
    INITIAL_MARKET_DATA.forEach(item => {
      previousPrices.current[item.symbol] = item.price;
    });

    // 1. Binance WebSocket for Crypto (BTC, ETH)
    const cryptoSymbols = ['btcusdt', 'ethusdt'];
    const streams = cryptoSymbols.map(s => `${s}@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      setData(prev => prev.map(item => {
        const symbol = item.symbol.replace('/', '');
        if (symbol === msg.s) {
          return {
            ...item,
            price: parseFloat(msg.c),
            change: parseFloat(msg.p),
            changePercent: parseFloat(msg.P),
            high: parseFloat(msg.h),
            low: parseFloat(msg.l),
            volume: parseFloat(msg.v)
          };
        }
        return item;
      }));
    };

    wsRef.current = ws;

    // 2. Fetch USD/KRW from free API (Frankfurter - no API key required)
    const fetchForex = async () => {
      try {
        const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW');
        if (!res.ok) throw new Error('Forex API failed');
        const json = await res.json();
        const krwRate = json.rates.KRW;
        
        setData(prev => prev.map(item => {
          if (item.symbol === 'USD/KRW') {
            const prevPrice = previousPrices.current[item.symbol] || krwRate;
            const change = krwRate - prevPrice;
            previousPrices.current[item.symbol] = krwRate;
            return {
              ...item,
              price: krwRate,
              change: change,
              changePercent: (change / prevPrice) * 100,
              high: Math.max(item.high, krwRate),
              low: Math.min(item.low, krwRate),
            };
          }
          return item;
        }));
      } catch (e) {
        console.error("Forex API Error", e);
      }
    };

    // 3. Realistic simulation for Gold, Oil (WTI), and HSI
    const simulateMarkets = () => {
      setData(prev => prev.map(item => {
        if (['XAU/USD', 'WTI', 'HSI'].includes(item.symbol)) {
          // Use realistic volatility based on market type
          let volatility = 0.0005;
          if (item.symbol === 'WTI') volatility = 0.001;
          if (item.symbol === 'HSI') volatility = 0.0003;
          
          const basePrice = previousPrices.current[item.symbol] || item.price;
          const priceChange = basePrice * volatility * (Math.random() - 0.5) * 2;
          const newPrice = basePrice + priceChange;
          
          // Accumulate daily change
          const totalChange = item.change + priceChange;
          const openPrice = item.price - item.change;
          const changePercent = openPrice !== 0 ? (totalChange / openPrice) * 100 : 0;
          
          previousPrices.current[item.symbol] = newPrice;
          
          return {
            ...item,
            price: newPrice,
            change: totalChange,
            changePercent: changePercent,
            high: Math.max(item.high, newPrice),
            low: Math.min(item.low, newPrice),
          };
        }
        return item;
      }));
    };

    // Initial fetch
    fetchForex();

    // Set up intervals
    const forexInterval = setInterval(fetchForex, 30000); // 30s for forex
    const simInterval = setInterval(simulateMarkets, 1000); // 1s for simulated markets

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(forexInterval);
      clearInterval(simInterval);
    };
  }, []);

  return data;
}

// Generate initial chart data
function generateInitialChartData(price: number, count: number = 60): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let current = price * 0.995;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000);
    const volatility = 0.0015;
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

// Real-time chart data hook
export function useChartData(symbol: string, currentPrice: number): ChartDataPoint[] {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(() => 
    generateInitialChartData(currentPrice)
  );
  const lastSymbolRef = useRef<string>(symbol);
  const lastPriceRef = useRef<number>(currentPrice);

  // Reset chart data when symbol changes
  useEffect(() => {
    if (symbol !== lastSymbolRef.current) {
      setChartData(generateInitialChartData(currentPrice));
      lastSymbolRef.current = symbol;
    }
  }, [symbol, currentPrice]);

  // Update chart with live price
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
          // Add new data point every minute
          const newPoint: ChartDataPoint = {
            time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            close: lastPriceRef.current,
            timestamp: now.getTime()
          };
          return [...prev.slice(1), newPoint];
        } else {
          // Update last point with current price
          const updatedLast = { ...lastPoint, close: lastPriceRef.current };
          return [...prev.slice(0, -1), updatedLast];
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return chartData;
}

// Legacy function for backwards compatibility
export function generateCandleData(currentPrice: number, count: number = 50) {
  const data = [];
  let current = currentPrice * 0.995;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000);
    const volatility = 0.001;
    const change = current * volatility * (Math.random() - 0.5) * 2;
    const close = current + change;
    
    data.push({
      time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      open: current,
      close: close,
      high: Math.max(current, close) * 1.001,
      low: Math.min(current, close) * 0.999,
      volume: Math.floor(Math.random() * 1000)
    });
    current = close;
  }
  return data;
}
