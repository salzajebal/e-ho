import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock, Hash, Timer, History, CheckCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Game {
  id: string;
  symbol: string;
  duration: number;
  label: string;
}

interface BettingFormProps {
  currentPrice: number;
  game: Game;
  balance?: string;
  onBet: (direction: 'long' | 'short', amount: number) => void;
}

interface GameResult {
  round: number;
  direction: 'up' | 'down';
  time: string;
}

const MULTIPLIER = 2.00;

// Get KST Date
const getKSTDate = (): Date => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
};

// Check if current time is within operating hours (9AM-7PM KST)
const isWithinOperatingHours = () => {
  const kstTime = getKSTDate();
  const hours = kstTime.getHours();
  return hours >= 9 && hours < 19;
};

// Calculate current round number based on KST time (seconds precision)
const calculateRoundNumber = (durationSeconds: number): number => {
  const kstTime = getKSTDate();
  const secondsSinceMidnight = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
  return Math.floor(secondsSinceMidnight / durationSeconds) + 1;
};

// Get max rounds per day based on duration
const getMaxRoundsPerDay = (durationSeconds: number): number => {
  return Math.floor(24 * 3600 / durationSeconds);
};

// Get remaining seconds in current round
const getRoundTimeRemaining = (durationSeconds: number): number => {
  const kstTime = getKSTDate();
  const secondsSinceMidnight = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
  const elapsedInRound = secondsSinceMidnight % durationSeconds;
  return durationSeconds - elapsedInRound;
};

// Format time as mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Storage key for game results per game type
const getStorageKey = (gameId: string) => `gameResults_${gameId}_${getKSTDate().toDateString()}`;

interface BetConfirmation {
  show: boolean;
  direction: 'long' | 'short';
  amount: number;
  price: number;
}

interface TimeAlert {
  show: boolean;
  message: string;
}

