import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message } from "@shared/schema";

export function useMessages() {
  return useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10000,
  });
}

export function useUnreadMessages() {
  return useQuery<Message[]>({
    queryKey: ["/api/messages/unread"],
    queryFn: async () => {
      const res = await fetch("/api/messages/unread");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5000,
    refetchInterval: 3000,
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark message as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread"] });
    },
  });
}

export function useMarkAllMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/messages/read-all", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark all messages as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread"] });
    },
  });
}
