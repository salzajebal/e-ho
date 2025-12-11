import { MarketData } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface MarketOverviewProps {
  data: MarketData[];
  onSelect: (symbol: string) => void;
  selectedSymbol: string;
}

export function MarketOverview({ data, onSelect, selectedSymbol }: MarketOverviewProps) {
  return (
    <div className="flex flex-col h-full bg-card border-x border-border w-full lg:w-[320px] shrink-0">
      <div className="flex items-center px-4 h-10 border-b border-border bg-muted/20">
        <h2 className="text-sm font-semibold text-muted-foreground">마켓 목록</h2>
      </div>
      
      <div className="flex px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
        <span className="flex-1">자산</span>
        <span className="w-24 text-right">현재가</span>
        <span className="w-16 text-right">변동</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {data.map((item) => (
          <button
            key={item.symbol}
            onClick={() => onSelect(item.symbol)}
            className={cn(
              "flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-muted/30",
              selectedSymbol === item.symbol && "bg-muted/40 border-l-2 border-primary pl-[14px]"
            )}
          >
            <div className="flex-1 flex flex-col items-start">
              <span className="font-medium text-foreground">{item.symbol}</span>
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
            <div className="w-24 text-right font-mono font-medium text-foreground">
              {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={cn(
              "w-16 text-right font-mono text-xs flex items-center justify-end gap-0.5",
              item.change >= 0 ? "text-up" : "text-down"
            )}>
              {item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
