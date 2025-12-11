import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface BettingFormProps {
  currentPrice: number;
  symbol: string;
  balance?: string;
  onBet: (direction: 'long' | 'short', amount: number, duration: number) => void;
}

const DURATIONS = [
  { value: 60, label: '1분' },
  { value: 120, label: '2분' },
  { value: 180, label: '3분' },
  { value: 300, label: '5분' },
];

const MULTIPLIER = 1.90;

export function BettingForm({ currentPrice, symbol, balance, onBet }: BettingFormProps) {
  const [amount, setAmount] = useState<string>("100");
  const [duration, setDuration] = useState<number>(60);

  const availableBalance = balance ? parseFloat(balance) : 100000;
  const betAmount = parseFloat(amount) || 0;
  const potentialWin = betAmount * MULTIPLIER;

  const handleBet = (direction: 'long' | 'short') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("유효한 금액을 입력해주세요.");
      return;
    }

    if (numAmount < 10) {
      toast.error("최소 베팅금액은 10 USDT입니다.");
      return;
    }

    if (numAmount > availableBalance) {
      toast.error("잔고가 부족합니다.");
      return;
    }
    
    onBet(direction, numAmount, duration);
    toast.success(`${direction === 'long' ? '📈 LONG' : '📉 SHORT'} 베팅 완료!`, {
      description: `${symbol} | ${DURATIONS.find(d => d.value === duration)?.label} | ${numAmount.toLocaleString()} USDT`,
    });
  };

  const handleQuickAmount = (percent: number) => {
    const quickAmount = Math.floor(availableBalance * percent);
    setAmount(quickAmount.toString());
  };

  return (
    <div className="flex flex-col h-full bg-card w-full">
      <div className="flex items-center px-4 h-10 border-b border-border bg-muted/20 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">베팅</h2>
        <span className="ml-auto text-xs text-muted-foreground">배당률: {MULTIPLIER}x</span>
      </div>

      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">가용 잔고</span>
            <span className="text-foreground font-mono font-semibold">
              {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
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
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            거래 시간
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                data-testid={`duration-${d.value}`}
                className={cn(
                  "py-2 rounded-md text-sm font-medium transition-all",
                  duration === d.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">베팅 금액 (USDT)</label>
          <div className="relative">
            <Input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg text-right pr-14 h-12 bg-input border-border focus-visible:ring-primary"
              data-testid="input-bet-amount"
              min="10"
            />
            <span className="absolute right-3 top-3.5 text-sm text-muted-foreground">USDT</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0.1, 0.25, 0.5, 1].map((percent) => (
              <button
                key={percent}
                onClick={() => handleQuickAmount(percent)}
                className="py-1.5 text-xs rounded bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                {percent * 100}%
              </button>
            ))}
          </div>
        </div>

        <div className="bg-muted/20 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">베팅 금액</span>
            <span className="text-foreground font-mono">{betAmount.toLocaleString()} USDT</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">예상 수익 (승리 시)</span>
            <span className="text-up font-mono font-semibold">+{potentialWin.toFixed(2)} USDT</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            className="w-full h-14 bg-up hover:bg-up/90 text-white font-bold text-lg flex items-center justify-center gap-2"
            onClick={() => handleBet('long')}
            data-testid="button-long"
          >
            <TrendingUp className="w-5 h-5" />
            LONG
          </Button>
          <Button 
            className="w-full h-14 bg-down hover:bg-down/90 text-white font-bold text-lg flex items-center justify-center gap-2"
            onClick={() => handleBet('short')}
            data-testid="button-short"
          >
            <TrendingDown className="w-5 h-5" />
            SHORT
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          LONG: 가격 상승 시 승리 | SHORT: 가격 하락 시 승리
        </p>
      </div>
    </div>
  );
}
