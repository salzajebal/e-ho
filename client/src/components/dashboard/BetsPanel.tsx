import { useState, useEffect } from "react";
import { cn, formatForexPrice } from "@/lib/utils";
import { Bet } from "@/hooks/use-bets";
import { TrendingUp, TrendingDown, Clock, Trophy, XCircle, Calendar } from "lucide-react";

function toKSTDate(date: Date): Date {
  const kstOffset = 9 * 60 * 60 * 1000;
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  return new Date(utcTime + kstOffset);
}

function isToday(dateString: string): boolean {
  const now = new Date();
  const kstNow = toKSTDate(now);
  const kstTodayStart = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
  
  const betDate = new Date(dateString);
  const kstBetDate = toKSTDate(betDate);
  const kstBetDayStart = new Date(kstBetDate.getFullYear(), kstBetDate.getMonth(), kstBetDate.getDate());
  
  return kstTodayStart.getTime() === kstBetDayStart.getTime();
}


interface BetsPanelProps {
  bets: Bet[];
  currentPrices: Record<string, number>;
  onBetExpire: (bet: Bet, currentPrice: number) => void;
}

function BetRow({ bet, currentPrice, onExpire }: { bet: Bet; currentPrice: number; onExpire: (price: number) => void }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);
  const betLockThreshold = bet.duration <= 60 ? 10 : bet.duration <= 180 ? 15 : 60;

  useEffect(() => {
    const calculateRemaining = () => {
      const expiresAt = new Date(bet.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !hasExpired && bet.outcome === 'pending') {
        setHasExpired(true);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 100);
    return () => clearInterval(interval);
  }, [bet.expiresAt, bet.outcome, hasExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const strikePrice = parseFloat(bet.strikePrice);
  const priceDiff = currentPrice - strikePrice;
  const percentChange = (priceDiff / strikePrice) * 100;
  
  const isWinning = bet.direction === 'long' ? currentPrice > strikePrice : currentPrice < strikePrice;

  // 정산된 베팅 (win / lose)
  if (bet.outcome !== 'pending') {
    const betDate = new Date(bet.createdAt);
    const formattedDate = `${(betDate.getMonth() + 1).toString().padStart(2, '0')}.${betDate.getDate().toString().padStart(2, '0')} ${betDate.getHours().toString().padStart(2, '0')}:${betDate.getMinutes().toString().padStart(2, '0')}`;
    
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
              {bet.direction === 'long' ? '매수' : '매도'}
            </span>
            {bet.roundNumber != null && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
                #{bet.roundNumber}회차 {betDate.getHours().toString().padStart(2, '0')}:{betDate.getMinutes().toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{formattedDate}</span>
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
            {bet.outcome === 'win' ? '실현' : '실격'}
          </div>
        </div>
      </div>
    );
  }

  // 진행중 베팅 (normal pending — 아직 회차가 진행중)
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
            {bet.direction === 'long' ? '매수' : '매도'}
          </span>
          {bet.outcome === 'pending' && bet.roundNumber != null && (
            <span className="text-xs px-1.5 py-0.5 rounded shrink-0 bg-primary/20 text-primary font-mono">
              #{bet.roundNumber}회차 {new Date(bet.createdAt).getHours().toString().padStart(2, '0')}:{new Date(bet.createdAt).getMinutes().toString().padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("font-mono", isWinning ? "text-up" : "text-down")}>
            ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(3)}%)
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-bold",
          timeRemaining <= betLockThreshold ? "bg-down/20 text-down animate-pulse" : "bg-muted/30 text-foreground"
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
  const [activeTab, setActiveTab] = useState<'active' | 'today' | 'history'>('active');
  
  // 진행중: outcome='pending'만
  const activeBets = bets.filter(b => b.outcome === 'pending');
  // 정산완료: pending 제외 전부 (win, lose, unrealized 모두 동일하게 표시)
  const completedBets = bets.filter(b => b.outcome !== 'pending');
  const todayBets = completedBets.filter(b => isToday(b.createdAt));

  // 손익: 실제 잔액이 변동된 베팅만 (win/lose, unrealized 제외)
  const todaySettled = todayBets.filter(b => b.outcome === 'win' || b.outcome === 'lose');
  const todayProfit = todaySettled.reduce((sum, b) => {
    if (b.outcome === 'win') {
      return sum + parseFloat(b.payout || '0') - parseFloat(b.amount);
    } else {
      return sum - parseFloat(b.amount);
    }
  }, 0);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center px-4 h-10 border-b border-border gap-4 shrink-0">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "text-xs font-medium h-full px-1 transition-colors",
            activeTab === 'active' 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          진행중 ({activeBets.length})
        </button>
        <button 
          onClick={() => setActiveTab('today')}
          className={cn(
            "text-xs font-medium h-full px-1 transition-colors",
            activeTab === 'today' 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          오늘 ({todayBets.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "text-xs font-medium h-full px-1 transition-colors",
            activeTab === 'history' 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          전체 ({completedBets.length})
        </button>
        
        {activeTab === 'today' && todayBets.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className={cn("font-bold", todayProfit >= 0 ? "text-up" : "text-down")}>
              {todayProfit >= 0 ? '+' : ''}{Math.floor(todayProfit).toLocaleString()}원
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'active' && (
          activeBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <span>진행 중인 거래가 없습니다.</span>
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
        )}
        {activeTab === 'today' && (
          todayBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Calendar className="w-8 h-8 mb-2 opacity-50" />
              <span>오늘 완료된 거래가 없습니다.</span>
            </div>
          ) : (
            <div>
              <div className="p-3 border-b border-border bg-muted/20">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground">총 거래</div>
                    <div className="font-bold text-foreground">{todayBets.length}건</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">손익</div>
                    <div className={cn("font-bold", todayProfit >= 0 ? "text-up" : "text-down")}>
                      {todayProfit >= 0 ? '+' : ''}{Math.floor(todayProfit).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              {todayBets.map((bet) => (
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
        {activeTab === 'history' && (
          completedBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Trophy className="w-8 h-8 mb-2 opacity-50" />
              <span>거래 내역이 없습니다.</span>
            </div>
          ) : (
            <div>
              {completedBets.slice(0, 50).map((bet) => (
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