export function BettingForm({ currentPrice, game, balance, onBet }: BettingFormProps) {
  const [amount, setAmount] = useState<string>("10000");
  const [currentRound, setCurrentRound] = useState(calculateRoundNumber(game.duration));
  const [timeRemaining, setTimeRemaining] = useState(getRoundTimeRemaining(game.duration));
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [betConfirmation, setBetConfirmation] = useState<BetConfirmation>({ show: false, direction: 'long', amount: 0, price: 0 });
  const [timeAlert, setTimeAlert] = useState<TimeAlert>({ show: false, message: '' });
  const lastRoundRef = useRef<number>(0);
  const roundStartPriceRef = useRef<number>(currentPrice);
  const lastPriceRef = useRef<number>(currentPrice);
  const maxRounds = getMaxRoundsPerDay(game.duration);
  const availableBalance = balance ? parseFloat(balance) : 0;

  // Update last price ref
  useEffect(() => {
    lastPriceRef.current = currentPrice;
  }, [currentPrice]);

  // Load saved results from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(game.id);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameResults(parsed);
      } catch (e) {
        setGameResults([]);
      }
    } else {
      setGameResults([]);
    }
    lastRoundRef.current = 0;
    roundStartPriceRef.current = currentPrice;
  }, [game.id]);

  // Track round changes and record results
  useEffect(() => {
    const checkForNewRound = () => {
      const newRound = calculateRoundNumber(game.duration);
      const newTime = getRoundTimeRemaining(game.duration);
      setCurrentRound(newRound);
      setTimeRemaining(newTime);
      
      // Initialize on first check
      if (lastRoundRef.current === 0) {
        lastRoundRef.current = newRound;
        roundStartPriceRef.current = currentPrice;
        return;
      }
      
      // Round changed - record result
      if (newRound > lastRoundRef.current) {
        const closePrice = lastPriceRef.current;
        const openPrice = roundStartPriceRef.current;
        const direction = closePrice >= openPrice ? 'up' : 'down';
        
        const kstTime = getKSTDate();
        const timeStr = kstTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const newResult: GameResult = {
          round: lastRoundRef.current,
          direction,
          time: timeStr,
        };
        
        setGameResults(prev => {
          const updated = [newResult, ...prev];
          // Save to localStorage
          const storageKey = getStorageKey(game.id);
          localStorage.setItem(storageKey, JSON.stringify(updated));
          return updated;
        });
        
        lastRoundRef.current = newRound;
        roundStartPriceRef.current = currentPrice;
      }
    };
    
    checkForNewRound();
    const interval = setInterval(checkForNewRound, 1000);
    return () => clearInterval(interval);
  }, [game.duration, game.id, currentPrice]);

  const betAmount = parseFloat(amount) || 0;
  const potentialWin = betAmount * MULTIPLIER;

  const formatDuration = (seconds: number) => {
    return `${seconds / 60}분`;
  };

  const isBettingLocked = timeRemaining <= 3;

  const validateBet = (direction: 'long' | 'short') => {
    // Check operating hours
    if (!isWithinOperatingHours()) {
      const kstTime = getKSTDate();
      const currentHour = kstTime.getHours();
      let message = "";
      
      if (currentHour < 9) {
        message = `현재 게임 가능 시간이 아닙니다.\n\n운영시간: 오전 9시 ~ 오후 7시 (한국시간)\n\n오전 9시에 다시 방문해주세요!`;
      } else {
        message = `현재 게임 가능 시간이 아닙니다.\n\n운영시간: 오전 9시 ~ 오후 7시 (한국시간)\n\n내일 오전 9시에 다시 방문해주세요!`;
      }
      
      setTimeAlert({ show: true, message });
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("유효한 금액을 입력해주세요.");
      return false;
    }

    if (numAmount < 1000) {
      toast.error("최소 베팅금액은 1,000원입니다.");
      return false;
    }

    if (numAmount > availableBalance) {
      toast.error("잔고가 부족합니다.");
      return false;
    }
    
    return true;
  };

  const handleBetClick = (direction: 'long' | 'short') => {
    if (validateBet(direction)) {
      const numAmount = parseFloat(amount);
      onBet(direction, numAmount);
      
      // Show confirmation popup
      setBetConfirmation({
        show: true,
        direction,
        amount: numAmount,
        price: currentPrice,
      });
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setBetConfirmation(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  const handleQuickAmount = (percent: number) => {
    const quickAmount = Math.floor(availableBalance * percent);
    setAmount(quickAmount.toString());
  };

  return (
    <div className="flex flex-col lg:h-full bg-card w-full">
      <div className="flex items-center justify-between px-3 lg:px-4 h-10 border-b border-border bg-muted/20 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">베팅</h2>
        <span className="text-xs text-muted-foreground">배당률: {MULTIPLIER}x</span>
      </div>

      <div className="p-3 lg:p-4 space-y-3 lg:space-y-5 lg:flex-1 lg:overflow-y-auto">
        <div className="bg-primary/10 rounded-lg p-2 lg:p-3 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground text-sm lg:text-base">{game.label}</span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded text-xs lg:text-sm font-bold",
              "bg-primary text-primary-foreground"
            )}>
              <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
              {formatDuration(game.duration)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center justify-center gap-1.5 bg-yellow-500/20 rounded py-2 px-2">
              <Hash className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              <span className="text-sm font-bold text-yellow-500 whitespace-nowrap">
                {currentRound}<span className="text-yellow-500/70 font-normal">/{maxRounds}</span>
              </span>
            </div>
            <div className={cn(
              "flex items-center justify-center gap-2 rounded py-2 px-2",
              timeRemaining <= 10 ? "bg-red-500/20 animate-pulse" : "bg-blue-500/20"
            )}>
              <Timer className={cn("w-3.5 h-3.5", timeRemaining <= 10 ? "text-red-500" : "text-blue-500")} />
              <span className={cn(
                "text-lg font-bold font-mono",
                timeRemaining <= 10 ? "text-red-500" : "text-blue-500"
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:space-y-3 lg:block">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">가용 잔고</span>
            <span className="text-foreground font-mono font-semibold">
              {availableBalance.toLocaleString()}원
            </span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">현재가</span>
            <span className="text-primary font-mono font-bold">
              {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">베팅 금액 (원)</label>
          <div className="relative">
            <Input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-base lg:text-lg text-right pr-10 h-10 lg:h-12 bg-input border-border focus-visible:ring-primary"
              data-testid="input-bet-amount"
              min="1000"
              step="1000"
            />
            <span className="absolute right-3 top-2.5 lg:top-3.5 text-sm text-muted-foreground">원</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
            {[0.1, 0.25, 0.5, 1].map((percent) => (
              <button
                key={percent}
                onClick={() => handleQuickAmount(percent)}
                className="py-1 lg:py-1.5 text-xs rounded bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                {percent * 100}%
              </button>
            ))}
          </div>
        </div>

        <div className="bg-muted/20 rounded-lg p-2 lg:p-3 space-y-1 lg:space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">베팅 금액</span>
            <span className="text-foreground font-mono">{betAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">예상 수익</span>
            <span className="text-up font-mono font-semibold">+{Math.floor(potentialWin).toLocaleString()}원</span>
          </div>
        </div>

        {isBettingLocked && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
            <span className="text-yellow-500 font-medium text-xs">회차 마감 임박</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 lg:gap-3 pt-1 lg:pt-2">
          <Button 
            onClick={() => handleBetClick('long')}
            className="h-11 lg:h-14 text-xs lg:text-sm font-bold text-white flex items-center justify-center gap-1 bg-up hover:bg-up/90"
            data-testid="button-long"
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>LONG</span>
            <span className="text-white/80 font-normal">(매수)</span>
          </Button>
          <Button 
            onClick={() => handleBetClick('short')}
            className="h-11 lg:h-14 text-xs lg:text-sm font-bold text-white flex items-center justify-center gap-1 bg-down hover:bg-down/90"
            data-testid="button-short"
          >
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span>SHORT</span>
            <span className="text-white/80 font-normal">(매도)</span>
          </Button>
        </div>

        {/* Game Results Section */}
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">오늘 게임결과</span>
            </div>
            <span className="text-xs text-muted-foreground">{gameResults.length}회</span>
          </div>
          
          {gameResults.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              아직 기록된 게임이 없습니다
            </div>
          ) : (
            <ScrollArea className="h-[120px] lg:h-[160px]">
              <div className="grid grid-cols-5 gap-1">
                {gameResults.map((result, idx) => (
                  <div
                    key={`${result.round}-${idx}`}
                    className={cn(
                      "flex flex-col items-center justify-center py-1.5 px-1 rounded text-xs",
                      result.direction === 'up' ? "bg-up/20" : "bg-down/20"
                    )}
                    title={`${result.round}회차 ${result.time}`}
                  >
                    <span className="text-[10px] text-muted-foreground">{result.round}</span>
                    {result.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-up" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-down" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Bet Confirmation Dialog */}
      <Dialog open={betConfirmation.show} onOpenChange={(open) => setBetConfirmation(prev => ({ ...prev, show: open }))}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-center">
              <CheckCircle className={cn(
                "w-8 h-8",
                betConfirmation.direction === 'long' ? "text-up" : "text-down"
              )} />
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-bold",
              betConfirmation.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
            )}>
              {betConfirmation.direction === 'long' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {betConfirmation.direction === 'long' ? 'LONG (매수)' : 'SHORT (매도)'}
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">
                {betConfirmation.amount.toLocaleString()}원
              </p>
              <p className="text-sm text-muted-foreground">
                베팅이 완료되었습니다
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">게임</span>
                <span className="text-foreground font-medium">{game.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">진입가</span>
                <span className="text-foreground font-mono">{betConfirmation.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">예상수익</span>
                <span className="text-up font-mono font-bold">+{(betConfirmation.amount * MULTIPLIER).toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Alert Dialog */}
      <Dialog open={timeAlert.show} onOpenChange={(open) => setTimeAlert(prev => ({ ...prev, show: open }))}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-center">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-bold bg-yellow-500/20 text-yellow-500">
              <Clock className="w-5 h-5" />
              게임 시간 안내
            </div>
            
            <div className="space-y-2">
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {timeAlert.message}
              </p>
            </div>
            
            <Button 
              onClick={() => setTimeAlert({ show: false, message: '' })}
              className="w-full bg-primary hover:bg-primary/90"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
