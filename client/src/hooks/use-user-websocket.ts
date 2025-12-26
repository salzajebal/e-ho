import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WebSocketOptions {
  onNewMessage?: () => void;
  onInquiryReplied?: () => void;
  onTransactionProcessed?: () => void;
}

export function useUserWebSocket(isAuthenticated: boolean, options?: WebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const optionsRef = useRef(options);
  
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (!isAuthenticated || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/user`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('User WebSocket connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'message:new') {
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages/unread"] });
            
            toast("새 쪽지가 도착했습니다", {
              description: data.data?.title || "새로운 메시지가 있습니다",
              action: {
                label: "쪽지함 열기",
                onClick: () => {
                  optionsRef.current?.onNewMessage?.();
                },
              },
              duration: 10000,
            });
          }
          
          if (data.event === 'inquiry_replied') {
            queryClient.invalidateQueries({ queryKey: ["/api/inquiries/my"] });
            
            toast.success("문의 답변이 등록되었습니다", {
              description: "내 문의 내역에서 확인하세요",
              duration: 5000,
            });
            
            optionsRef.current?.onInquiryReplied?.();
          }
          
          if (data.event === 'transaction_processed') {
            queryClient.invalidateQueries({ queryKey: ["/api/inquiries/my"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
            
            const status = data.data?.status;
            const type = data.data?.type;
            const statusText = status === 'approved' ? '승인' : '거절';
            const typeText = type === 'deposit' ? '입금' : '출금';
            
            toast.success(`${typeText} 신청이 ${statusText}되었습니다`, {
              duration: 5000,
            });
            
            optionsRef.current?.onTransactionProcessed?.();
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('User WebSocket disconnected:', event.code);
        wsRef.current = null;
        
        if (isAuthenticated && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('User WebSocket error:', error);
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
