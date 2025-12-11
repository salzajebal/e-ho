import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Position {
  id: number;
  userId: string;
  symbol: string;
  side: 'long' | 'short';
  size: string;
  leverage: number;
  entryPrice: string;
  markPrice: string;
  liquidationPrice: string;
  margin: string;
  pnl: string;
  pnlPercent: string;
  isOpen: boolean;
  openedAt: string;
  closedAt: string | null;
}

export function usePositions() {
  return useQuery<Position[]>({
    queryKey: ["/api/positions"],
    queryFn: async () => {
      const res = await fetch("/api/positions");
      if (!res.ok) throw new Error("Failed to fetch positions");
      return res.json();
    },
    refetchInterval: 2000, // Refetch every 2s for live updates
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (position: {
      symbol: string;
      side: string;
      size: string;
      leverage: number;
      entryPrice: string;
      markPrice: string;
      liquidationPrice: string;
      margin: string;
      pnl: string;
      pnlPercent: string;
      isOpen: boolean;
    }) => {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(position),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create position");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, closePrice, pnl }: { id: number; closePrice: string; pnl: string }) => {
      const res = await fetch(`/api/positions/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice, pnl }),
      });
      if (!res.ok) throw new Error("Failed to close position");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      toast.success("포지션이 종료되었습니다.");
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
  });
}
