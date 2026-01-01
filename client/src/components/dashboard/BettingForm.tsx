import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock, Hash, Timer, History, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TRADING_GAMES } from "@/lib/tradingGames";

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

const MULTIPLIER = 1.95;

// Get KST Date
const getKSTDate = (): Date => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
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

// Generate all past results for a game (entire day up to current round)
const generateAllPastResults = (gameId: string, duration: number, basePrice: number): GameResult[] => {
  const currentRound = calculateRoundNumber(duration);
  const results: GameResult[] = [];
  
  // Get existing results from localStorage
  const storageKey = getStorageKey(gameId);
  const saved = localStorage.getItem(storageKey);
  let existingResults: GameResult[] = [];
  if (saved) {
    try {
      existingResults = JSON.parse(saved);
    } catch (e) {
      existingResults = [];
    }
  }
  
  // Create a set of existing round numbers for quick lookup
  const existingRounds = new Set(existingResults.map(r => r.round));
  
  // Generate results for all completed rounds (1 to currentRound-1)
  let simulatedPrice = basePrice;
  
  // Generate all past rounds that don't exist yet
  for (let round = currentRound - 1; round >= 1; round--) {
    if (existingRounds.has(round)) {
      // Use existing result
      const existing = existingResults.find(r => r.round === round);
      if (existing) {
        results.push(existing);
      }
    } else {
      // Generate simulated result based on seeded random
      const seed = round * 7919 + duration * 7907 + gameId.charCodeAt(0) * 7901;
      const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
      const direction: 'up' | 'down' = pseudoRandom > 0.5 ? 'up' : 'down';
      
      // Calculate time for this round
      const secondsSinceStart = round * duration;
      const hours = Math.floor(secondsSinceStart / 3600);
      const minutes = Math.floor((secondsSinceStart % 3600) / 60);
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      results.push({
        round,
        direction,
        time: timeStr,
      });
    }
  }
  
  // Sort by round descending (newest first)
  results.sort((a, b) => b.round - a.round);
  
  // Save to localStorage
  localStorage.setItem(storageKey, JSON.stringify(results));
  
  return results;
};

interface BetConfirmation {
  show: boolean;
  direction: 'long' | 'short';
  amount: number;
  price: number;
  round: number;
}

interface TimeAlert {
  show: boolean;
  message: string;
}

// Track all games state
interface AllGamesState {
  [gameId: string]: {
    lastRound: number;
    roundStartPrice: number;
  };
}

