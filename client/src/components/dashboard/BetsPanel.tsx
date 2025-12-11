import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bet } from "@/hooks/use-bets";
import { TrendingUp, TrendingDown, Clock, Trophy, XCircle } from "lucide-react";

interface BetsPanelProps {
  bets: Bet[];
  currentPrices: Record<string, number>;
  onBetExpire: (bet: Bet, currentPrice: number) => void;
}

function BetRow({ bet, currentPrice, onExpire }: { bet: Bet; currentPrice: number; onExpire: (price: number) => void }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateRemaining = () => {
      const expiresAt = new Date(bet.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !hasExpired && bet.outcome === 'pending') {
        setHasExpired(true);
        onExpire(currentPrice);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 100);
    return () => clearInterval(interval);
  }, [bet.expiresAt, bet.outcome, hasExpired, currentPrice, onExpire]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const strikePrice = parseFloat(bet.strikePrice);
  const priceDiff = currentPrice - strikePrice;
  const percentChange = (priceDiff / strikePrice) * 100;
  
  const isWinning = bet.direction === 'long' ? currentPrice > strikePrice : currentPrice < strikePrice;

  if (bet.outcome !== 'pending') {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border/50",
        bet.outcome === 'win' ? "bg-up/10" : "bg-down/10"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          bet.outcome === 'win' ? "bg-up/20" : "bg-down/20"
        )}>
          {bet.outcome === 'win' ? (
            <Trophy className="w-5 h-5 text-up" />
          ) : (
            <XCircle className="w-5 h-5 text-down" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{bet.symbol}</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              bet.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
            )}>
              {bet.direction.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {parseFloat(bet.strikePrice).toLocaleString()} → {parseFloat(bet.closePrice || '0').toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className={cn(
            "font-mono font-bold",
            bet.outcome === 'win' ? "text-up" : "text-down"
          )}>
            {bet.outcome === 'win' ? '+' : '-'}{Math.floor(parseFloat(bet.outcome === 'win' ? bet.payout || '0' : bet.amount)).toLocaleString()}원
          </div>
          <div className={cn(
            "text-xs font-medium",
            bet.outcome === 'win' ? "text-up" : "text-down"
          )}>
            {bet.outcome === 'win' ? '승리' : '패배'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/10">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        bet.direction === 'long' ? "bg-up/20" : "bg-down/20"
      )}>
        {bet.direction === 'long' ? (
          <TrendingUp className="w-5 h-5 text-up" />
        ) : (
          <TrendingDown className="w-5 h-5 text-down" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{bet.symbol}</span>
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded shrink-0",
            bet.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
          )}>
            {bet.direction.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>진입가: {strikePrice.toLocaleString()}</span>
          <span className={cn("font-mono", isWinning ? "text-up" : "text-down")}>
            ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(3)}%)
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-bold",
          timeRemaining <= 10 ? "bg-down/20 text-down animate-pulse" : "bg-muted/30 text-foreground"
        )}>
          <Clock className="w-3 h-3" />
          {formatTime(timeRemaining)}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {Math.floor(parseFloat(bet.amount)).toLocaleString()}원
        </div>
      </div>
    </div>
  );
}

export function BetsPanel({ bets, currentPrices, onBetExpire }: BetsPanelProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  const activeBets = bets.filter(b => b.outcome === 'pending');
  const settledBets = bets.filter(b => b.outcome !== 'pending');

  const totalWins = settledBets.filter(b => b.outcome === 'win').length;
  const totalLosses = settledBets.filter(b => b.outcome === 'lose').length;

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center px-4 h-10 border-b border-border gap-6 shrink-0">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "text-sm font-medium h-full px-2 transition-colors",
            activeTab === 'active' 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          진행 중 ({activeBets.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "text-sm font-medium h-full px-2 transition-colors",
            activeTab === 'history' 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          베팅 내역 ({settledBets.length})
        </button>
        
        {settledBets.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-up font-medium">{totalWins}승</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-down font-medium">{totalLosses}패</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'active' ? (
          activeBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <span>진행 중인 베팅이 없습니다.</span>
            </div>
          ) : (
            <div>
              {activeBets.map((bet) => (
                <BetRow 
                  key={bet.id} 
                  bet={bet} 
                  currentPrice={currentPrices[bet.symbol] || parseFloat(bet.strikePrice)}
                  onExpire={(price) => onBetExpire(bet, price)}
                />
              ))}
            </div>
          )
        ) : (
          settledBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Trophy className="w-8 h-8 mb-2 opacity-50" />
              <span>베팅 내역이 없습니다.</span>
            </div>
          ) : (
            <div>
              {settledBets.slice(0, 20).map((bet) => (
                <BetRow 
                  key={bet.id} 
                  bet={bet} 
                  currentPrice={parseFloat(bet.closePrice || bet.strikePrice)}
                  onExpire={() => {}}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
