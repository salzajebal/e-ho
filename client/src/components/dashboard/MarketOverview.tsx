import { MarketData } from "@/lib/mockData";
import { cn, formatForexPrice } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Game {
  id: string;
  symbol: string;
  duration: number;
  label: string;
}

interface MarketOverviewProps {
  data: MarketData[];
  games: readonly Game[];
  onSelectGame: (gameId: string) => void;
  selectedGameId: string;
}

export function MarketOverview({ data, games, onSelectGame, selectedGameId }: MarketOverviewProps) {
  const getMarketData = (symbol: string) => data.find(m => m.symbol === symbol);

  const formatDuration = (seconds: number) => {
    return `${seconds / 60}분`;
  };

  return (
    <div className="flex flex-col h-full bg-card border-x border-border w-full lg:w-[320px] shrink-0">
      <div className="flex items-center px-4 h-10 border-b border-border bg-muted/20">
        <h2 className="text-sm font-semibold text-muted-foreground">거래 종목</h2>
      </div>
      
      <div className="flex px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
        <span className="flex-1">종목</span>
        <span className="w-20 text-center">시간</span>
        <span className="w-24 text-right">현재가</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {games.map((game) => {
          const market = getMarketData(game.symbol);
          if (!market) return null;
          
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              data-testid={`game-${game.id}`}
              className={cn(
                "flex w-full items-center px-4 py-3 text-sm transition-colors hover:bg-muted/30",
                selectedGameId === game.id && "bg-muted/40 border-l-2 border-primary pl-[14px]"
              )}
            >
              <div className="flex-1 flex flex-col items-start">
                <span className="font-medium text-foreground">{game.label}</span>
                <span className="text-xs text-muted-foreground">{market.name}</span>
              </div>
              <div className="w-20 text-center">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                  "bg-primary/10 text-primary"
                )}>
                  <Clock className="w-3 h-3" />
                  {formatDuration(game.duration)}
                </span>
              </div>
              <div className="w-24 text-right font-mono font-medium text-foreground">
                {formatForexPrice(market.price, game.symbol)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