export function BettingForm({ currentPrice, game, balance, onBet }: BettingFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [currentRound, setCurrentRound] = useState(calculateRoundNumber(game.duration));
  const [timeRemaining, setTimeRemaining] = useState(getRoundTimeRemaining(game.duration));
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [betConfirmation, setBetConfirmation] = useState<BetConfirmation>({ show: false, direction: 'long', amount: 0, price: 0, round: 0 });
  const [timeAlert, setTimeAlert] = useState<TimeAlert>({ show: false, message: '' });
  const allGamesStateRef = useRef<AllGamesState>({});
  const lastPriceRef = useRef<number>(currentPrice);
  const maxRounds = getMaxRoundsPerDay(game.duration);
  const availableBalance = balance ? parseFloat(balance) : 0;

  // Update last price ref
  useEffect(() => {
    lastPriceRef.current = currentPrice;
  }, [currentPrice]);

  // Load and generate all past results for current game
  useEffect(() => {
    const allResults = generateAllPastResults(game.id, game.duration, currentPrice);
    setGameResults(allResults);
  }, [game.id, game.duration]);

  // Track round changes for ALL 6 games simultaneously
  useEffect(() => {
    const checkAllGames = () => {
      const kstTime = getKSTDate();
      const timeStr = kstTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Update current game display
      const newRound = calculateRoundNumber(game.duration);
      const newTime = getRoundTimeRemaining(game.duration);
      setCurrentRound(newRound);
      setTimeRemaining(newTime);
      
      // Check each of the 6 games
      TRADING_GAMES.forEach((g) => {
        const gameId = g.id;
        const duration = g.duration;
        const currentRoundForGame = calculateRoundNumber(duration);
        
        // Initialize state for this game if not exists
        if (!allGamesStateRef.current[gameId]) {
          allGamesStateRef.current[gameId] = {
            lastRound: currentRoundForGame,
            roundStartPrice: currentPrice,
          };
          return;
        }
        
        const gameState = allGamesStateRef.current[gameId];
        
        // Round changed for this game - record result
        if (currentRoundForGame > gameState.lastRound) {
          const closePrice = lastPriceRef.current;
          const openPrice = gameState.roundStartPrice;
          const direction = closePrice >= openPrice ? 'up' : 'down';
          
          const newResult: GameResult = {
            round: gameState.lastRound,
            direction,
            time: timeStr,
          };
          
          // Save to localStorage for this game
          const storageKey = getStorageKey(gameId);
          const saved = localStorage.getItem(storageKey);
          let results: GameResult[] = [];
          if (saved) {
            try {
              results = JSON.parse(saved);
            } catch (e) {
              results = [];
            }
          }
          const updated = [newResult, ...results];
          localStorage.setItem(storageKey, JSON.stringify(updated));
          
          // If this is the currently selected game, update state
          if (gameId === game.id) {
            setGameResults(updated);
          }
          
          // Update ref
          allGamesStateRef.current[gameId] = {
            lastRound: currentRoundForGame,
            roundStartPrice: currentPrice,
          };
        }
      });
    };
    
    checkAllGames();
    const interval = setInterval(checkAllGames, 1000);
    return () => clearInterval(interval);
  }, [game.duration, game.id, currentPrice]);

  const betAmount = parseFloat(amount) || 0;
  const potentialWin = betAmount * MULTIPLIER;

  const formatDuration = (seconds: number) => {
    return `${seconds / 60}분`;
  };

  const isBettingLocked = timeRemaining <= 20;

  const validateBet = (direction: 'long' | 'short') => {
    if (isBettingLocked) {
      toast.error("거래 마감 임박으로 주문이 불가합니다.");
      return false;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("유효한 금액을 입력해주세요.");
      return false;
    }

    if (numAmount < 10000) {
      toast.error("최소 주문금액은 10,000원입니다.");
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
      
      // Show confirmation popup before placing bet
      setBetConfirmation({
        show: true,
        direction,
        amount: numAmount,
        price: currentPrice,
        round: currentRound,
      });
    }
  };

  const confirmBet = () => {
    onBet(betConfirmation.direction, betConfirmation.amount);
    setBetConfirmation(prev => ({ ...prev, show: false }));
    setAmount("");
    toast.success(`${betConfirmation.direction === 'long' ? '매수' : '매도'} 주문이 접수되었습니다.`);
  };

  const handleAmountFocus = () => {
    setAmount("");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col lg:h-full bg-card w-full">
      <div className="flex items-center justify-between px-3 lg:px-4 h-10 border-b border-border bg-muted/20 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">주문</h2>
        <span className="text-xs text-muted-foreground">배당률: {MULTIPLIER}배</span>
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
                {currentRound}회차
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
          <label className="text-xs text-muted-foreground">주문금액 (원)</label>
          <div className="relative">
            <Input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={handleAmountFocus}
              onPaste={handlePaste}
              onCopy={handleCopy}
              className="font-mono text-base lg:text-lg text-right pr-10 h-10 lg:h-12 bg-input border-border focus-visible:ring-primary"
              data-testid="input-bet-amount"
              min="1000"
              step="1000"
              placeholder="금액 입력"
            />
            <span className="absolute right-3 top-2.5 lg:top-3.5 text-sm text-muted-foreground">원</span>
          </div>
        </div>


        {isBettingLocked && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
            <span className="text-red-500 font-medium text-xs">거래 마감 - 다음 회차를 기다려주세요</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 lg:gap-3 pt-1 lg:pt-2">
          <Button 
            onClick={() => handleBetClick('long')}
            disabled={isBettingLocked}
            className={cn(
              "h-11 lg:h-14 text-base lg:text-lg font-bold text-white flex items-center justify-center gap-2",
              isBettingLocked 
                ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                : "bg-up hover:bg-up/90"
            )}
            data-testid="button-long"
          >
            <TrendingUp className="w-5 h-5 shrink-0" />
            <span>매수</span>
          </Button>
          <Button 
            onClick={() => handleBetClick('short')}
            disabled={isBettingLocked}
            className={cn(
              "h-11 lg:h-14 text-base lg:text-lg font-bold text-white flex items-center justify-center gap-2",
              isBettingLocked 
                ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                : "bg-down hover:bg-down/90"
            )}
            data-testid="button-short"
          >
            <TrendingDown className="w-5 h-5 shrink-0" />
            <span>매도</span>
          </Button>
        </div>

        {/* Game Results Section */}
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">거래결과</span>
            </div>
            <span className="text-xs text-muted-foreground">{gameResults.length}회</span>
          </div>
          
          {gameResults.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              아직 기록된 게임이 없습니다
            </div>
          ) : (
            <ScrollArea className="h-[140px] lg:h-[180px]">
              <div className="space-y-1">
                {gameResults.map((result, idx) => (
                  <div
                    key={`${result.round}-${idx}`}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded text-xs",
                      idx === 0 ? "bg-muted/30" : "bg-muted/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono w-12">{result.round}회차</span>
                      <span className="text-muted-foreground/70 w-12">{result.time}</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded font-bold",
                      result.direction === 'up' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                    )}>
                      {result.direction === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{result.direction === 'up' ? '매수' : '매도'}</span>
                    </div>
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
              <AlertCircle className={cn(
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
              {betConfirmation.direction === 'long' ? '매수' : '매도'}
            </div>
            
            <div className="space-y-2">
              <p className="text-base text-foreground font-medium">
                주문하시겠습니까?
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">종목</span>
                <span className="text-foreground font-medium">{game.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">회차</span>
                <span className="text-primary font-bold">{betConfirmation.round}회차</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">진입가</span>
                <span className="text-foreground font-mono">{betConfirmation.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                onClick={() => setBetConfirmation(prev => ({ ...prev, show: false }))}
                variant="outline"
                className="w-full"
              >
                취소
              </Button>
              <Button 
                onClick={confirmBet}
                className={cn(
                  "w-full text-white",
                  betConfirmation.direction === 'long' ? "bg-up hover:bg-up/90" : "bg-down hover:bg-down/90"
                )}
              >
                확인
              </Button>
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
              거래시간 안내
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
