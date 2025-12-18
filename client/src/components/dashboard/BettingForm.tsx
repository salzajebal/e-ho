import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock, Hash } from "lucide-react";

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

const MULTIPLIER = 2.00;

// Check if current time is within operating hours (9AM-7PM KST)
const isWithinOperatingHours = () => {
  const now = new Date();
  // Convert to KST (UTC+9)
  const kstOffset = 9 * 60; // 9 hours in minutes
  const utcOffset = now.getTimezoneOffset(); // Current timezone offset in minutes
  const kstTime = new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
  
  const hours = kstTime.getHours();
  // Operating hours: 9AM (09:00) to 7PM (19:00) KST
  return hours >= 9 && hours < 19;
};

// Calculate current round number based on KST time
const calculateRoundNumber = (durationSeconds: number): number => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  const kstTime = new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
  
  const minutesSinceMidnight = kstTime.getHours() * 60 + kstTime.getMinutes();
  const durationMinutes = durationSeconds / 60;
  return Math.floor(minutesSinceMidnight / durationMinutes) + 1;
};

// Get max rounds per day based on duration
const getMaxRoundsPerDay = (durationSeconds: number): number => {
  const durationMinutes = durationSeconds / 60;
  return Math.floor(24 * 60 / durationMinutes);
};

export function BettingForm({ currentPrice, game, balance, onBet }: BettingFormProps) {
  const [amount, setAmount] = useState<string>("10000");
  const [currentRound, setCurrentRound] = useState(calculateRoundNumber(game.duration));
  const maxRounds = getMaxRoundsPerDay(game.duration);
  const availableBalance = balance ? parseFloat(balance) : 0;

  useEffect(() => {
    setCurrentRound(calculateRoundNumber(game.duration));
    const interval = setInterval(() => {
      setCurrentRound(calculateRoundNumber(game.duration));
    }, 10000);
    return () => clearInterval(interval);
  }, [game.duration]);
  const betAmount = parseFloat(amount) || 0;
  const potentialWin = betAmount * MULTIPLIER;

  const formatDuration = (seconds: number) => {
    return `${seconds / 60}분`;
  };

  const validateBet = (direction: 'long' | 'short') => {
    // Check operating hours first
    if (!isWithinOperatingHours()) {
      toast.error("영업시간이 아닙니다", {
        description: "운영시간: 오전 9시 ~ 오후 7시 (한국시간)",
      });
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
      toast.success(`${direction === 'long' ? '📈 LONG (매수)' : '📉 SHORT (매도)'} 베팅 완료!`, {
        description: `${game.label} | ${numAmount.toLocaleString()}원`,
      });
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
          <div className="flex items-center justify-center gap-2 bg-yellow-500/20 rounded py-1.5 px-2">
            <Hash className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-500">
              {currentRound}회차
            </span>
            <span className="text-xs text-yellow-500/70">
              / {maxRounds}회
            </span>
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

        <div className="grid grid-cols-2 gap-2 lg:gap-3 pt-1 lg:pt-2">
          <Button 
            onClick={() => handleBetClick('long')}
            className="h-11 lg:h-14 text-sm lg:text-base font-bold bg-up hover:bg-up/90 text-white"
            data-testid="button-long"
          >
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2" />
            LONG (매수)
          </Button>
          <Button 
            onClick={() => handleBetClick('short')}
            className="h-11 lg:h-14 text-sm lg:text-base font-bold bg-down hover:bg-down/90 text-white"
            data-testid="button-short"
          >
            <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2" />
            SHORT (매도)
          </Button>
        </div>
      </div>
    </div>
  );
}
