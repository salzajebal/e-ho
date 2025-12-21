import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/dashboard/Ticker";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { BettingForm } from "@/components/dashboard/BettingForm";
import { BetsPanel } from "@/components/dashboard/BetsPanel";
import { useMarketData } from "@/lib/marketData";
import { useBets, useBetHistory, useCreateBet, useSettleBet, useUserBalance } from "@/hooks/use-bets";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadMessages, useMessages, useMarkMessageRead, useMarkAllMessagesRead } from "@/hooks/use-messages";
import { useUserWebSocket } from "@/hooks/use-user-websocket";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, X, Check, MessageSquare } from "lucide-react";
import type { Message } from "@shared/schema";
import { TRADING_GAMES } from "@/lib/tradingGames";

export default function Home() {
  const [selectedGameId, setSelectedGameId] = useState("NDX-60");
  const [, setLocation] = useLocation();
  const marketData = useMarketData();
  
  const selectedGame = TRADING_GAMES.find(g => g.id === selectedGameId) || TRADING_GAMES[0];
  
  const { data: user } = useAuth();
  
  // Real-time WebSocket for message notifications
  useUserWebSocket(!!user);
  
  const { data: activeBets = [] } = useBets();
  const { data: historyBets = [] } = useBetHistory();
  const createBet = useCreateBet();
  const settleBet = useSettleBet();
  const { data: balanceData } = useUserBalance();

  // Messages
  const { data: unreadMessages = [] } = useUnreadMessages();
  const { data: allMessages = [] } = useMessages();
  const markMessageRead = useMarkMessageRead();
  const markAllRead = useMarkAllMessagesRead();
  const [messagePopup, setMessagePopup] = useState<Message | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const shownMessageIds = useRef<Set<number>>(new Set());

  // Show popup for new unread messages
  useEffect(() => {
    if (user && unreadMessages.length > 0) {
      const newMessage = unreadMessages.find(m => !shownMessageIds.current.has(m.id));
      if (newMessage) {
        shownMessageIds.current.add(newMessage.id);
        setMessagePopup(newMessage);
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleC4bT3+q0sqLRxIHQZC8z6NsGAI4p+ftoHYjCCJ+l7u7fEsACh8JXXmLmYxpPwAKJiM+a4qdi2xGAAoSDzg/T1tdYV1QQAA=');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }
  }, [user, unreadMessages]);

  const handleClosePopup = () => {
    if (messagePopup) {
      markMessageRead.mutate(messagePopup.id);
    }
    setMessagePopup(null);
  };

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markMessageRead.mutate(message.id);
    }
  };

  const formatMessageDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allBets = useMemo(() => {
    const historyIds = new Set(historyBets.map(b => b.id));
    const uniqueActiveBets = activeBets.filter(b => !historyIds.has(b.id));
    return [...uniqueActiveBets, ...historyBets];
  }, [activeBets, historyBets]);

  const currentMarket = marketData.find(m => m.symbol === selectedGame.symbol) || marketData[0];

  const currentPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    marketData.forEach(m => {
      prices[m.symbol] = m.price;
    });
    return prices;
  }, [marketData]);

  const handleBet = (direction: 'long' | 'short', amount: number) => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      setLocation("/login");
      return;
    }
    
    createBet.mutate({
      symbol: selectedGame.symbol,
      direction,
      amount,
      duration: selectedGame.duration,
      strikePrice: currentMarket.price,
      multiplier: 2.00,
    });
  };

  const handleBetExpire = (bet: any, currentPrice: number) => {
    settleBet.mutate({
      id: bet.id,
      closePrice: currentPrice,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground lg:overflow-hidden font-sans">
      <Navbar onSelectGame={setSelectedGameId} selectedGameId={selectedGameId} />
      <Ticker data={marketData} />
      
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden">
        {/* Left: Game List - Hidden on mobile/tablet */}
        <div className="hidden xl:flex flex-col border-r border-border">
           <MarketOverview 
             data={marketData} 
             games={TRADING_GAMES}
             onSelectGame={setSelectedGameId} 
             selectedGameId={selectedGameId} 
           />
        </div>

        {/* Mobile Layout: Full scrollable container with all sections */}
        <div className="lg:hidden flex-1 min-h-0 overflow-auto">
          {/* Chart */}
          <div className="h-[35vh] min-h-[180px] border-b border-border">
            <PriceChart symbol={selectedGame.symbol} data={currentMarket} duration={selectedGame.duration} />
          </div>
          
          {/* Betting Form on Mobile */}
          <div className="border-b border-border">
            <BettingForm 
              currentPrice={currentMarket.price} 
              game={selectedGame}
              onBet={handleBet}
              balance={balanceData?.balance}
            />
          </div>
          
          {/* Bets Panel */}
          <div className="min-h-[200px]">
            <BetsPanel 
              bets={allBets} 
              currentPrices={currentPrices}
              onBetExpire={handleBetExpire}
            />
          </div>
        </div>
        
        {/* Desktop Layout: Resizable center panels + sidebar */}
        <div className="hidden lg:flex flex-1 flex-row min-h-0">
          {/* Center: Chart + Bets with Resizable */}
          <div className="flex-1 flex flex-col min-w-0">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full border-b border-border">
                  <PriceChart symbol={selectedGame.symbol} data={currentMarket} duration={selectedGame.duration} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full">
                  <BetsPanel 
                    bets={allBets} 
                    currentPrices={currentPrices}
                    onBetExpire={handleBetExpire}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Right: Betting Form Sidebar */}
          <div className="flex flex-col border-l border-border w-[320px] shrink-0 overflow-auto">
            <BettingForm 
              currentPrice={currentMarket.price} 
              game={selectedGame}
              onBet={handleBet}
              balance={balanceData?.balance}
            />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <div className="h-6 bg-card border-t border-border flex items-center px-2 lg:px-4 text-[9px] lg:text-[10px] text-muted-foreground justify-between">
        <div className="flex gap-2 lg:gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-up animate-pulse"></span> <span className="hidden sm:inline">실시간 데이터</span><span className="sm:hidden">Live</span></span>
          <span>2.0x</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{balanceData?.balance ? Math.floor(parseFloat(balanceData.balance)).toLocaleString() : '0'}원</span>
        </div>
      </div>

      {/* Message Inbox Button (fixed) */}
      {user && (
        <button
          onClick={() => setInboxOpen(true)}
          className="fixed bottom-16 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all"
          data-testid="button-inbox"
        >
          <Mail className="w-5 h-5" />
          {unreadMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
              {unreadMessages.length}
            </span>
          )}
        </button>
      )}

      {/* Message Popup Notification */}
      <Dialog open={!!messagePopup} onOpenChange={() => handleClosePopup()}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              새 쪽지가 도착했습니다
            </DialogTitle>
          </DialogHeader>
          {messagePopup && (
            <div className="space-y-4 mt-2">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{messagePopup.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{messagePopup.content}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatMessageDate(messagePopup.createdAt as unknown as string)}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleClosePopup}>
                  <Check className="w-4 h-4 mr-2" />
                  확인
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inbox Dialog */}
      <Dialog open={inboxOpen} onOpenChange={setInboxOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                쪽지함
                {unreadMessages.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {unreadMessages.length}개 안읽음
                  </span>
                )}
              </span>
              {unreadMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  모두 읽음
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 space-y-2">
            {selectedMessage ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="mb-2"
                >
                  ← 목록으로
                </Button>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedMessage.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {formatMessageDate(selectedMessage.createdAt as unknown as string)}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
            ) : allMessages.length > 0 ? (
              allMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    msg.isRead 
                      ? 'bg-background border-border hover:bg-muted/50' 
                      : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                  }`}
                  data-testid={`message-item-${msg.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!msg.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <h4 className="font-medium truncate">{msg.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatMessageDate(msg.createdAt as unknown as string)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                쪽지가 없습니다
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
