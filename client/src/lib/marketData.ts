import { useState, useEffect, useRef, useMemo } from 'react';
import { INTERNAL_SYMBOL_MAP, type ForexSymbol } from './tradingGames';

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
  { symbol: 'USD', name: 'USD/KRW', price: 87500, change: 0, changePercent: 0, high: 89000, low: 86500, volume: 0, category: '통화' },
  { symbol: 'JPY', name: 'JPY/KRW', price: 2930, change: 0, changePercent: 0, high: 2980, low: 2890, volume: 0, category: '통화' },
  { symbol: 'EUR', name: 'EUR/KRW', price: 170, change: 0, changePercent: 0, high: 175, low: 165, volume: 0, category: '통화' },
  { symbol: 'AUD', name: 'AUD/KRW', price: 2.5, change: 0, changePercent: 0, high: 2.6, low: 2.4, volume: 0, category: '통화' },
];

async function fetchBinancePricesDirect(): Promise<{ btc: any; eth: any; sol: any; xrp: any } | null> {
  try {
    const [btcRes, ethRes, solRes, xrpRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT'),
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=XRPUSDT')
    ]);
    
    if (btcRes.ok && ethRes.ok && solRes.ok && xrpRes.ok) {
      const btc = await btcRes.json();
      const eth = await ethRes.json();
      const sol = await solRes.json();
      const xrp = await xrpRes.json();
      return { btc, eth, sol, xrp };
    }
    return null;
  } catch (error) {
    console.warn('[Binance Direct] API fetch error:', error);
    return null;
  }
}

function buildCoinData(symbol: string, name: string, coinData: any): MarketData {
  return {
    symbol,
    name,
    price: parseFloat(coinData.lastPrice),
    change: parseFloat(coinData.priceChange),
    changePercent: parseFloat(coinData.priceChangePercent),
    high: parseFloat(coinData.highPrice),
    low: parseFloat(coinData.lowPrice),
    volume: parseFloat(coinData.volume),
    category: '통화',
  };
}

function buildMarketDataFromBinance(btcData: any, ethData: any, solData: any, xrpData: any): MarketData[] {
  return [
    buildCoinData('USD', 'USD/KRW', btcData),
    buildCoinData('JPY', 'JPY/KRW', ethData),
    buildCoinData('EUR', 'EUR/KRW', solData),
    buildCoinData('AUD', 'AUD/KRW', xrpData),
  ];
}

export function useMarketData() {
  const [data, setData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const lastApiPrices = useRef<Record<string, { price: number; change: number; changePercent: number; high: number; low: number }>>({});
  const updateCounter = useRef(0);
  const useDirectBinance = useRef(false);

  useEffect(() => {
    const fetchFromBinanceDirect = async () => {
      const binanceData = await fetchBinancePricesDirect();
      if (binanceData) {
        updateCounter.current++;
        const newData = buildMarketDataFromBinance(binanceData.btc, binanceData.eth, binanceData.sol, binanceData.xrp);
        
        if (updateCounter.current <= 3 || updateCounter.current % 30 === 0) {
          console.log('[MarketData Direct] USD: $' + newData[0].price.toFixed(2) + ', JPY: $' + newData[1].price.toFixed(2));
        }
        
        setData(newData);
        return true;
      }
      return false;
    };

    const fetchFromServerApi = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('/api/market/prices', {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return false;
        
        const result = await response.json();
        
        if (!result.prices || result.prices.length === 0 || result.fallback === true) {
          return false;
        }

        updateCounter.current++;
        
        const newData = result.prices.map((apiPrice: any) => {
          lastApiPrices.current[apiPrice.symbol] = {
            price: apiPrice.price,
            change: apiPrice.change,
            changePercent: apiPrice.changePercent,
            high: apiPrice.high,
            low: apiPrice.low,
          };
          
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
          console.log('[MarketData Server] Updated prices:', newData.map((d: MarketData) => `${d.symbol}: $${d.price}`).join(', '));
        }
        
        setData(newData);
        return true;
      } catch (error) {
        return false;
      }
    };

    const fetchRealPrices = async () => {
      if (useDirectBinance.current) {
        await fetchFromBinanceDirect();
        return;
      }
      
      const serverSuccess = await fetchFromServerApi();
      
      if (!serverSuccess) {
        const directSuccess = await fetchFromBinanceDirect();
        if (directSuccess) {
          console.log('[MarketData] 서버 API 실패, Binance 직접 호출 모드로 전환');
          useDirectBinance.current = true;
        }
      }
    };

    fetchRealPrices();
    const apiInterval = setInterval(fetchRealPrices, 500);

    return () => {
      clearInterval(apiInterval);
    };
  }, []);

  return data;
}

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
