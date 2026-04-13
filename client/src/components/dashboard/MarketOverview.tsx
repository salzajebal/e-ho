import { MarketData } from "@/lib/mockData";
import { cn, formatForexPrice } from "@/lib/utils";
import { FOREX_DISPLAY, ForexSymbol } from "@/lib/tradingGames";
import { SymbolIcon } from "@/components/SymbolIcon";

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

  return (
    <div className="flex flex-col h-full bg-card border-x border-border w-full lg:w-[320px] shrink-0">
      <div className="flex items-center px-4 h-10 border-b border-border bg-muted/20">
        <h2 className="text-sm font-semibold text-muted-foreground">거래 종목</h2>
      </div>
      
      <div className="flex px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
        <span className="flex-1">종목</span>
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
                "flex w-full items-center px-4 h-[60px] shrink-0 text-sm transition-colors hover:bg-muted/30",
                selectedGameId === game.id && "bg-muted/40 border-l-2 border-primary pl-[14px]"
              )}
            >
              <div className="mr-3 shrink-0">
                <SymbolIcon symbol={game.symbol} size={28} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
                <span className="font-medium text-foreground whitespace-nowrap truncate w-full">
                  {FOREX_DISPLAY[game.symbol as ForexSymbol]?.name || game.symbol}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap truncate w-full">
                  {FOREX_DISPLAY[game.symbol as ForexSymbol]?.pair || market.name}
                </span>
              </div>
              <div className="w-24 text-right font-mono font-medium text-foreground shrink-0">
                {formatForexPrice(market.price, game.symbol)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
