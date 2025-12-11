import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OrderBookProps {
  currentPrice: number;
}

export function OrderBook({ currentPrice }: OrderBookProps) {
  const [bids, setBids] = useState<any[]>([]);
  const [asks, setAsks] = useState<any[]>([]);

  useEffect(() => {
    const generateBook = () => {
      const newAsks = Array.from({ length: 14 }).map((_, i) => ({
        price: currentPrice + (i + 1) * (currentPrice * 0.0002),
        amount: Math.random() * 2,
        total: 0
      })).reverse();
      
      const newBids = Array.from({ length: 14 }).map((_, i) => ({
        price: currentPrice - (i + 1) * (currentPrice * 0.0002),
        amount: Math.random() * 2,
        total: 0
      }));

      setAsks(newAsks);
      setBids(newBids);
    };

    generateBook();
    const interval = setInterval(generateBook, 2000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="flex flex-col h-full w-full lg:w-[280px] shrink-0 border-l border-border bg-card">
      <div className="flex items-center px-4 h-10 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground">호가창</h2>
      </div>

      <div className="flex px-4 py-2 text-xs font-medium text-muted-foreground">
        <span className="flex-1 text-left">가격</span>
        <span className="flex-1 text-right">수량</span>
        <span className="flex-1 text-right">합계</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Asks (Red) */}
        <div className="flex-1 overflow-hidden flex flex-col justify-end pb-1">
          {asks.map((ask, i) => (
            <div key={i} className="flex px-4 py-0.5 text-xs font-mono hover:bg-muted/30 cursor-pointer relative group">
              <div className="absolute inset-0 bg-down-10 w-[30%] ml-auto opacity-20 group-hover:opacity-30"></div>
              <span className="flex-1 text-left text-down">{ask.price.toFixed(2)}</span>
              <span className="flex-1 text-right text-foreground">{ask.amount.toFixed(4)}</span>
              <span className="flex-1 text-right text-muted-foreground">{(ask.price * ask.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Current Price */}
        <div className="py-3 px-4 flex items-center justify-center gap-2 border-y border-border/50 bg-muted/10">
          <span className="text-xl font-mono font-bold text-up">{currentPrice.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">≈ ${currentPrice.toFixed(2)}</span>
        </div>

        {/* Bids (Green) */}
        <div className="flex-1 overflow-hidden pt-1">
          {bids.map((bid, i) => (
            <div key={i} className="flex px-4 py-0.5 text-xs font-mono hover:bg-muted/30 cursor-pointer relative group">
              <div className="absolute inset-0 bg-up-10 w-[40%] ml-auto opacity-20 group-hover:opacity-30"></div>
              <span className="flex-1 text-left text-up">{bid.price.toFixed(2)}</span>
              <span className="flex-1 text-right text-foreground">{bid.amount.toFixed(4)}</span>
              <span className="flex-1 text-right text-muted-foreground">{(bid.price * bid.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
