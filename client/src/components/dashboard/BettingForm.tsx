import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn, formatForexPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock, Hash, Timer, History, AlertCircle, Wallet } from "lucide-react";
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
  isBetting?: boolean;
  userBets?: UserBet[];
  allPrices?: Record<string, number>;
  underMaintenance?: boolean;
}

interface GameResult {
  round: number;
  direction: 'up' | 'down';
  time: string;
  displayAfter?: number;
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

// Read real-time results from localStorage (written by checkAllGames only)
const getStoredResults = (gameId: string, duration: number): GameResult[] => {
  const storageKey = getStorageKey(gameId);
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    const currentRound = calculateRoundNumber(duration);
    return parsed.filter((r: GameResult) => 
      typeof r.round === 'number' && r.round > 0 && r.round < currentRound
    );
  } catch {
    return [];
  }
};

// Generate deterministic pseudo-random direction for a round (always same result for same inputs)
const getPseudoRandomDirection = (gameId: string, duration: number, round: number): 'up' | 'down' => {
  let gameIdHash = 0;
  for (let i = 0; i < gameId.length; i++) {
    gameIdHash = ((gameIdHash << 5) - gameIdHash) + gameId.charCodeAt(i);
    gameIdHash = gameIdHash & gameIdHash;
  }
  const seed = round * 7919 + duration * 7907 + Math.abs(gameIdHash) * 7901;
  const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
  return pseudoRandom > 0.5 ? 'up' : 'down';
};

// Generate all past results for a game (read-only, does NOT write to localStorage)
const generateAllPastResults = (gameId: string, duration: number): GameResult[] => {
  cleanupOldGameResults(gameId);
  
  const currentRound = calculateRoundNumber(duration);
  const results: GameResult[] = [];
  
  const storedResults = getStoredResults(gameId, duration);
  const storedRounds = new Map<number, GameResult>();
  storedResults.forEach(r => storedRounds.set(r.round, r));
  
  const startRound = Math.max(1, currentRound - 50);
  
  for (let round = currentRound - 1; round >= startRound; round--) {
    if (storedRounds.has(round)) {
      results.push(storedRounds.get(round)!);
    } else {
      const direction = getPseudoRandomDirection(gameId, duration, round);
      const secondsSinceStart = (round - 1) * duration;
      const hours = Math.floor(secondsSinceStart / 3600);
      const minutes = Math.floor((secondsSinceStart % 3600) / 60);
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      results.push({ round, direction, time: timeStr });
    }
  }
  
  results.sort((a, b) => b.round - a.round);
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
  forcedDirection: 'up' | 'down' | 'display_up' | 'display_down';
  dateKey: string;
}

