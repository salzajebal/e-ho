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
  category: '암호화폐';
}

export const INITIAL_MARKET_DATA: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 87500, change: 0, changePercent: 0, high: 89000, low: 86500, volume: 0, category: '암호화폐' },
  { symbol: 'ETH', name: 'Ethereum', price: 2930, change: 0, changePercent: 0, high: 2980, low: 2890, volume: 0, category: '암호화폐' },
];

// 직접 Binance API에서 가격 가져오기 (프로덕션 환경에서 서버 우회)
async function fetchBinancePricesDirect(): Promise<{ btc: any; eth: any } | null> {
  try {
    const [btcRes, ethRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT')
    ]);
    
    if (btcRes.ok && ethRes.ok) {
      const btc = await btcRes.json();
      const eth = await ethRes.json();
      return { btc, eth };
    }
    return null;
  } catch (error) {
    console.warn('[Binance Direct] API fetch error:', error);
    return null;
  }
}

// Hook to manage real-time data with API integration
export function useMarketData(): { data: MarketData[]; isLoaded: boolean; isError: boolean } {
  const [data, setData] = useState<MarketData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const lastApiPrices = useRef<Record<string, { price: number; change: number; changePercent: number; high: number; low: number }>>({});
  const updateCounter = useRef(0);
  const useDirectBinance = useRef(false);
  const serverFailCount = useRef(0);
  const totalFailCount = useRef(0);

  useEffect(() => {
    // 직접 Binance API 호출 (프로덕션 환경 우회용)
    const fetchFromBinanceDirect = async () => {
      const binanceData = await fetchBinancePricesDirect();
      if (binanceData) {
        updateCounter.current++;
        
        const newData: MarketData[] = [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: parseFloat(binanceData.btc.lastPrice),
            change: parseFloat(binanceData.btc.priceChange),
            changePercent: parseFloat(binanceData.btc.priceChangePercent),
            high: parseFloat(binanceData.btc.highPrice),
            low: parseFloat(binanceData.btc.lowPrice),
            volume: parseFloat(binanceData.btc.volume),
            category: '암호화폐',
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: parseFloat(binanceData.eth.lastPrice),
            change: parseFloat(binanceData.eth.priceChange),
            changePercent: parseFloat(binanceData.eth.priceChangePercent),
            high: parseFloat(binanceData.eth.highPrice),
            low: parseFloat(binanceData.eth.lowPrice),
            volume: parseFloat(binanceData.eth.volume),
            category: '암호화폐',
          }
        ];
        
        if (updateCounter.current <= 3 || updateCounter.current % 30 === 0) {
          console.log('[MarketData Direct] BTC: $' + newData[0].price.toFixed(2) + ', ETH: $' + newData[1].price.toFixed(2));
        }
        
        setData(newData);
        setIsLoaded(true);
        setIsError(false);
        totalFailCount.current = 0;
        return true;
      }
      return false;
    };

    // 서버 API에서 가격 가져오기
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
            category: '암호화폐' as const,
          };
        });
        
        if (updateCounter.current <= 3 || updateCounter.current % 30 === 0) {
          console.log('[MarketData Server] Updated prices:', newData.map((d: MarketData) => `${d.symbol}: $${d.price}`).join(', '));
        }
        
        setData(newData);
        setIsLoaded(true);
        setIsError(false);
        totalFailCount.current = 0;
        return true;
      } catch (error) {
        return false;
      }
    };

    // 메인 가격 가져오기 함수: 서버 API 먼저 시도, 실패하면 직접 Binance 호출
    const fetchRealPrices = async () => {
      // 이미 직접 호출 모드면 계속 직접 호출
      if (useDirectBinance.current) {
        const success = await fetchFromBinanceDirect();
        if (!success) {
          totalFailCount.current++;
          if (totalFailCount.current >= 5) {
            setIsError(true);
          }
        }
        return;
      }
      
      // 서버 API 먼저 시도
      const serverSuccess = await fetchFromServerApi();
      
      if (serverSuccess) {
        serverFailCount.current = 0;
      } else {
        serverFailCount.current++;
        // 서버 2번 연속 실패 시 직접 Binance 호출로 전환
        if (serverFailCount.current >= 2) {
          const directSuccess = await fetchFromBinanceDirect();
          if (directSuccess) {
            console.log('[MarketData] 서버 API 실패, Binance 직접 호출 모드로 전환');
            useDirectBinance.current = true;
          } else {
            totalFailCount.current++;
            if (totalFailCount.current >= 5) {
              setIsError(true);
            }
          }
        }
      }
    };

    // Initial API fetch
    fetchRealPrices();

    // Fetch from API every 500ms for real-time updates
    const apiInterval = setInterval(fetchRealPrices, 500);

    return () => {
      clearInterval(apiInterval);
    };
  }, []);

  return { data, isLoaded, isError };
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
