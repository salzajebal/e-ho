import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { MarketData } from "@/lib/marketData";
import { FOREX_DISPLAY, type ForexSymbol } from "@/lib/tradingGames";
import { useTheme } from "@/lib/theme";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
  duration?: number;
}

const DARK_COLORS = {
  background: '#131722',
  text: '#787b86',
  grid: '#1e222d',
  crosshair: '#505050',
  crosshairLabel: '#363a45',
  border: '#1e222d',
};

const LIGHT_COLORS = {
  background: '#ffffff',
  text: '#333333',
  grid: '#e8e8e8',
  crosshair: '#9a9a9a',
  crosshairLabel: '#d0d0d0',
  border: '#e0e0e0',
};

const KST_OFFSET = 9 * 60 * 60;

function getKSTAlignedTime(intervalSeconds: number): number {
  const now = Math.floor(Date.now() / 1000) + KST_OFFSET;
  return Math.floor(now / intervalSeconds) * intervalSeconds;
}

async function fetchServerCandles(symbol: string, duration: number): Promise<CandlestickData<Time>[]> {
  try {
    const response = await fetch(`/api/market/candles/${symbol}?duration=${duration}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.candles || data.candles.length === 0) return [];
    return data.candles.map((c: any) => ({
      time: (c.time + KST_OFFSET) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  } catch {
    return [];
  }
}

function generateFallbackCandles(
  basePrice: number,
  count: number,
  intervalSeconds: number,
  endTime?: number
): CandlestickData<Time>[] {
  const alignedEnd = endTime || getKSTAlignedTime(intervalSeconds);
  const volatility = basePrice > 100 ? 0.0003 : 0.0005;
  let price = basePrice;
  const tempCandles: CandlestickData<Time>[] = [];
  for (let i = 0; i < count; i++) {
    const time = (alignedEnd - (i + 1) * intervalSeconds) as Time;
    const change = price * volatility * (Math.random() - 0.5) * 2;
    const open = price - change;
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    tempCandles.unshift({ time, open, high, low, close });
    price = open;
  }
  return tempCandles;
}

function getDecimalPlaces(symbol: string): number {
  const base = symbol.split('-')[0];
  if (base === 'DXY') return 4;
  return 2;
}

function getMinMove(symbol: string): number {
  const base = symbol.split('-')[0];
  if (base === 'DXY') return 0.0001;
  return 0.01;
}

// 양방향 오염 감지 + 개별 이상값 제거
function filterStaleCandlesBidirectional(
  candles: CandlestickData<Time>[],
  currentPrice: number,
  symbol: string
): CandlestickData<Time>[] {
  if (candles.length === 0 || currentPrice <= 0) return candles;

  const BELOW_THRESHOLD = 0.08;
  const ABOVE_THRESHOLD = 0.04;
  const FILTER_THRESHOLD = 0.10;

  const minClose = Math.min(...candles.map(c => c.close));
  const maxClose = Math.max(...candles.map(c => c.close));
  const belowDiff = (currentPrice - minClose) / currentPrice;
  const aboveDiff = (maxClose - currentPrice) / currentPrice;

  if (belowDiff > BELOW_THRESHOLD || aboveDiff > ABOVE_THRESHOLD) {
    console.warn(
      `[PriceChart] ${symbol} 오염 캔들 폐기: ` +
      `min=${minClose.toFixed(4)} max=${maxClose.toFixed(4)} vs ${currentPrice.toFixed(4)} ` +
      `(↓${(belowDiff*100).toFixed(1)}% ↑${(aboveDiff*100).toFixed(1)}%)`
    );
    return [];
  }

  const lower = currentPrice * (1 - FILTER_THRESHOLD);
  const upper = currentPrice * (1 + FILTER_THRESHOLD);
  return candles.filter(c => c.close >= lower && c.close <= upper);
}

function PriceChartComponent({ symbol, data, duration = 60 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 실시간 업데이트용 ref (렌더 없이 최신값 유지)
  const priceRef = useRef(data.price);
  const lastBarRef = useRef<CandlestickData<Time> | null>(null);
  const currentStartRef = useRef<number>(0);
  const dataLoadedRef = useRef(false);

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;

  const durationMinutes = duration / 60;
  const isUp = data.change >= 0;
  const displayInfo = FOREX_DISPLAY[symbol as ForexSymbol];
  const decimals = getDecimalPlaces(symbol);

  // ── 차트 생성: 마운트 시 단 한 번만 ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: C.background },
        textColor: C.text,
      },
      grid: {
        vertLines: { color: C.grid },
        horzLines: { color: C.grid },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: C.crosshair, width: 1, style: 0, labelBackgroundColor: C.crosshairLabel },
        horzLine: { color: C.crosshair, width: 1, style: 0, labelBackgroundColor: C.crosshairLabel },
      },
      rightPriceScale: {
        borderColor: C.border,
        scaleMargins: { top: 0.2, bottom: 0.2 },
        autoScale: true,
      },
      timeScale: {
        borderColor: C.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          const h = date.getUTCHours().toString().padStart(2, '0');
          const m = date.getUTCMinutes().toString().padStart(2, '0');
          return `${h}:${m}`;
        },
        priceFormatter: (price: number) => price.toFixed(getDecimalPlaces(symbol)),
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const series = (chart as any).addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
      priceFormat: {
        type: 'price',
        precision: getDecimalPlaces(symbol),
        minMove: getMinMove(symbol),
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // ResizeObserver: 차트 크기 반응형 유지
    const resize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // 마운트 시 단 한 번 — symbol/duration 변경 시 재생성하지 않음

  // ── 테마 변경 시 색상 업데이트 ───────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: C.background },
        textColor: C.text,
      },
      grid: {
        vertLines: { color: C.grid },
        horzLines: { color: C.grid },
      },
      crosshair: {
        vertLine: { color: C.crosshair, labelBackgroundColor: C.crosshairLabel },
        horzLine: { color: C.crosshair, labelBackgroundColor: C.crosshairLabel },
      },
      rightPriceScale: { borderColor: C.border },
      timeScale: { borderColor: C.border },
    });
  }, [theme]);

  // ── priceRef 동기화 (렌더 없이 항상 최신 가격 유지) ─────────────────
  useEffect(() => {
    if (data.price > 0) priceRef.current = data.price;
  }, [data.price]);

  // ── 데이터 로드: symbol 또는 duration 변경 시 ────────────────────────
  // 핵심: 차트를 파괴하지 않고 series 옵션과 데이터만 교체 → 깜빡거림 없음
  const loadDataRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    // 이전 로드 취소
    if (loadDataRef.current) loadDataRef.current.abort();
    const abortCtrl = new AbortController();
    loadDataRef.current = abortCtrl;

    dataLoadedRef.current = false;
    lastBarRef.current = null;
    currentStartRef.current = 0;
    setIsLoading(true);

    // series 옵션을 새 심볼 기준으로 업데이트
    const dec = getDecimalPlaces(symbol);
    const mm = getMinMove(symbol);
    seriesRef.current.applyOptions({
      priceFormat: { type: 'price', precision: dec, minMove: mm },
    });
    chartRef.current.applyOptions({
      localization: {
        priceFormatter: (price: number) => price.toFixed(dec),
      },
    });

    const load = async () => {
      // 가격이 아직 없으면 최대 3초 폴링
      let currentPrice = priceRef.current;
      if (currentPrice <= 0) {
        await new Promise<void>(resolve => {
          let n = 0;
          const t = setInterval(() => {
            if (priceRef.current > 0 || ++n > 30) { clearInterval(t); resolve(); }
          }, 100);
        });
        currentPrice = priceRef.current;
      }
      if (abortCtrl.signal.aborted || currentPrice <= 0) return;

      let serverCandles = await fetchServerCandles(symbol, duration);
      if (abortCtrl.signal.aborted) return;

      serverCandles = filterStaleCandlesBidirectional(serverCandles, currentPrice, symbol);

      const basePrice = serverCandles.length > 0
        ? serverCandles[serverCandles.length - 1].close
        : currentPrice;
      if (basePrice <= 0) return;

      const MIN_CANDLES = 50;
      const currentAlignedTime = getKSTAlignedTime(duration);
      let candles: CandlestickData<Time>[] = [];

      if (serverCandles.length >= MIN_CANDLES) {
        candles = serverCandles;
      } else {
        const latestPrice = serverCandles.length > 0
          ? serverCandles[serverCandles.length - 1].close
          : basePrice;
        const latestTime = serverCandles.length > 0
          ? (serverCandles[serverCandles.length - 1].time as number)
          : currentAlignedTime;

        const beforeCandles = serverCandles.length > 0
          ? generateFallbackCandles(
              serverCandles[0].open,
              Math.max(MIN_CANDLES - serverCandles.length, 30),
              duration,
              serverCandles[0].time as number
            )
          : [];

        const gapCount = serverCandles.length > 0
          ? Math.floor((currentAlignedTime - latestTime) / duration) - 1
          : 0;

        let afterCandles: CandlestickData<Time>[] = [];
        if (gapCount > 0 && gapCount < 100) {
          let p = latestPrice;
          const vol = p > 100 ? 0.0002 : 0.0003;
          for (let i = 1; i <= gapCount; i++) {
            const t = (latestTime + i * duration) as Time;
            const change = p * vol * (Math.random() - 0.5) * 2;
            const close = p + change;
            const open = p;
            const high = Math.max(open, close) * (1 + Math.random() * vol * 0.3);
            const low = Math.min(open, close) * (1 - Math.random() * vol * 0.3);
            afterCandles.push({ time: t, open, high, low, close });
            p = close;
          }
        }

        candles = serverCandles.length === 0
          ? generateFallbackCandles(basePrice, MIN_CANDLES, duration)
          : [...beforeCandles, ...serverCandles, ...afterCandles];
      }

      // 중복 시간 제거 및 정렬
      candles.sort((a, b) => (a.time as number) - (b.time as number));
      const seen = new Set<number>();
      candles = candles.filter(c => {
        const t = c.time as number;
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      });

      if (abortCtrl.signal.aborted || candles.length === 0) return;
      if (!seriesRef.current || !chartRef.current) return;

      // 데이터 세팅 → fitContent
      seriesRef.current.setData(candles);
      chartRef.current.timeScale().fitContent();

      const lastCandle = candles[candles.length - 1];
      lastBarRef.current = { ...lastCandle };
      currentStartRef.current = lastCandle.time as number;
      dataLoadedRef.current = true;

      setIsLoading(false);
    };

    load();

    return () => {
      abortCtrl.abort();
    };
  }, [symbol, duration]); // chart는 살아있고 데이터만 교체

  // ── 100ms 틱 업데이트 (isLoading이 false가 된 후) ──────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      if (!seriesRef.current || !lastBarRef.current || !dataLoadedRef.current) return;
      const p = priceRef.current;
      if (p <= 0) return;

      const newStart = getKSTAlignedTime(duration);
      if (newStart > currentStartRef.current) {
        currentStartRef.current = newStart;
        lastBarRef.current = { time: newStart as Time, open: p, high: p, low: p, close: p };
      } else {
        lastBarRef.current = {
          ...lastBarRef.current,
          high: Math.max(lastBarRef.current.high, p),
          low: Math.min(lastBarRef.current.low, p),
          close: p,
        };
      }
      try { seriesRef.current.update(lastBarRef.current); } catch {}
    }, 100);

    return () => clearInterval(tick);
  }, [duration]);

  const headerBg = isDark ? 'bg-[#131722] border-[#1e222d]' : 'bg-white border-gray-200';
  const headerText = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const subBorder = isDark ? 'border-[#1e222d]' : 'border-gray-200';

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: C.background }}
      data-testid="chart-container"
    >
      {/* 헤더 */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${headerBg} shrink-0`}>
        <div className="flex items-center gap-3">
          <span className={`font-bold text-lg ${headerText}`}>{displayInfo?.name || symbol}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
            {data.price.toFixed(decimals)}
          </span>
          <span className={`text-sm ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
            {isUp ? '+' : ''}{data.change.toFixed(decimals)} ({isUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </span>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-semibold">
            {durationMinutes}분봉
          </span>
        </div>
      </div>

      {/* 서브 헤더 */}
      <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${subBorder} text-xs ${subText} shrink-0`}>
        <span className="text-blue-400">{durationMinutes}분</span>
        <span>|</span>
        <span>서버 동기화 (KST)</span>
        {isLoading && <span className="text-yellow-500 ml-2">로딩중...</span>}
      </div>

      {/* 차트 영역: 파괴되지 않음 — 항상 살아있음 */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 w-full"
      />
    </div>
  );
}

export const PriceChart = PriceChartComponent;