export function BettingForm({ currentPrice, game, balance, onBet, isBetting = false, userBets = [], allPrices = {}, underMaintenance = false }: BettingFormProps) {
  const { data: maxExecutionData } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/max-execution-status"],
    queryFn: async () => {
      const res = await fetch("/api/max-execution-status", { credentials: "include" });
      if (!res.ok) return { enabled: false };
      return res.json();
    },
    refetchInterval: 3000,
  });

  const [amount, setAmount] = useState<string>("");
  const [currentRound, setCurrentRound] = useState(calculateRoundNumber(game.duration));
  const [timeRemaining, setTimeRemaining] = useState(getRoundTimeRemaining(game.duration));
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [betConfirmation, setBetConfirmation] = useState<BetConfirmation>({ show: false, direction: 'long', amount: 0, price: 0, round: 0 });
  // justPlacedBet: 베팅 확인 즉시 대기 화면을 보여주기 위한 로컬 상태 (API 응답 전까지 유지)
  const [justPlacedBet, setJustPlacedBet] = useState<{ direction: 'long' | 'short'; round: number } | null>(null);
  const [timeAlert, setTimeAlert] = useState<TimeAlert>({ show: false, message: '' });
  const [settlementFlash, setSettlementFlash] = useState<{ show: boolean; direction: 'up' | 'down' }>({ show: false, direction: 'up' });
  const lastFlashedRoundRef = useRef<number>(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [forcedDirections, setForcedDirections] = useState<ForcedDirection[]>([]);
  const [resultRefreshTrigger, setResultRefreshTrigger] = useState(0);
  const allGamesStateRef = useRef<AllGamesState>({});
  const roundCompletionTimesRef = useRef<Map<string, number>>(new Map());
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
    const interval = setInterval(fetchForcedDirections, 5000);
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
    const pendingBetRounds = new Set<number>();
    
    // Track pending bets - don't show generated results for these rounds
    userBets.filter(bet => 
      bet.outcome === 'pending' && 
      bet.symbol === game.symbol &&
      bet.duration === game.duration &&
      bet.roundNumber != null
    ).forEach(bet => {
      pendingBetRounds.add(bet.roundNumber!);
    });
    
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
    
    const generatedResults = generateAllPastResults(game.id, game.duration);
    
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
    const displayForcedMap = new Map<number, 'up' | 'down'>();
    forcedForGame.forEach(fd => {
      if (fd.forcedDirection === 'display_up' || fd.forcedDirection === 'display_down') {
        displayForcedMap.set(fd.roundNumber, fd.forcedDirection === 'display_up' ? 'up' : 'down');
      } else if (fd.forcedDirection === 'up' || fd.forcedDirection === 'down') {
        forcedMap.set(fd.roundNumber, fd.forcedDirection);
      }
    });

    // Override bet results with display forced direction (display only, not affecting settlement)
    betResultsByRound.forEach((result, round) => {
      const displayDir = displayForcedMap.get(round);
      if (displayDir) {
        betResultsByRound.set(round, { ...result, direction: displayDir });
      }
    });

    // Rebuild final results with display overrides
    finalResults.length = 0;
    usedRounds.clear();
    betResultsByRound.forEach((result, round) => {
      finalResults.push(result);
      usedRounds.add(round);
    });

    generatedResults.forEach(genResult => {
      if (!usedRounds.has(genResult.round)) {
        if (pendingBetRounds.has(genResult.round)) return;
        
        const displayDir = displayForcedMap.get(genResult.round);
        const forcedDir = displayDir || forcedMap.get(genResult.round);
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
    
    const currentRoundNow = calculateRoundNumber(game.duration);
    const now = Date.now();
    
    const validResults = finalResults.filter(r => {
      if (r.round <= 0 || r.round >= currentRoundNow) return false;
      
      const completionKey = `${game.id}_${r.round}`;
      const completionTime = roundCompletionTimesRef.current.get(completionKey);
      if (completionTime && (now - completionTime) < 5000) return false;
      
      return true;
    });
    
    // Sort by round descending (most recent first) - highest round number at top
    validResults.sort((a, b) => b.round - a.round);
    
    setGameResults(validResults);
  }, [game.id, game.duration, game.symbol, userBets, forcedDirections, resultRefreshTrigger]);

  // Settlement flash: show large 매수/매도 when new round result appears
  useEffect(() => {
    if (gameResults.length === 0) return;
    const latest = gameResults[0];
    if (lastFlashedRoundRef.current === 0) {
      // 초기 로드: 기존 결과는 플래시 없이 현재 회차만 기록
      lastFlashedRoundRef.current = latest.round;
      return;
    }
    if (latest.round > lastFlashedRoundRef.current) {
      lastFlashedRoundRef.current = latest.round;
      // 기존 타이머가 있으면 먼저 취소 (중복 방지)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setSettlementFlash({ show: true, direction: latest.direction });
      // ref에 타이머 저장 → gameResults 재업데이트로 인한 cleanup에 취소되지 않음
      flashTimerRef.current = setTimeout(() => {
        setSettlementFlash(prev => ({ ...prev, show: false }));
        flashTimerRef.current = null;
      }, 2500);
    }
    // cleanup 없음: gameResults 변경 시 타이머가 취소되지 않도록 의도적으로 생략
  }, [gameResults]);

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
          const completedRound = gameState.lastRound;
          const completionTime = Date.now();
          
          const newResult: GameResult = {
            round: completedRound,
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
          const existingIdx = results.findIndex(r => r.round === completedRound);
          if (existingIdx >= 0) {
            results[existingIdx] = newResult;
          } else {
            results.unshift(newResult);
          }
          localStorage.setItem(storageKey, JSON.stringify(results));
          
          const completionKey = `${gameId}_${completedRound}`;
          roundCompletionTimesRef.current.set(completionKey, completionTime);
          
          setTimeout(() => {
            if (gameIdRef.current === gameId) {
              setResultRefreshTrigger(prev => prev + 1);
            }
          }, 5000);
          
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

  const lockThreshold = game.duration <= 60 ? 10 : game.duration <= 180 ? 15 : 60;
  const isBettingLocked = timeRemaining <= lockThreshold;

  // Clear justPlacedBet when the round changes (new round started = previous bet settled or expired)
  useEffect(() => {
    if (justPlacedBet && justPlacedBet.round !== currentRound) {
      setJustPlacedBet(null);
    }
  }, [currentRound, justPlacedBet]);

  // Calculate the current round's start time in milliseconds (for time-based check)
  const currentRoundStartMs = (() => {
    const kstTime = getKSTDate();
    const secondsSinceMidnight = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
    const roundStartSeconds = Math.floor(secondsSinceMidnight / game.duration) * game.duration;
    return kstTime.getTime() - (secondsSinceMidnight - roundStartSeconds) * 1000;
  })();

  // Check if user already has a pending bet for the current round
  // Uses two methods to be robust against timing/cache issues:
  // 1. justPlacedBet: set immediately upon confirmation (no API delay)
  // 2. userBets check: looks for pending bet created in current round's time window (no roundNumber mismatch)
  const pendingBetFromApi = userBets.find(bet =>
    bet.outcome === 'pending' &&
    bet.symbol === game.symbol &&
    Number(bet.duration) === game.duration &&
    (
      bet.roundNumber === currentRound ||
      new Date(bet.createdAt).getTime() >= currentRoundStartMs
    )
  );
  const currentRoundPendingBet = pendingBetFromApi
    ? pendingBetFromApi
    : justPlacedBet
      ? { direction: justPlacedBet.direction, roundNumber: justPlacedBet.round }
      : null;

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
      toast.error("보유금액이 부족합니다.");
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

  const [maxExecutionAlert, setMaxExecutionAlert] = useState(false);

  const handleMaxBetClick = (direction: 'long' | 'short') => {
    if (!maxExecutionData?.enabled) {
      setMaxExecutionAlert(true);
      return;
    }
    if (isBettingLocked) {
      toast.error("거래 마감 임박으로 주문이 불가합니다.");
      return;
    }
    if (availableBalance < 10000) {
      toast.error("보유금액이 부족합니다. 최소 주문금액은 10,000원입니다.");
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

  const handleMaxFillClick = () => {
    if (availableBalance < 10000) {
      toast.error("보유금액이 부족합니다. 최소 주문금액은 10,000원입니다.");
      return;
    }
    setAmount(Math.floor(availableBalance).toString());
  };

  const confirmBet = () => {
    if (isBetting) return;
    // 즉시 대기 화면 표시 (API 응답 전에도)
    setJustPlacedBet({ direction: betConfirmation.direction, round: betConfirmation.round });
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
    <div className="relative flex flex-col lg:h-full bg-card w-full">
      {/* 결과 플래시 오버레이 */}
      <div
        className={cn(
          "absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500",
          settlementFlash.show ? "opacity-100" : "opacity-0"
        )}
        style={{ background: settlementFlash.direction === 'up' ? 'rgba(0,200,100,0.13)' : 'rgba(220,60,60,0.13)' }}
      >
        <div className={cn(
          "flex flex-col items-center gap-2 transition-transform duration-500",
          settlementFlash.show ? "scale-100" : "scale-75"
        )}>
          {settlementFlash.direction === 'up' ? (
            <TrendingUp className="w-20 h-20 text-up drop-shadow-lg" strokeWidth={2.5} />
          ) : (
            <TrendingDown className="w-20 h-20 text-down drop-shadow-lg" strokeWidth={2.5} />
          )}
          <span className={cn(
            "text-6xl font-black tracking-tight drop-shadow-lg",
            settlementFlash.direction === 'up' ? "text-up" : "text-down"
          )}>
            {settlementFlash.direction === 'up' ? '매수' : '매도'}
          </span>
        </div>
      </div>

      {/* 점검 오버레이 */}
      {underMaintenance && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm rounded">
          <div className="text-center space-y-3 px-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-base font-bold text-foreground">서버 점검 중</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {game.symbol} 종목은 현재 서버 점검 중입니다.<br />
              점검이 완료되면 거래가 재개됩니다.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 lg:px-4 h-10 border-b border-border bg-muted/20 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">주문</h2>
      </div>

      <div className="p-3 lg:p-4 space-y-3 lg:space-y-3 lg:flex-1 lg:overflow-y-auto lg:flex lg:flex-col">
        <div className="bg-primary/10 rounded-lg p-2 lg:p-3 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground text-sm lg:text-base">{game.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center justify-center bg-yellow-500/20 rounded py-2 px-2 overflow-hidden">
              <span className="text-xs font-bold text-yellow-500 truncate">
                #{currentRound}회차 {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
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

        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="w-3.5 h-3.5" />
            <span>보유금액</span>
          </div>
          <span
            data-testid="text-available-balance"
            className={cn(
              "text-sm font-bold font-mono",
              availableBalance < 10000 ? "text-destructive" : "text-primary"
            )}
          >
            ₩{Math.floor(availableBalance).toLocaleString()}
          </span>
        </div>

        {currentRoundPendingBet ? (
          /* 이미 이번 회차에 베팅한 경우 대기 화면 표시 */
          <div className="flex flex-col items-center justify-center gap-3 py-4 px-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-bold text-primary">거래 체결 대기 중</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm",
              currentRoundPendingBet.direction === 'long'
                ? "bg-up/20 text-up"
                : "bg-down/20 text-down"
            )}>
              {currentRoundPendingBet.direction === 'long' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {currentRoundPendingBet.direction === 'long' ? '매수' : '매도'} 주문 완료
            </div>
            <p className="text-xs text-muted-foreground text-center">
              #{currentRound}회차 종료 후 결과가 자동으로 반영됩니다
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">주문금액 (원)</label>
              <div className="relative">
                <Input 
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAmount(val);
                  }}
                  onFocus={handleAmountFocus}
                  onPaste={handlePaste}
                  onCopy={handleCopy}
                  className="font-mono text-base lg:text-lg text-right pr-10 h-10 lg:h-12 bg-input border-border focus-visible:ring-primary [appearance:textfield]"
                  data-testid="input-bet-amount"
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

            <div className="flex flex-col gap-1.5 pt-1 lg:pt-2">
              <Button 
                onClick={handleMaxFillClick}
                className="h-9 lg:h-10 text-xs lg:text-sm font-bold text-white flex items-center justify-center gap-1 w-full bg-gray-500 hover:bg-gray-400"
                data-testid="button-max"
              >
                MAX
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleBetClick('long')}
                  disabled={isBettingLocked}
                  className={cn(
                    "h-11 lg:h-14 text-sm lg:text-base font-bold text-white flex items-center justify-center gap-1.5 flex-1",
                    isBettingLocked 
                      ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                      : "bg-up hover:bg-up/90"
                  )}
                  data-testid="button-long"
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  매수
                </Button>
                <Button 
                  onClick={() => handleBetClick('short')}
                  disabled={isBettingLocked}
                  className={cn(
                    "h-11 lg:h-14 text-sm lg:text-base font-bold text-white flex items-center justify-center gap-1.5 flex-1",
                    isBettingLocked 
                      ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-50" 
                      : "bg-down hover:bg-down/90"
                  )}
                  data-testid="button-short"
                >
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  매도
                </Button>
              </div>
            </div>
          </>
        )}

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
                      <span className="text-muted-foreground font-mono">#{result.round}회차</span>
                      <span className="text-muted-foreground/70">{result.time}</span>
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
                <span className="text-primary font-bold">#{betConfirmation.round}회차 {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
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
                disabled={isBetting}
                className={cn(
                  "w-full text-white",
                  betConfirmation.direction === 'long' ? "bg-up hover:bg-up/90" : "bg-down hover:bg-down/90"
                )}
              >
                {isBetting ? "처리중..." : "확인"}
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

      {/* Max Execution Alert Dialog */}
      <Dialog open={maxExecutionAlert} onOpenChange={setMaxExecutionAlert}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-bold bg-red-500/20 text-red-500">
              맥스체결 안내
            </div>
            
            <div className="space-y-2">
              <p className="text-foreground leading-relaxed">
                맥스체결이 활성화되어 있지 않습니다.
              </p>
            </div>
            
            <Button 
              onClick={() => setMaxExecutionAlert(false)}
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
