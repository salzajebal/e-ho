import { MarketData } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function Ticker({ data }: { data: MarketData[] }) {
  return (
    <div className="flex items-center h-8 bg-card border-b border-border overflow-hidden whitespace-nowrap">
      <div className="flex animate-scroll hover:pause">
        {[...data, ...data, ...data].map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center px-4 gap-2 text-xs border-r border-border/50">
            <span className="font-semibold text-foreground">{item.symbol}</span>
            <span className={cn(
              "font-mono",
              item.change >= 0 ? "text-up" : "text-down"
            )}>
              {item.price.toLocaleString()}
            </span>
            <span className={cn(
              "font-mono",
              item.change >= 0 ? "text-up" : "text-down"
            )}>
              {item.changePercent > 0 ? "+" : ""}{item.changePercent}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
