import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export function BettingForm({ currentPrice, game, balance, onBet }: BettingFormProps) {
  const [amount, setAmount] = useState<string>("10000");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; direction: 'long' | 'short' | null }>({
    open: false,
    direction: null,
  });

  const availableBalance = balance ? parseFloat(balance) : 0;
  const betAmount = parseFloat(amount) || 0;
  const potentialWin = betAmount * MULTIPLIER;

  const formatDuration = (seconds: number) => {
    return `${seconds / 60}분`;
  };

  const validateBet = (direction: 'long' | 'short') => {
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
      setConfirmDialog({ open: true, direction });
    }
  };

  const handleConfirmBet = () => {
    if (confirmDialog.direction) {
      const numAmount = parseFloat(amount);
      onBet(confirmDialog.direction, numAmount);
      toast.success(`${confirmDialog.direction === 'long' ? '📈 LONG' : '📉 SHORT'} 베팅 완료!`, {
        description: `${game.label} | ${numAmount.toLocaleString()}원`,
      });
    }
    setConfirmDialog({ open: false, direction: null });
  };

  const handleQuickAmount = (percent: number) => {
    const quickAmount = Math.floor(availableBalance * percent);
    setAmount(quickAmount.toString());
  };

  return (
    <div className="flex flex-col h-full bg-card w-full">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-muted/20 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">베팅</h2>
        <span className="text-xs text-muted-foreground">배당률: {MULTIPLIER}x</span>
      </div>

      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{game.label}</span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold",
              "bg-primary text-primary-foreground"
            )}>
              <Clock className="w-4 h-4" />
              {formatDuration(game.duration)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
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
              className="font-mono text-lg text-right pr-10 h-12 bg-input border-border focus-visible:ring-primary"
              data-testid="input-bet-amount"
              min="1000"
              step="1000"
            />
            <span className="absolute right-3 top-3.5 text-sm text-muted-foreground">원</span>
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
            <span className="text-foreground font-mono">{betAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">예상 수익 (승리 시)</span>
            <span className="text-up font-mono font-semibold">+{Math.floor(potentialWin).toLocaleString()}원</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            onClick={() => handleBetClick('long')}
            className="h-14 text-lg font-bold bg-up hover:bg-up/90 text-white"
            data-testid="button-long"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            LONG
          </Button>
          <Button 
            onClick={() => handleBetClick('short')}
            className="h-14 text-lg font-bold bg-down hover:bg-down/90 text-white"
            data-testid="button-short"
          >
            <TrendingDown className="w-5 h-5 mr-2" />
            SHORT
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, direction: null })}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.direction === 'long' ? (
                <><TrendingUp className="w-5 h-5 text-up" /> LONG 베팅 확인</>
              ) : (
                <><TrendingDown className="w-5 h-5 text-down" /> SHORT 베팅 확인</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">종목</span>
                    <span className="font-medium text-foreground">{game.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">방향</span>
                    <span className={cn(
                      "font-bold",
                      confirmDialog.direction === 'long' ? "text-up" : "text-down"
                    )}>
                      {confirmDialog.direction === 'long' ? 'LONG (상승)' : 'SHORT (하락)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">베팅 금액</span>
                    <span className="font-mono font-semibold text-foreground">{betAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예상 수익</span>
                    <span className="font-mono font-bold text-up">+{Math.floor(potentialWin).toLocaleString()}원</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  위 내용으로 베팅하시겠습니까?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/30 border-border hover:bg-muted/50">
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmBet}
              className={cn(
                "font-bold",
                confirmDialog.direction === 'long' 
                  ? "bg-up hover:bg-up/90" 
                  : "bg-down hover:bg-down/90"
              )}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
