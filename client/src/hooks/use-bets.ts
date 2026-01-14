import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Bet {
  id: number;
  userId: string;
  symbol: string;
  direction: 'long' | 'short';
  amount: string;
  duration: number;
  roundNumber: number | null;
  strikePrice: string;
  closePrice: string | null;
  payout: string | null;
  multiplier: string;
  outcome: 'pending' | 'win' | 'lose';
  expiresAt: string;
  createdAt: string;
  settledAt: string | null;
}

export function useBets() {
  return useQuery<Bet[]>({
    queryKey: ["/api/bets"],
    queryFn: async () => {
      const res = await fetch("/api/bets");
      if (!res.ok) throw new Error("Failed to fetch bets");
      return res.json();
    },
    refetchInterval: 1000,
  });
}

export function useBetHistory() {
  return useQuery<Bet[]>({
    queryKey: ["/api/bets/history"],
    queryFn: async () => {
      const res = await fetch("/api/bets/history");
      if (!res.ok) throw new Error("Failed to fetch bet history");
      return res.json();
    },
    refetchInterval: 3000,
  });
}

class BetBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BetBlockedError';
  }
}

class RoundLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoundLimitError';
  }
}

export function useCreateBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bet: {
      symbol: string;
      direction: 'long' | 'short';
      amount: number;
      duration: number;
      strikePrice: number;
      multiplier?: number;
    }) => {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bet),
      });
      if (!res.ok) {
        const error = await res.json();
        if (res.status === 403 && error.error === "네트워크 오류 거래불가") {
          throw new BetBlockedError(error.error);
        }
        if (res.status === 400 && error.error?.includes("회차당 1회만")) {
          throw new RoundLimitError(error.error);
        }
        throw new Error(error.error || "Failed to place bet");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      const direction = data.direction === 'long' ? '매수' : '매도';
      toast.success(`${direction} 주문이 체결되었습니다`);
    },
    onError: (error: Error) => {
      if (error instanceof BetBlockedError) {
        toast.error("네트워크 오류 거래불가", { duration: 5000 });
        setTimeout(() => alert("네트워크 오류 거래불가"), 100);
      } else if (error instanceof RoundLimitError) {
        toast.error("한 회차당 1회 주문만 가능합니다.", { duration: 5000 });
        setTimeout(() => alert("한 회차당 1회 주문만 가능합니다."), 100);
      } else {
        toast.error(error.message);
      }
    },
  });
}

export function useSettleBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, closePrice }: { id: number; closePrice: number }) => {
      const res = await fetch(`/api/bets/${id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice: closePrice.toString() }),
      });
      if (!res.ok) throw new Error("Failed to settle bet");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      
      if (data.outcome === 'win') {
        toast.success(`🎉 거래 성공! +${Math.floor(parseFloat(data.payout)).toLocaleString()}원`);
      } else {
        toast.error(`거래 실패! -${Math.floor(parseFloat(data.amount)).toLocaleString()}원`);
      }
    },
  });
}

export function useUserBalance() {
  return useQuery<{ balance: string }>({
    queryKey: ["/api/user/balance"],
    queryFn: async () => {
      const res = await fetch("/api/user/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    refetchInterval: 2000,
  });
}
