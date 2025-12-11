import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TradeHistory({ currentPrice }: { currentPrice: number }) {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    // Initial trades
    setTrades(Array.from({ length: 20 }).map(() => ({
      price: currentPrice + (Math.random() - 0.5) * 10,
      amount: Math.random(),
      time: new Date().toLocaleTimeString([], { hour12: false }),
      isBuyerMaker: Math.random() > 0.5
    })));

    const interval = setInterval(() => {
      setTrades(prev => {
        const newTrade = {
          price: currentPrice + (Math.random() - 0.5) * 5,
          amount: Math.random() * 2,
          time: new Date().toLocaleTimeString([], { hour12: false }),
          isBuyerMaker: Math.random() > 0.5
        };
        return [newTrade, ...prev.slice(0, 19)];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="flex flex-col h-full w-full lg:w-[280px] shrink-0 border-l border-border bg-card">
      <div className="flex items-center px-4 h-10 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground">Market Trades</h2>
      </div>

      <div className="flex px-4 py-2 text-xs font-medium text-muted-foreground">
        <span className="flex-1 text-left">Price</span>
        <span className="flex-1 text-right">Amount</span>
        <span className="flex-1 text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trades.map((trade, i) => (
          <div key={i} className="flex px-4 py-0.5 text-xs font-mono hover:bg-muted/30">
            <span className={cn(
              "flex-1 text-left",
              trade.isBuyerMaker ? "text-down" : "text-up"
            )}>{trade.price.toFixed(2)}</span>
            <span className="flex-1 text-right text-foreground opacity-90">{trade.amount.toFixed(4)}</span>
            <span className="flex-1 text-right text-muted-foreground">{trade.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
