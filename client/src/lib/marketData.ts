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
  category: '가상자산' | '외환' | '원자재' | '지수';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC/USDT', name: '비트코인', price: 98450.00, change: 1250.00, changePercent: 1.28, high: 99000.00, low: 97500.00, volume: 45000, category: '가상자산' },
  { symbol: 'ETH/USDT', name: '이더리움', price: 2750.50, change: -15.20, changePercent: -0.55, high: 2800.00, low: 2720.00, volume: 120000, category: '가상자산' },
  { symbol: 'USD/KRW', name: '미국 달러', price: 1432.50, change: 5.50, changePercent: 0.38, high: 1435.00, low: 1425.00, volume: 0, category: '외환' },
  { symbol: 'WTI', name: '크루드 오일', price: 72.45, change: -0.85, changePercent: -1.16, high: 73.50, low: 71.80, volume: 85000, category: '원자재' },
  { symbol: 'PAXG/USDT', name: '금 (Token)', price: 2045.80, change: 12.40, changePercent: 0.61, high: 2050.00, low: 2030.00, volume: 15000, category: '원자재' },
  { symbol: 'HSI', name: '항생 지수', price: 16540.00, change: -230.00, changePercent: -1.37, high: 16800.00, low: 16450.00, volume: 200000, category: '지수' },
];

// Hook to manage real-time data
export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Binance WebSocket for Crypto & Gold (PAXG)
    const symbols = ['btcusdt', 'ethusdt', 'paxgusdt'];
    const streams = symbols.map(s => `${s}@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // msg format: { s: 'BTCUSDT', c: 'price', p: 'change', P: 'changePercent', h: 'high', l: 'low', v: 'volume' }
      
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

    // 2. Polling for USD/KRW (Free public API)
    const fetchForex = async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const json = await res.json();
        const krwRate = json.rates.KRW;
        
        setData(prev => prev.map(item => {
          if (item.symbol === 'USD/KRW') {
            const change = (Math.random() - 0.5) * 0.5; // Simulate small ticks between polls
            return {
              ...item,
              price: krwRate + change,
              change: change,
              changePercent: (change / krwRate) * 100,
              high: krwRate + 5,
              low: krwRate - 5,
            };
          }
          return item;
        }));
      } catch (e) {
        console.error("Forex API Error", e);
      }
    };

    // 3. Simulation for Oil & HSI (No free public WebSocket available without key)
    const simulateOthers = () => {
      setData(prev => prev.map(item => {
        if (['WTI', 'HSI'].includes(item.symbol)) {
          const volatility = item.symbol === 'HSI' ? 0.0005 : 0.002;
          const change = item.price * volatility * (Math.random() - 0.5);
          const newPrice = item.price + change;
          return {
            ...item,
            price: newPrice,
            change: item.change + change,
            changePercent: ((item.change + change) / (item.price - item.change)) * 100
          };
        }
        return item;
      }));
    };

    fetchForex();
    const forexInterval = setInterval(fetchForex, 10000); // 10s polling for forex
    const simInterval = setInterval(simulateOthers, 1000); // 1s sim for others

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(forexInterval);
      clearInterval(simInterval);
    };
  }, []);

  return data;
}

// Helper for chart generation (mock history)
export function generateCandleData(currentPrice: number, count: number = 50) {
  const data = [];
  let current = currentPrice;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000 * 15); 
    const open = current;
    const close = open * (1 + (Math.random() - 0.5) * 0.002);
    const high = Math.max(open, close) * (1 + Math.random() * 0.001);
    const low = Math.min(open, close) * (1 - Math.random() * 0.001);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      close,
      high,
      low,
      volume: Math.floor(Math.random() * 1000)
    });
    current = close;
  }
  return data;
}
