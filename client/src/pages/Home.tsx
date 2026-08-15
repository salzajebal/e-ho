import React, { useState, useMemo, useEffect, useRef, Component } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/dashboard/Ticker";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { BettingForm } from "@/components/dashboard/BettingForm";
import { useMarketData, INITIAL_MARKET_DATA } from "@/lib/marketData";
import { useBets, useCreateBet, useSettleBet, useUserBalance } from "@/hooks/use-bets";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadMessages, useMessages, useMarkMessageRead, useMarkAllMessagesRead } from "@/hooks/use-messages";
import { useUserWebSocket } from "@/hooks/use-user-websocket";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, X, Check, MessageSquare, Headphones, FileText, ChevronRight, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle, History } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message } from "@shared/schema";
import { TRADING_GAMES } from "@/lib/tradingGames";

class HomeErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[HomeErrorBoundary] 렌더링 오류:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <p className="text-lg font-bold text-destructive">화면 로딩 중 오류가 발생했습니다.</p>
            <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function HomeInner() {
  const [selectedGameId, setSelectedGameId] = useState("BTC-120");
  const [, setLocation] = useLocation();
  const marketData = useMarketData();
  
  const selectedGame = TRADING_GAMES.find(g => g.id === selectedGameId) || TRADING_GAMES[0];
  
  const { data: user } = useAuth();

  // Messages - declare before WebSocket to ensure setters exist
  const [messagePopup, setMessagePopup] = useState<Message | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const shownMessageIds = useRef<Set<number>>(new Set());

  // Customer Service States - declare before WebSocket
  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [showInquiryFormModal, setShowInquiryFormModal] = useState(false);
  const [showMyInquiriesModal, setShowMyInquiriesModal] = useState(false);
  const [showInquiryNotification, setShowInquiryNotification] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  
  // Real-time WebSocket for message notifications
  useUserWebSocket(!!user, {
    onNewMessage: () => setInboxOpen(true),
    onInquiryReplied: () => {
      setShowInquiryNotification(true);
    },
    onTransactionProcessed: () => {
      refetchTransactions();
    },
  });
  
  const { data: activeBets = [] } = useBets();
  const createBet = useCreateBet();
  const settleBet = useSettleBet();
  const { data: balanceData } = useUserBalance();

  // Messages queries
  const { data: unreadMessages = [] } = useUnreadMessages();
  const { data: allMessages = [] } = useMessages();
  const markMessageRead = useMarkMessageRead();
  const markAllRead = useMarkAllMessagesRead();
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user inquiries
  const { data: myInquiries = [], refetch: refetchInquiries } = useQuery<any[]>({
    queryKey: ['/api/inquiries'],
    queryFn: async () => {
      const res = await fetch('/api/inquiries');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Fetch user transactions (입출금 내역)
  const { data: myTransactions = [], refetch: refetchTransactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    staleTime: 0,
  });

  // 현재 선택 종목 점검 상태 폴링 (30초 간격)
  const { data: maintenanceData } = useQuery<{ symbol: string; underMaintenance: boolean }>({
    queryKey: ["/api/maintenance", selectedGame.symbol],
    queryFn: async () => {
      const res = await fetch(`/api/maintenance/${selectedGame.symbol}`);
      if (!res.ok) return { symbol: selectedGame.symbol, underMaintenance: false };
      return res.json();
    },
    refetchInterval: 30_000,
  });
  const isUnderMaintenance = maintenanceData?.underMaintenance ?? false;

  // Fetch telegram link
  const { data: telegramData } = useQuery({
    queryKey: ["/api/settings/telegram"],
    queryFn: async () => {
      const res = await fetch("/api/settings/telegram");
      if (!res.ok) return { telegramLink: "" };
      return res.json();
    },
  });

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


  const currentMarket = marketData.find(m => m.symbol === selectedGame.symbol) || marketData[0] || INITIAL_MARKET_DATA[0];

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
        <div className="lg:hidden flex-1 min-h-0 overflow-auto pb-safe">
          {/* Chart */}
          <div className="h-[38vh] min-h-[200px] border-b border-border">
            <PriceChart symbol={selectedGame.symbol} data={currentMarket} duration={selectedGame.duration} />
          </div>
          
          {/* Betting Form on Mobile */}
          <div className="border-b border-border">
            <BettingForm 
              currentPrice={currentMarket.price} 
              game={selectedGame}
              onBet={handleBet}
              isBetting={createBet.isPending}
              balance={balanceData?.balance}
              userBets={activeBets}
              allPrices={currentPrices}
              underMaintenance={isUnderMaintenance}
            />
          </div>
          
        </div>
        
        {/* Desktop Layout: Chart + sidebar */}
        <div className="hidden lg:flex flex-1 flex-row min-h-0">
          {/* Center: Chart */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-full border-b border-border">
              <PriceChart symbol={selectedGame.symbol} data={currentMarket} duration={selectedGame.duration} />
            </div>
          </div>

          {/* Right: Betting Form Sidebar */}
          <div className="flex flex-col border-l border-border w-[320px] shrink-0 overflow-auto">
            <BettingForm 
              currentPrice={currentMarket.price} 
              game={selectedGame}
              onBet={handleBet}
              isBetting={createBet.isPending}
              balance={balanceData?.balance}
              userBets={activeBets}
              allPrices={currentPrices}
              underMaintenance={isUnderMaintenance}
            />
          </div>
        </div>
      </main>
      

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
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{messagePopup.content.replace(/\\n/g, '\n')}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatMessageDate(messagePopup.createdAt as unknown as string)}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClosePopup}>
                  닫기
                </Button>
                <Button onClick={() => {
                  handleClosePopup();
                  setInboxOpen(true);
                }}>
                  <Mail className="w-4 h-4 mr-2" />
                  쪽지함 열기
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
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content.replace(/\\n/g, '\n')}</p>
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

      {/* Customer Service Button (fixed) */}
      <button
        onClick={() => setShowCustomerServiceModal(true)}
        className="fixed bottom-16 left-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all"
        data-testid="button-customer-service"
      >
        <Headphones className="w-5 h-5" />
      </button>

      {/* Customer Service Modal - 고객센터 메뉴 */}
      <Dialog open={showCustomerServiceModal} onOpenChange={setShowCustomerServiceModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">고객센터</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowCustomerServiceModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-amber-500 rounded-full flex items-center justify-center">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">고객센터</h2>
                <p className="text-gray-400 text-sm">문의를 남기시면 빠르게 답변드립니다</p>
              </div>

              <div className="space-y-3">
                {/* 문의 작성하기 */}
                <button 
                  className="w-full block bg-gradient-to-r from-blue-500/10 to-amber-500/10 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition-colors cursor-pointer text-left"
                  onClick={() => {
                    if (!user) {
                      toast.error("로그인이 필요합니다");
                      setShowCustomerServiceModal(false);
                      setLocation("/login");
                      return;
                    }
                    setShowCustomerServiceModal(false);
                    setShowInquiryFormModal(true);
                  }}
                  data-testid="button-write-inquiry"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-amber-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">문의 작성하기</h3>
                      <p className="text-blue-400 text-sm">새로운 문의를 작성합니다</p>
                      <p className="text-gray-400 text-xs">빠른 답변 보장</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-500" />
                  </div>
                </button>

                {/* 내 문의 내역 */}
                <button 
                  className="w-full block bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer text-left"
                  onClick={() => {
                    if (!user) {
                      toast.error("로그인이 필요합니다");
                      setShowCustomerServiceModal(false);
                      setLocation("/login");
                      return;
                    }
                    setShowCustomerServiceModal(false);
                    refetchInquiries().then(() => setShowMyInquiriesModal(true));
                  }}
                  data-testid="button-my-inquiries"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">내 문의 내역</h3>
                      <p className="text-blue-400 text-sm">작성한 문의와 답변 확인</p>
                      <p className="text-gray-400 text-xs">{myInquiries.length}건의 문의</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* 입출금 내역 */}
                <button
                  className="w-full block bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer text-left"
                  onClick={() => {
                    if (!user) {
                      toast.error("로그인이 필요합니다");
                      setShowCustomerServiceModal(false);
                      setLocation("/login");
                      return;
                    }
                    setShowCustomerServiceModal(false);
                    refetchTransactions().then(() => setShowTransactionsModal(true));
                  }}
                  data-testid="button-my-transactions"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <History className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">입출금 내역</h3>
                      <p className="text-amber-400 text-sm">입금·출금 신청 및 처리 현황</p>
                      <p className="text-gray-400 text-xs">{myTransactions.length}건의 거래 내역</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* 고객센터 (텔레그램) */}
                {telegramData?.telegramLink && (
                  <a 
                    href={telegramData.telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/30 rounded-xl p-4 hover:border-sky-500/50 transition-colors cursor-pointer text-left"
                    onClick={() => setShowCustomerServiceModal(false)}
                    data-testid="button-customer-service-telegram"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center">
                        <Headphones className="w-6 h-6 text-sky-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">고객센터</h3>
                        <p className="text-sky-400 text-sm">텔레그램으로 바로 문의</p>
                        <p className="text-gray-400 text-xs">실시간 상담 가능</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-sky-500" />
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inquiry Form Modal - 문의 작성 */}
      <Dialog open={showInquiryFormModal} onOpenChange={setShowInquiryFormModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">문의 작성하기</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowInquiryFormModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-amber-500 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">문의 작성하기</h2>
                <p className="text-gray-400 text-sm">문의 내용을 작성해주세요</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">제목</label>
                  <Input
                    placeholder="문의 제목을 입력하세요"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">내용</label>
                  <Textarea
                    placeholder="문의 내용을 상세히 작성해주세요"
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[150px]"
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white font-semibold py-3"
                  disabled={!inquiryTitle.trim() || !inquiryContent.trim() || inquirySubmitting}
                  onClick={async () => {
                    setInquirySubmitting(true);
                    try {
                      const res = await fetch('/api/inquiries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: inquiryTitle,
                          content: inquiryContent,
                        }),
                      });
                      if (!res.ok) throw new Error('문의 등록 실패');
                      toast.success('문의가 등록되었습니다');
                      setInquiryTitle('');
                      setInquiryContent('');
                      setShowInquiryFormModal(false);
                      refetchInquiries();
                      setShowMyInquiriesModal(true);
                    } catch (error: any) {
                      toast.error(error.message || '문의 등록에 실패했습니다');
                    } finally {
                      setInquirySubmitting(false);
                    }
                  }}
                >
                  {inquirySubmitting ? '등록 중...' : '문의 등록하기'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Inquiries Modal - 내 문의 내역 */}
      <Dialog open={showMyInquiriesModal} onOpenChange={async (open) => {
        setShowMyInquiriesModal(open);
        if (open) {
          refetchInquiries();
          // 모달 열릴 때 답변된 문의를 일괄 읽음 처리
          try {
            await fetch('/api/inquiries/read-replies', { method: 'POST', credentials: 'include' });
            refetchInquiries();
          } catch (e) {}
        }
      }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">내 문의 내역</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => setShowMyInquiriesModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-amber-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">내 문의 내역</h2>
                <p className="text-gray-400 text-sm">총 {myInquiries.length}건의 문의</p>
              </div>

              <div className="space-y-3">
                {myInquiries.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">등록된 문의가 없습니다</p>
                ) : (
                  myInquiries.map((inquiry: any) => (
                    <div key={inquiry.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">{inquiry.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          inquiry.status === 'answered' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {inquiry.status === 'answered' ? '답변완료' : '대기중'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{inquiry.content}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                      {inquiry.reply && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-blue-400 text-xs font-medium mb-1">관리자 답변</p>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{inquiry.reply.replace(/\\n/g, '\n')}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <Button
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white"
                onClick={() => {
                  setShowMyInquiriesModal(false);
                  setShowInquiryFormModal(true);
                }}
              >
                새 문의 작성하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Modal - 입출금 내역 */}
      <Dialog open={showTransactionsModal} onOpenChange={(open) => { setShowTransactionsModal(open); if (open) refetchTransactions(); }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">입출금 내역</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <History className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">입출금 내역</h2>
                <p className="text-gray-400 text-sm">총 {myTransactions.length}건의 거래 내역</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4">
                {(['all', 'deposit', 'withdrawal'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTransactionFilter(f)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      transactionFilter === f
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                    data-testid={`tab-transaction-${f}`}
                  >
                    {f === 'all' ? '전체' : f === 'deposit' ? '입금' : '출금'}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {(() => {
                  const filtered = myTransactions.filter((t: any) =>
                    transactionFilter === 'all' || t.type === transactionFilter
                  );
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">거래 내역이 없습니다</p>
                      </div>
                    );
                  }
                  return filtered.map((tx: any) => {
                    const isDeposit = tx.type === 'deposit';
                    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                      pending: { label: '대기중', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
                      approved: { label: '승인', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
                      rejected: { label: '거절', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
                      hold: { label: '보류', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: <Clock className="w-3 h-3" /> },
                    };
                    const status = statusMap[tx.status] || statusMap.pending;
                    return (
                      <div key={tx.id} className="bg-white/5 border border-white/10 rounded-xl p-4" data-testid={`tx-item-${tx.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isDeposit
                              ? <ArrowDownCircle className="w-5 h-5 text-blue-400" />
                              : <ArrowUpCircle className="w-5 h-5 text-red-400" />
                            }
                            <span className={`font-semibold text-base ${isDeposit ? 'text-blue-400' : 'text-red-400'}`}>
                              {isDeposit ? '입금' : '출금'}
                            </span>
                          </div>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${status.color}`}>
                            {status.icon}{status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-lg">
                            {Number(tx.amount).toLocaleString('ko-KR')}원
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(tx.createdAt).toLocaleString('ko-KR', {
                              month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {tx.bankName && (
                          <p className="text-gray-400 text-xs mt-1">
                            {tx.bankName} · {tx.accountHolder} · {tx.accountNumber}
                          </p>
                        )}
                        {tx.adminNote && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-amber-400 text-xs font-medium mb-0.5">관리자 메모</p>
                            <p className="text-gray-300 text-xs">{tx.adminNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Left-bottom inquiry notification */}
      {showInquiryNotification && (
        <div
          className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-left-5 fade-in duration-300"
          data-testid="notification-inquiry-reply"
        >
          <button
            onClick={() => {
              setShowInquiryNotification(false);
              setShowMyInquiriesModal(true);
            }}
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">고객센터 답변 완료</p>
              <p className="text-xs text-blue-200">클릭하여 답변을 확인하세요</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInquiryNotification(false);
              }}
              className="ml-2 p-1 hover:bg-white/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <HomeErrorBoundary>
      <HomeInner />
    </HomeErrorBoundary>
  );
}
