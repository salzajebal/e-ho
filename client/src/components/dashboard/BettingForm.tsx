import React, { useState, useEffect, useRef } from "react";
import { cn, formatForexPrice } from "@/lib/utils";
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

interface UserBet {
  id: number;
  roundNumber?: number | null;
  direction: 'long' | 'short';
  outcome: 'pending' | 'win' | 'lose';
  strikePrice: string;
  closePrice?: string | null;
  createdAt: string;
  symbol: string;
  duration: number;
}

interface BettingFormProps {
  currentPrice: number;
  game: Game;
  balance?: string;
  onBet: (direction: 'long' | 'short', amount: number) => void;
  userBets?: UserBet[];
  allPrices?: Record<string, number>;
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

// Get KST date string for storage key (YYYY-MM-DD format)
const getKSTDateString = (): string => {
  const kstDate = getKSTDate();
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Storage key for game results per game type (using KST date)
const getStorageKey = (gameId: string) => `gameResults_${gameId}_${getKSTDateString()}`;

// Clean up old localStorage keys for game results (older than today)
const cleanupOldGameResults = (gameId: string) => {
  const todayKey = getStorageKey(gameId);
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Remove old format keys (without date suffix)
      if (key === `gameResults_${gameId}`) {
        keysToRemove.push(key);
      }
      // Remove old date keys (not today)
      else if (key.startsWith(`gameResults_${gameId}_`) && key !== todayKey) {
        keysToRemove.push(key);
      }
      // Also remove any gameResults keys that start with this gameId but have different formats
      else if (key.startsWith('gameResults_') && key.includes(gameId) && key !== todayKey && !key.match(/\d{4}-\d{2}-\d{2}$/)) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// Generate all past results for a game (entire day up to current round)
const generateAllPastResults = (gameId: string, duration: number, basePrice: number): GameResult[] => {
  // Clean up old date results first
  cleanupOldGameResults(gameId);
  
  const currentRound = calculateRoundNumber(duration);
  const results: GameResult[] = [];
  
  // Get existing results from localStorage (today only)
  const storageKey = getStorageKey(gameId);
  const saved = localStorage.getItem(storageKey);
  let existingResults: GameResult[] = [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // CRITICAL: Filter out any results with round numbers >= currentRound
        // This ensures old data from previous days doesn't show up
        existingResults = parsed.filter((r: GameResult) => 
          typeof r.round === 'number' && r.round > 0 && r.round < currentRound
        );
        
        // If we filtered out results, clear localStorage and start fresh
        if (existingResults.length !== parsed.length) {
          localStorage.removeItem(storageKey);
          existingResults = [];
        }
      }
    } catch (e) {
      localStorage.removeItem(storageKey);
      existingResults = [];
    }
  }
  
  // Create a set of existing round numbers for quick lookup
  const existingRounds = new Set(existingResults.map(r => r.round));
  
  // Only generate results for recent rounds (limit to last 50 for performance)
  const startRound = Math.max(1, currentRound - 50);
  
  // Generate all past rounds that don't exist yet
  for (let round = currentRound - 1; round >= startRound; round--) {
    if (existingRounds.has(round)) {
      // Use existing result
      const existing = existingResults.find(r => r.round === round);
      if (existing) {
        results.push(existing);
      }
    } else {
      // Generate simulated result based on seeded random
      // Use full gameId hash for better differentiation between BTC and ETH
      let gameIdHash = 0;
      for (let i = 0; i < gameId.length; i++) {
        gameIdHash = ((gameIdHash << 5) - gameIdHash) + gameId.charCodeAt(i);
        gameIdHash = gameIdHash & gameIdHash; // Convert to 32bit integer
      }
      const seed = round * 7919 + duration * 7907 + Math.abs(gameIdHash) * 7901;
      const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
      const direction: 'up' | 'down' = pseudoRandom > 0.5 ? 'up' : 'down';
      
      // Calculate time for this round (KST start time of the round)
      const secondsSinceStart = (round - 1) * duration;
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
  
  // Save to localStorage (only valid results)
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

interface ForcedDirection {
  id: number;
  symbol: string;
  duration: number;
  roundNumber: number;
  forcedDirection: 'up' | 'down';
  dateKey: string;
}

export function BettingForm({ currentPrice, game, balance, onBet, userBets = [], allPrices = {} }: BettingFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [currentRound, setCurrentRound] = useState(calculateRoundNumber(game.duration));
  const [timeRemaining, setTimeRemaining] = useState(getRoundTimeRemaining(game.duration));
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [betConfirmation, setBetConfirmation] = useState<BetConfirmation>({ show: false, direction: 'long', amount: 0, price: 0, round: 0 });
  const [timeAlert, setTimeAlert] = useState<TimeAlert>({ show: false, message: '' });
  const [forcedDirections, setForcedDirections] = useState<ForcedDirection[]>([]);
  const allGamesStateRef = useRef<AllGamesState>({});
  const lastPriceRef = useRef<number>(currentPrice);
  const allPricesRef = useRef<Record<string, number>>(allPrices);
  const gameDurationRef = useRef<number>(game.duration);
  const gameIdRef = useRef<string>(game.id);
  const maxRounds = getMaxRoundsPerDay(game.duration);
  const availableBalance = balance ? parseFloat(balance) : 0;

  useEffect(() => {
    gameDurationRef.current = game.duration;
    gameIdRef.current = game.id;
    setCurrentRound(calculateRoundNumber(game.duration));
    setTimeRemaining(getRoundTimeRemaining(game.duration));
  }, [game.duration, game.id]);

  // Fetch forced directions from server
  useEffect(() => {
    const fetchForcedDirections = async () => {
      try {
        const res = await fetch('/api/round-forced');
        if (res.ok) {
          const data = await res.json();
          setForcedDirections(data);
        }
      } catch (error) {
        console.error('Failed to fetch forced directions:', error);
      }
    };
    fetchForcedDirections();
    // Refresh every 30 seconds
    const interval = setInterval(fetchForcedDirections, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    lastPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    allPricesRef.current = allPrices;
  }, [allPrices]);

  // Load and generate all past results for current game, prioritizing user's actual bet results
  useEffect(() => {
    // Get completed bets for current game (matching symbol AND duration)
    const completedBets = userBets.filter(bet => 
      bet.outcome !== 'pending' && 
      bet.symbol === game.symbol &&
      bet.duration === game.duration &&
      bet.roundNumber != null &&
      bet.closePrice != null
    );
    
    // Create results from user's actual bets (these reflect forced directions)
    // The server manipulates closePrice to match forced direction:
    // - forced "매수"(up) → closePrice > strikePrice
    // - forced "매도"(down) → closePrice < strikePrice
    const betResultsByRound = new Map<number, GameResult>();
    completedBets.forEach(bet => {
      const strikePrice = parseFloat(bet.strikePrice);
      const closePrice = parseFloat(bet.closePrice || '0');
      // Server adjusts closePrice to reflect forced direction
      const direction: 'up' | 'down' = closePrice >= strikePrice ? 'up' : 'down';
      
      const betDate = new Date(bet.createdAt);
      const timeStr = betDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      betResultsByRound.set(bet.roundNumber!, {
        round: bet.roundNumber!,
        direction,
        time: timeStr,
      });
    });
    
    // Get existing generated results
    const generatedResults = generateAllPastResults(game.id, game.duration, currentPrice);
    
    // Build final results: user bet results take priority over generated results
    const finalResults: GameResult[] = [];
    const usedRounds = new Set<number>();
    
    // First, add all user bet results (these are the authoritative source for forced directions)
    betResultsByRound.forEach((result, round) => {
      finalResults.push(result);
      usedRounds.add(round);
    });
    
    // Then, add generated results for rounds without user bets
    // Apply forced directions from server
    const todayKey = getKSTDateString();
    const forcedForGame = forcedDirections.filter(
      fd => fd.symbol === game.symbol && fd.duration === game.duration && fd.dateKey === todayKey
    );
    const forcedMap = new Map<number, 'up' | 'down'>();
    forcedForGame.forEach(fd => {
      forcedMap.set(fd.roundNumber, fd.forcedDirection);
    });

    generatedResults.forEach(genResult => {
      if (!usedRounds.has(genResult.round)) {
        // Check if this round has a forced direction
        const forcedDir = forcedMap.get(genResult.round);
        if (forcedDir) {
          finalResults.push({
            ...genResult,
            direction: forcedDir,
          });
        } else {
          finalResults.push(genResult);
        }
      }
    });
    
    // Get current round to filter out invalid results
    const currentRoundNow = calculateRoundNumber(game.duration);
    
    // Filter out any results >= current round (shouldn't exist)
    const validResults = finalResults.filter(r => r.round > 0 && r.round < currentRoundNow);
    
    // Sort by round descending (most recent first) - highest round number at top
    validResults.sort((a, b) => b.round - a.round);
    
    setGameResults(validResults);
  }, [game.id, game.duration, game.symbol, currentPrice, userBets, forcedDirections]);

  // Track round changes for ALL 12 games simultaneously
  useEffect(() => {
    const checkAllGames = () => {
      const kstTime = getKSTDate();
      const timeStr = kstTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const dur = gameDurationRef.current;
      const gid = gameIdRef.current;
      
      const newRound = calculateRoundNumber(dur);
      const newTime = getRoundTimeRemaining(dur);
      setCurrentRound(newRound);
      setTimeRemaining(newTime);
      
      TRADING_GAMES.forEach((g) => {
        const gameId = g.id;
        const duration = g.duration;
        const symbol = g.symbol;
        const currentRoundForGame = calculateRoundNumber(duration);
        const symbolPrice = allPricesRef.current[symbol];
        
        if (!symbolPrice) return;
        
        if (!allGamesStateRef.current[gameId]) {
          allGamesStateRef.current[gameId] = {
            lastRound: currentRoundForGame,
            roundStartPrice: symbolPrice,
          };
          return;
        }
        
        const gameState = allGamesStateRef.current[gameId];
        
        if (currentRoundForGame > gameState.lastRound) {
          const closePrice = symbolPrice;
          const openPrice = gameState.roundStartPrice;
          const direction = closePrice >= openPrice ? 'up' : 'down';
          
          const newResult: GameResult = {
            round: gameState.lastRound,
            direction,
            time: timeStr,
          };
          
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
          
          if (gameId === gid) {
            setGameResults(updated);
          }
          
          allGamesStateRef.current[gameId] = {
            lastRound: currentRoundForGame,
            roundStartPrice: symbolPrice,
          };
        }
      });
    };
    
    checkAllGames();
    const interval = setInterval(checkAllGames, 1000);
    return () => clearInterval(interval);
  }, []);

  const betAmount = parseFloat(amount) || 0;
  const potentialWin = betAmount * MULTIPLIER;

  const formatDuration = (seconds: number) => {
    return `${seconds / 60}분`;
  };

  const lockThreshold = game.duration <= 60 ? 10 : game.duration <= 180 ? 15 : 20;
  const isBettingLocked = timeRemaining <= lockThreshold;

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
      
      setBetConfirmation({
        show: true,
        direction,
        amount: numAmount,
        price: currentPrice,
        round: currentRound,
      });
    }
  };

  const handleMaxBetClick = (direction: 'long' | 'short') => {
    if (isBettingLocked) {
      toast.error("거래 마감 임박으로 주문이 불가합니다.");
      return;
    }
    if (availableBalance < 10000) {
      toast.error("잔고가 부족합니다. 최소 주문금액은 10,000원입니다.");
      return;
    }
    const maxAmount = Math.floor(availableBalance);
    setAmount(maxAmount.toString());
    setBetConfirmation({
      show: true,
      direction,
      amount: maxAmount,
      price: currentPrice,
      round: currentRound,
    });
  };

  const confirmBet = () => {
    onBet(betConfirmation.direction, betConfirmation.amount);
    setBetConfirmation(prev => ({ ...prev, show: false }));
    setAmount("");
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
      </div>

      <div className="p-3 lg:p-4 space-y-3 lg:space-y-3 lg:flex-1 lg:overflow-y-auto lg:flex lg:flex-col">
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
              isBettingLocked ? "bg-red-500/20 animate-pulse" : "bg-blue-500/20"
            )}>
              <Timer className={cn("w-3.5 h-3.5", isBettingLocked ? "text-red-500" : "text-blue-500")} />
              <span className={cn(
                "text-lg font-bold font-mono",
                isBettingLocked ? "text-red-500" : "text-blue-500"
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
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
            <span className="text-red-500 font-medium text-xs">거래 마감 ({formatDuration(game.duration)} 회차) - 다음 회차를 기다려주세요</span>
          </div>
        )}

        <div className="flex gap-2 pt-1 lg:pt-2">
          <div className="flex flex-1 min-w-0">
            <Button 
              onClick={() => handleBetClick('long')}
              disabled={isBettingLocked}
              className={cn(
                "h-11 lg:h-14 text-sm lg:text-base font-bold text-white flex items-center justify-center gap-1.5 flex-1 rounded-r-none",
                isBettingLocked 
                  ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                  : "bg-up hover:bg-up/90"
              )}
              data-testid="button-long"
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              LONG
            </Button>
            <Button 
              onClick={() => handleMaxBetClick('long')}
              disabled={isBettingLocked}
              className={cn(
                "h-11 lg:h-14 text-[10px] lg:text-xs font-bold text-white/90 px-2 rounded-l-none border-l border-white/20 shrink-0",
                isBettingLocked 
                  ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                  : "bg-up/80 hover:bg-up/70"
              )}
              data-testid="button-long-max"
            >
              MAX
            </Button>
          </div>
          <div className="flex flex-1 min-w-0">
            <Button 
              onClick={() => handleBetClick('short')}
              disabled={isBettingLocked}
              className={cn(
                "h-11 lg:h-14 text-sm lg:text-base font-bold text-white flex items-center justify-center gap-1.5 flex-1 rounded-r-none",
                isBettingLocked 
                  ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                  : "bg-down hover:bg-down/90"
              )}
              data-testid="button-short"
            >
              <TrendingDown className="w-4 h-4 shrink-0" />
              SHORT
            </Button>
            <Button 
              onClick={() => handleMaxBetClick('short')}
              disabled={isBettingLocked}
              className={cn(
                "h-11 lg:h-14 text-[10px] lg:text-xs font-bold text-white/90 px-2 rounded-l-none border-l border-white/20 shrink-0",
                isBettingLocked 
                  ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                  : "bg-down/80 hover:bg-down/70"
              )}
              data-testid="button-short-max"
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Game Results Section */}
        <div className="border-t border-border pt-3 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
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
            <ScrollArea className="h-[200px] lg:flex-1 lg:h-0 lg:min-h-[120px]">
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
                      <span>{result.direction === 'up' ? 'LONG' : 'SHORT'}</span>
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
              {betConfirmation.direction === 'long' ? 'LONG' : 'SHORT'}
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
                <span className="text-foreground font-mono">{formatForexPrice(betConfirmation.price, game.symbol)}</span>
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
