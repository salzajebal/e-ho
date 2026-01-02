import { MarketData } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { memo, useMemo, useRef, useEffect } from "react";

// Memoized individual ticker item to prevent re-renders
const TickerItem = memo(function TickerItem({ 
  symbol, 
  price, 
  change, 
  changePercent 
}: { 
  symbol: string; 
  price: number; 
  change: number; 
  changePercent: number;
}) {
  const isPositive = change >= 0;
  
  return (
    <div className="flex items-center px-4 gap-2 text-xs border-r border-border/50 flex-shrink-0">
      <span className="font-semibold text-foreground">{symbol}</span>
      <span className={cn("font-mono", isPositive ? "text-up" : "text-down")}>
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className={cn("font-mono", isPositive ? "text-up" : "text-down")}>
        {changePercent > 0 ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  );
});

export function Ticker({ data }: { data: MarketData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Guard against empty or undefined data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center h-8 bg-card border-b border-border overflow-hidden whitespace-nowrap">
        <div className="flex items-center px-4 text-xs text-muted-foreground">
          시장 데이터 로딩 중...
        </div>
      </div>
    );
  }
  
  // Memoize the symbol order (stable structure)
  const symbols = useMemo(() => data.map(d => d.symbol), [data.length]);
  
  // Create a lookup map for current prices
  const priceMap = useMemo(() => {
    const map: Record<string, { price: number; change: number; changePercent: number }> = {};
    data.forEach(item => {
      map[item.symbol] = { price: item.price, change: item.change, changePercent: item.changePercent };
    });
    return map;
  }, [data]);

  return (
    <div className="flex items-center h-8 bg-card border-b border-border overflow-hidden whitespace-nowrap">
      <div 
        ref={scrollRef}
        className="flex ticker-scroll"
        style={{ willChange: 'transform' }}
      >
        {/* Render 3 copies for seamless loop */}
        {[0, 1, 2].map(copyIndex => (
          <div key={copyIndex} className="flex flex-shrink-0">
            {symbols.map(symbol => {
              const item = priceMap[symbol];
              if (!item) return null;
              return (
                <TickerItem
                  key={`${copyIndex}-${symbol}`}
                  symbol={symbol}
                  price={item.price}
                  change={item.change}
                  changePercent={item.changePercent}
                />
              );
            })}
          </div>
        ))}
      </div>
      <style>{`
        .ticker-scroll {
          animation: ticker-scroll 45s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
      `}</style>
    </div>
  );
}
