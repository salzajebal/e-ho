import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Bet {
  id: number;
  userId: string;
  symbol: string;
  direction: 'long' | 'short';
  amount: string;
  duration: number;
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
        throw new Error(error.error || "Failed to place bet");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      toast.success(`${data.direction === 'long' ? 'LONG' : 'SHORT'} 베팅 ${Math.floor(parseFloat(data.amount)).toLocaleString()}원 완료!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
        toast.success(`🎉 베팅 성공! +${Math.floor(parseFloat(data.payout)).toLocaleString()}원`);
      } else {
        toast.error(`베팅 실패! -${Math.floor(parseFloat(data.amount)).toLocaleString()}원`);
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
