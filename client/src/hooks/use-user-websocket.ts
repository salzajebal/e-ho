import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// 알림 소리 재생 (Web Audio API)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // 첫 번째 음 (높은 음)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);
    // 두 번째 음 (더 높은 음)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    // 소리 재생 실패 시 무시
  }
}

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
            queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
            
            // 알림 소리 재생
            playNotificationSound();
            
            // 토스트 알림
            toast("📩 1:1 문의 답변이 도착했습니다", {
              description: data.data?.title || "고객센터 답변을 확인해 주세요",
              action: {
                label: "문의 확인",
                onClick: () => {
                  optionsRef.current?.onInquiryReplied?.();
                },
              },
              duration: 10000,
            });
            
            // Trigger callback to show floating notification in Home component
            optionsRef.current?.onInquiryReplied?.();
          }
          
          if (data.event === 'transaction_processed') {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
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
          
          if (data.event === 'bet_direction_changed') {
            queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/bets/active"] });
          }
          
          if (data.event === 'bet_settled') {
            queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/bets/active"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
          }

          // Handle force logout from admin
          if (data.event === 'force_logout') {
            // Close WebSocket connection
            ws.close();
            
            // Clear session by calling logout endpoint
            fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
              // Show alert and redirect to login page
              alert('로그아웃 되었습니다.');
              window.location.href = '/';
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        
        // Only retry for unexpected disconnections (not auth failures)
        if (isAuthenticated && event.code !== 4001 && event.code !== 4003 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Silent error handling - WebSocket errors are expected when not authenticated
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
