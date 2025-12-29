import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users,
  BarChart3,
  LogOut,
  TrendingUp,
  Edit2,
  Trash2,
  RefreshCw,
  UserPlus,
  Eye,
  EyeOff,
  Snowflake,
  Play,
  Target,
  Check,
  X,
  Shield,
  UserCheck,
  Bell,
  MessageSquare,
  Send,
  Share2,
  Copy,
  Wallet,
  Ban,
  Wrench,
  Wifi,
  WifiOff,
  Globe,
  Zap,
  ZapOff,
  ChevronDown,
  Calendar,
  Plus,
  Minus,
  ArrowUpRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string | null;
  phone: string | null;
  residentNumber: string | null;
  region: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  balance: string;
  totalDeposit: string;
  totalWithdrawal: string;
  totalBet: string;
  totalWin: string;
  profitRate: string;
  role: string;
  affiliateId: string | null;
  isActive: boolean;
  autoBetEnabled: boolean;
  autoBetMultiplier: number;
  isBettingBlocked: boolean;
  approvalStatus: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

interface AdminBet {
  id: number;
  userId: string;
  username: string;
  symbol: string;
  direction: string;
  amount: string;
  duration: number;
  strikePrice: string;
  closePrice: string | null;
  payout: string | null;
  multiplier: string;
  outcome: string;
  forcedOutcome: 'win' | 'lose' | null;
  expiresAt: string;
  createdAt: string;
  settledAt: string | null;
  roundNumber: number | null;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  totalBetAmount: number;
  totalPayout: number;
  profit: number;
}

interface AdminAffiliate {
  id: string;
  username: string;
  password: string;
  displayName: string;
  phone: string | null;
  referralCode: string;
  commissionRate: string;
  totalCommission: string;
  pendingCommission: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  totalVolume: number;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  displayDate: string;
  createdAt: string;
  updatedAt: string;
}

const KOREAN_BANKS = [
  "KB국민은행", "신한은행", "우리은행", "하나은행", "SC제일은행",
  "한국씨티은행", "케이뱅크", "카카오뱅크", "토스뱅크", "NH농협은행",
  "IBK기업은행", "KDB산업은행", "수협은행", "대구은행", "부산은행",
  "광주은행", "전북은행", "경남은행", "제주은행",
];

const SYMBOL_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
};

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const doLogin = async () => {
    if (!username || !password) {
      setLoginErrorMessage("아이디와 비밀번호를 입력해주세요");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setLoginErrorMessage(data.error || "아이디 또는 비밀번호가 일치하지 않습니다");
        setIsLoading(false);
        return;
      }
      
      if (data.role !== 'admin') {
        setLoginErrorMessage("관리자 권한이 없습니다");
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setIsLoading(false);
        return;
      }
      
      toast.success("관리자 로그인 성공");
      window.location.reload();
    } catch (error) {
      setLoginErrorMessage("로그인에 실패했습니다");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      doLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/coinone-logo.png" 
            alt="Coinone Logo" 
            className="w-16 h-16 rounded-xl object-cover mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-white"></span>
            <span className="text-blue-500 font-bold">COINONE</span>
            <span className="text-white ml-2">관리자</span>
          </h1>
          <p className="text-gray-400 text-sm">관리자 계정으로 로그인하세요</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">관리자 아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="아이디 입력"
                className="w-full h-11 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-admin-username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="비밀번호 입력"
                className="w-full h-11 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-admin-password"
              />
            </div>

            <button
              type="button"
              className="w-full h-11 mt-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !username || !password}
              onClick={doLogin}
              data-testid="button-admin-login"
            >
              {isLoading ? "로그인 중..." : "관리자 로그인"}
            </button>
          </div>
        </div>
      </div>

      {/* Login Error Alert Dialog */}
      <AlertDialog open={!!loginErrorMessage} onOpenChange={() => setLoginErrorMessage("")}>
        <AlertDialogContent className="bg-[#1a1a24] border border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <X className="w-5 h-5" />
              로그인 실패
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {loginErrorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setLoginErrorMessage("")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Admin() {
  const { data: auth, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bets' | 'settings' | 'approvals' | 'messages' | 'affiliates' | 'announcements' | 'blocked-ips' | 'maintenance' | 'forced-bet' | 'deposits' | 'withdrawals' | 'inquiries'>('users');
  const [inquiryReplyId, setInquiryReplyId] = useState<number | null>(null);
  const [inquiryReplyContent, setInquiryReplyContent] = useState("");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<AdminUser | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loginHistoryUser, setLoginHistoryUser] = useState<AdminUser | null>(null);
  const [telegramLink, setTelegramLink] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [depositNotice, setDepositNotice] = useState("");
  const [alertIntervalRef, setAlertIntervalRef] = useState<NodeJS.Timeout | null>(null);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [prevTransactionCount, setPrevTransactionCount] = useState(0);
  const [prevInquiryCount, setPrevInquiryCount] = useState(0);
  const [prevBetCount, setPrevBetCount] = useState(0);
  const isInitialMount = useRef({ pending: true, transactions: true, inquiries: true, bets: true });

  // Sound notification utility using Web Audio API
  const playNotificationSound = useCallback((type: 'registration' | 'transaction' | 'inquiry' | 'bet') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sound patterns for each event type
      switch (type) {
        case 'registration': // 가입 - High pitched double beep
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(0, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.25);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'transaction': // 입출금 - Low pitched long tone
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.15);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'inquiry': // 1:1 문의 - Triple short beep
          oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.24);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.32);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.35);
          break;
        case 'bet': // 배팅 - Quick ascending tone
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
          oscillator.frequency.linearRampToValueAtTime(550, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
      }
    } catch (e) {
      console.log('Sound notification failed:', e);
    }
  }, []);

  // Voice notification using Web Speech API (TTS)
  const speakNotification = useCallback((message: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find Korean voice
        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
        if (koreanVoice) {
          utterance.voice = koreanVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.log('Voice notification failed:', e);
    }
  }, []);

  const [createAffiliateOpen, setCreateAffiliateOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AdminAffiliate | null>(null);
  const [deleteAffiliateConfirm, setDeleteAffiliateConfirm] = useState<string | null>(null);
  const [settlementAffiliate, setSettlementAffiliate] = useState<AdminAffiliate | null>(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementMemo, setSettlementMemo] = useState("");
  const [newAffiliate, setNewAffiliate] = useState({
    username: '',
    password: '',
    displayName: '',
    phone: '',
    commissionRate: '5',
  });
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteAnnouncementConfirm, setDeleteAnnouncementConfirm] = useState<number | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    isActive: true,
    isPinned: false,
    displayDate: new Date().toISOString().split('T')[0],
  });

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    balance: '0',
    role: 'user',
  });

  // Betting control states
  const [betFilter, setBetFilter] = useState<'all' | 'pending' | 'win' | 'lose'>('pending');
  const [editingBetId, setEditingBetId] = useState<number | null>(null);
  const [editingBetAmount, setEditingBetAmount] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Forced betting states
  const [forcedBetUserId, setForcedBetUserId] = useState("");
  const [forcedBetSymbol, setForcedBetSymbol] = useState("BTC");
  const [forcedBetDirection, setForcedBetDirection] = useState<"long" | "short">("long");
  const [forcedBetAmount, setForcedBetAmount] = useState("");
  const [forcedBetDuration, setForcedBetDuration] = useState(120);
  const [isPlacingForcedBet, setIsPlacingForcedBet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update current time every second for countdown display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: stats, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  interface DailyStats {
    date: string;
    totalBetAmount: number;
    totalPayoutAmount: number;
    houseProfitLoss: number;
    betCount: number;
    winCount: number;
    loseCount: number;
  }
  const { data: dailyStats = [], refetch: refetchDailyStats } = useQuery<DailyStats[]>({
    queryKey: ["/api/admin/daily-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/daily-stats?days=30");
      if (!res.ok) throw new Error("Failed to fetch daily stats");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const { data: users = [], refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const { data: bets = [], refetch: refetchBets } = useQuery<AdminBet[]>({
    queryKey: ["/api/admin/bets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bets");
      if (!res.ok) throw new Error("Failed to fetch bets");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  // Pending users for approval
  const { data: pendingUsers = [], refetch: refetchPendingUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/pending-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending-users");
      if (!res.ok) throw new Error("Failed to fetch pending users");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 3000,
  });

  // Transaction requests
  interface TransactionRequest {
    id: number;
    userId: string;
    type: 'deposit' | 'withdrawal';
    amount: string;
    status: 'pending' | 'approved' | 'rejected';
    bankName: string | null;
    accountHolder: string | null;
    accountNumber: string | null;
    adminNote: string | null;
    processedBy: string | null;
    processedAt: string | null;
    createdAt: string;
    username?: string;
    name?: string;
    userBankName?: string;
    userAccountHolder?: string;
    userAccountNumber?: string;
  }
  const { data: transactionRequests = [], refetch: refetchTransactions } = useQuery<TransactionRequest[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });
  const pendingTransactions = transactionRequests.filter(t => t.status === 'pending');
  const pendingDeposits = transactionRequests.filter(t => t.status === 'pending' && t.type === 'deposit');
  const pendingWithdrawals = transactionRequests.filter(t => t.status === 'pending' && t.type === 'withdrawal');
  const depositRequests = transactionRequests.filter(t => t.type === 'deposit');
  const withdrawalRequests = transactionRequests.filter(t => t.type === 'withdrawal');

  // Inquiries (1:1 문의)
  interface Inquiry {
    id: number;
    userId: string;
    title: string;
    content: string;
    reply: string | null;
    status: 'pending' | 'answered';
    repliedBy: string | null;
    repliedAt: string | null;
    createdAt: string;
    username?: string;
  }
  const { data: inquiries = [], refetch: refetchInquiries } = useQuery<Inquiry[]>({
    queryKey: ["/api/admin/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inquiries");
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });
  const pendingInquiries = inquiries.filter(i => i.status === 'pending');

  // WebSocket for real-time bet and transaction updates
  useEffect(() => {
    if (auth?.role !== 'admin') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/admin`);

    ws.onopen = () => {
      console.log('Admin WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'connected') {
          setWsConnected(true);
          console.log('Admin WebSocket authenticated via session');
        } else if (msg.event === 'bet_placed' || msg.event === 'bet_updated' || msg.event === 'bet_settled') {
          refetchBets();
          if (msg.event === 'bet_placed') {
            toast.info(`새 거래: ${msg.data.user?.username || 'Unknown'} - ${formatMoney(msg.data.bet.amount)}`);
          }
        } else if (msg.event === 'transaction_request') {
          refetchTransactions();
          refetchUsers();
          const type = msg.data.type === 'deposit' ? '입금' : '출금';
          const amount = Number(msg.data.amount).toLocaleString();
          const userName = msg.data.name || msg.data.username || 'Unknown';
          
          if (msg.data.type === 'deposit') {
            toast.success(`💰 새 입금 신청!\n${userName} - ${amount}원`, {
              duration: 10000,
              style: { background: '#10b981', color: 'white', fontWeight: 'bold' },
            });
          } else {
            toast.warning(`💸 새 출금 신청!\n${userName} - ${amount}원`, {
              duration: 10000,
              style: { background: '#f59e0b', color: 'white', fontWeight: 'bold' },
            });
          }
        } else if (msg.event === 'user_connected' || msg.event === 'user_disconnected') {
          refetchOnlineUsers();
        }
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    ws.onclose = (event) => {
      setWsConnected(false);
      if (event.code === 4001) {
        console.log('Admin WebSocket: Session invalid or expired');
      } else if (event.code === 4003) {
        console.log('Admin WebSocket: Admin access required');
      } else {
        console.log('Admin WebSocket disconnected');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => ws.close();
  }, [auth?.role, refetchBets, refetchTransactions, refetchUsers]);

  // Online users with real-time connection info
  interface OnlineUser {
    id: string;
    username: string;
    name: string | null;
    balance: string;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
    connectedAt: string;
    currentIp: string;
    isOnline: boolean;
  }

  // Login history
  interface LoginHistoryEntry {
    id: number;
    userId: string;
    username: string;
    ip: string;
    userAgent: string | null;
    loginAt: string;
  }

  const { data: loginHistory = [] } = useQuery<LoginHistoryEntry[]>({
    queryKey: ["/api/admin/users", loginHistoryUser?.id, "login-history"],
    queryFn: async () => {
      if (!loginHistoryUser) return [];
      const res = await fetch(`/api/admin/users/${loginHistoryUser.id}/login-history`);
      if (!res.ok) throw new Error("Failed to fetch login history");
      return res.json();
    },
    enabled: !!loginHistoryUser,
  });

  const { data: onlineUsers = [], refetch: refetchOnlineUsers } = useQuery<OnlineUser[]>({
    queryKey: ["/api/admin/online-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/online-users");
      if (!res.ok) throw new Error("Failed to fetch online users");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000, // Refresh every 5 seconds for real-time data
  });

  // Affiliates
  const { data: affiliatesList = [], refetch: refetchAffiliates } = useQuery<AdminAffiliate[]>({
    queryKey: ["/api/admin/affiliates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/affiliates");
      if (!res.ok) throw new Error("Failed to fetch affiliates");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  // Announcements
  const { data: announcementsList = [], refetch: refetchAnnouncements } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    queryFn: async () => {
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  // Blocked IPs
  const [newBlockedIp, setNewBlockedIp] = useState({ ipAddress: "", reason: "" });
  const { data: blockedIpsList = [], refetch: refetchBlockedIps } = useQuery<{ id: number; ipAddress: string; reason: string | null; blockedBy: string; createdAt: string }[]>({
    queryKey: ["/api/admin/blocked-ips"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blocked-ips");
      if (!res.ok) throw new Error("Failed to fetch blocked IPs");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const addBlockedIp = useMutation({
    mutationFn: async (data: { ipAddress: string; reason: string }) => {
      const res = await fetch("/api/admin/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to block IP");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blocked-ips"] });
      setNewBlockedIp({ ipAddress: "", reason: "" });
      toast.success("IP가 차단되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeBlockedIp = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blocked-ips/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unblock IP");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blocked-ips"] });
      toast.success("IP 차단이 해제되었습니다");
    },
    onError: () => {
      toast.error("IP 차단 해제에 실패했습니다");
    },
  });

  // Maintenance Symbols
  const [newMaintenance, setNewMaintenance] = useState({ symbol: "", reason: "" });
  const { data: maintenanceList = [], refetch: refetchMaintenance } = useQuery<{ id: number; symbol: string; reason: string | null; createdBy: string; startedAt: string }[]>({
    queryKey: ["/api/admin/maintenance"],
    queryFn: async () => {
      const res = await fetch("/api/admin/maintenance");
      if (!res.ok) throw new Error("Failed to fetch maintenance symbols");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const addMaintenance = useMutation({
    mutationFn: async (data: { symbol: string; reason: string }) => {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add maintenance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
      setNewMaintenance({ symbol: "", reason: "" });
      toast.success("종목 점검이 등록되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeMaintenance = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/maintenance/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove maintenance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
      toast.success("종목 점검이 해제되었습니다");
    },
    onError: () => {
      toast.error("종목 점검 해제에 실패했습니다");
    },
  });

  // Available symbols for maintenance
  const availableSymbols = ["BTC", "ETH"];

  // Notification for new pending users (가입)
  useEffect(() => {
    if (isInitialMount.current.pending) {
      isInitialMount.current.pending = false;
      setPrevPendingCount(pendingUsers.length);
      return;
    }
    if (pendingUsers.length > prevPendingCount) {
      toast.info(`🔔 새로운 가입 신청이 있습니다! (${pendingUsers.length}건)`, {
        duration: 5000,
      });
      playNotificationSound('registration');
      speakNotification('가입신청이 접수되었습니다');
    }
    setPrevPendingCount(pendingUsers.length);
  }, [pendingUsers.length, prevPendingCount, playNotificationSound, speakNotification]);

  // Notification for new pending transactions (입출금)
  useEffect(() => {
    if (isInitialMount.current.transactions) {
      isInitialMount.current.transactions = false;
      setPrevTransactionCount(pendingTransactions.length);
      return;
    }
    if (pendingTransactions.length > prevTransactionCount) {
      // Check if it's deposit or withdrawal
      const newDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length;
      const newWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length;
      toast.info(`💰 새로운 입출금 요청이 있습니다! (${pendingTransactions.length}건)`, {
        duration: 5000,
      });
      playNotificationSound('transaction');
      if (newDeposits > 0) {
        speakNotification('입금신청이 접수되었습니다');
      } else if (newWithdrawals > 0) {
        speakNotification('출금신청이 접수되었습니다');
      }
    }
    setPrevTransactionCount(pendingTransactions.length);
  }, [pendingTransactions.length, prevTransactionCount, playNotificationSound, speakNotification, transactions]);

  // Notification for new pending inquiries (1:1 문의)
  useEffect(() => {
    if (isInitialMount.current.inquiries) {
      isInitialMount.current.inquiries = false;
      setPrevInquiryCount(pendingInquiries.length);
      return;
    }
    if (pendingInquiries.length > prevInquiryCount) {
      toast.info(`📩 새로운 고객센터 문의가 있습니다! (${pendingInquiries.length}건)`, {
        duration: 5000,
      });
      playNotificationSound('inquiry');
      speakNotification('문의가 접수되었습니다');
    }
    setPrevInquiryCount(pendingInquiries.length);
  }, [pendingInquiries.length, prevInquiryCount, playNotificationSound, speakNotification]);

  // Notification for new bets (배팅)
  useEffect(() => {
    const pendingBets = bets.filter(b => b.outcome === 'pending');
    if (isInitialMount.current.bets) {
      isInitialMount.current.bets = false;
      setPrevBetCount(pendingBets.length);
      return;
    }
    if (pendingBets.length > prevBetCount) {
      toast.info(`🎯 새로운 거래가 있습니다! (${pendingBets.length}건)`, {
        duration: 3000,
      });
      playNotificationSound('bet');
    }
    setPrevBetCount(pendingBets.length);
  }, [bets, prevBetCount, playNotificationSound]);

  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast.success("회원 가입이 승인되었습니다");
    },
    onError: () => {
      toast.error("승인에 실패했습니다");
    },
  });

  const rejectUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reject user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast.success("회원 가입이 거절되었습니다");
    },
    onError: () => {
      toast.error("거절에 실패했습니다");
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, title, content }: { receiverId: string; title: string; content: string }) => {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, title, content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      setMessageDialogOpen(false);
      setMessageRecipient(null);
      setMessageTitle("");
      setMessageContent("");
      toast.success("쪽지가 전송되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openMessageDialog = (user: AdminUser) => {
    setMessageRecipient(user);
    setMessageTitle("");
    setMessageContent("");
    setMessageDialogOpen(true);
  };

  // Update settings when data loads
  useEffect(() => {
    if (settingsData?.telegram_link !== undefined) {
      setTelegramLink(settingsData.telegram_link);
    }
    if (settingsData?.company_info !== undefined) {
      setCompanyInfo(settingsData.company_info);
    }
    if (settingsData?.deposit_notice !== undefined) {
      setDepositNotice(settingsData.deposit_notice);
    }
  }, [settingsData]);

  // Repeating alert for pending transactions
  useEffect(() => {
    const pendingCount = pendingDeposits.length + pendingWithdrawals.length;
    
    if (pendingCount > 0 && auth?.role === 'admin') {
      // Clear existing interval
      if (alertIntervalRef) {
        clearInterval(alertIntervalRef);
      }
      
      // Set up repeating alert every 30 seconds
      const interval = setInterval(() => {
        if (pendingDeposits.length > 0) {
          toast.warning(`⏰ 미처리 입금 ${pendingDeposits.length}건이 있습니다!`, {
            duration: 5000,
          });
          playNotificationSound('transaction');
        }
        if (pendingWithdrawals.length > 0) {
          toast.warning(`⏰ 미처리 출금 ${pendingWithdrawals.length}건이 있습니다!`, {
            duration: 5000,
          });
        }
      }, 30000); // 30 seconds
      
      setAlertIntervalRef(interval);
      
      return () => clearInterval(interval);
    } else if (pendingCount === 0 && alertIntervalRef) {
      // Clear interval when no pending requests
      clearInterval(alertIntervalRef);
      setAlertIntervalRef(null);
    }
  }, [pendingDeposits.length, pendingWithdrawals.length, auth?.role]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/telegram"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company-info"] });
      toast.success("설정이 저장되었습니다");
    },
    onError: () => {
      toast.error("설정 저장에 실패했습니다");
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setCreateUserOpen(false);
      setNewUser({
        username: '', password: '', name: '', phone: '',
        bankName: '', accountHolder: '', accountNumber: '',
        balance: '0', role: 'user',
      });
      toast.success("회원이 생성되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<AdminUser>) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setEditingUser(null);
      toast.success("회원 정보가 수정되었습니다");
    },
    onError: () => {
      toast.error("수정에 실패했습니다");
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteConfirm(null);
      toast.success("회원이 삭제되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateBetOutcome = useMutation({
    mutationFn: async ({ betId, outcome }: { betId: number; outcome: 'win' | 'lose' }) => {
      const res = await fetch(`/api/admin/bets/${betId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) throw new Error("Failed to update bet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast.success("거래 결과가 변경되었습니다");
    },
    onError: () => {
      toast.error("변경에 실패했습니다");
    },
  });

  const updateBetAmount = useMutation({
    mutationFn: async ({ betId, amount }: { betId: number; amount: string }) => {
      const res = await fetch(`/api/admin/bets/${betId}/amount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update bet amount");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingBetId(null);
      setEditingBetAmount("");
      toast.success("거래 금액이 수정되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const setForcedOutcome = useMutation({
    mutationFn: async ({ betId, outcome }: { betId: number; outcome: 'win' | 'lose' }) => {
      const res = await fetch(`/api/admin/bets/${betId}/force-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set outcome");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast.success("결과 예약됨 (타이머 종료 시 적용)");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Helper function to calculate remaining time
  const getTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - currentTime;
    if (remaining <= 0) return '정산중';
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter bets based on selected filter
  const filteredBets = bets.filter(bet => {
    if (betFilter === 'all') return true;
    return bet.outcome === betFilter;
  });

  // Affiliate mutations
  const createAffiliate = useMutation({
    mutationFn: async (data: typeof newAffiliate) => {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create affiliate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      setCreateAffiliateOpen(false);
      setNewAffiliate({ username: '', password: '', displayName: '', phone: '', commissionRate: '5' });
      toast.success("총판이 생성되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateAffiliate = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<AdminAffiliate>) => {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update affiliate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      setEditingAffiliate(null);
      toast.success("총판 정보가 수정되었습니다");
    },
    onError: () => {
      toast.error("수정에 실패했습니다");
    },
  });

  const deleteAffiliate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete affiliate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      setDeleteAffiliateConfirm(null);
      toast.success("총판이 삭제되었습니다");
    },
    onError: () => {
      toast.error("삭제에 실패했습니다");
    },
  });

  const regenerateReferralCode = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/affiliates/${id}/regenerate-code`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to regenerate code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      toast.success("가입코드가 재생성되었습니다");
    },
    onError: () => {
      toast.error("재생성에 실패했습니다");
    },
  });

  const createSettlement = useMutation({
    mutationFn: async ({ affiliateId, amount, memo }: { affiliateId: string; amount: string; memo: string }) => {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, memo }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create settlement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      setSettlementAffiliate(null);
      setSettlementAmount("");
      setSettlementMemo("");
      toast.success("정산이 등록되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; isActive: boolean; isPinned: boolean; displayDate: string }) => {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setCreateAnnouncementOpen(false);
      setNewAnnouncement({ title: '', content: '', isActive: true, isPinned: false, displayDate: new Date().toISOString().split('T')[0] });
      toast.success("공지사항이 등록되었습니다");
    },
    onError: () => {
      toast.error("등록에 실패했습니다");
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title?: string; content?: string; isActive?: boolean; isPinned?: boolean; displayDate?: string }) => {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update announcement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setEditingAnnouncement(null);
      toast.success("공지사항이 수정되었습니다");
    },
    onError: () => {
      toast.error("수정에 실패했습니다");
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete announcement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setDeleteAnnouncementConfirm(null);
      toast.success("공지사항이 삭제되었습니다");
    },
    onError: () => {
      toast.error("삭제에 실패했습니다");
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/force-logout`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to force logout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/online-users"] });
      toast.success("강제 로그아웃 처리되었습니다");
    },
    onError: () => {
      toast.error("강제 로그아웃에 실패했습니다");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show admin login if not logged in or not admin
  if (!auth || auth.role !== 'admin') {
    return <AdminLogin />;
  }

  const toggleFreeze = (user: AdminUser) => {
    updateUser.mutate({ id: user.id, isActive: !user.isActive });
  };

  const toggleAutoBet = (user: AdminUser) => {
    updateUser.mutate({ id: user.id, autoBetEnabled: !user.autoBetEnabled });
  };

  const toggleBettingBlock = (user: AdminUser) => {
    updateUser.mutate({ id: user.id, isBettingBlocked: !user.isBettingBlocked });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.floor(num).toLocaleString() + '원';
  };

  const NavItems = () => (
    <>
      <button
        onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'dashboard'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <BarChart3 className="w-4 h-4" />
        대시보드
      </button>
      <button
        onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'users'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Users className="w-4 h-4" />
        회원 관리
      </button>
      <button
        onClick={() => { setActiveTab('approvals'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
          activeTab === 'approvals'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <UserCheck className="w-4 h-4" />
        가입 승인
        {pendingUsers.length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
            {pendingUsers.length}
          </span>
        )}
      </button>
      <button
        onClick={() => { setActiveTab('deposits'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
          activeTab === 'deposits'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Wallet className="w-4 h-4" />
        입금 신청
        {pendingDeposits.length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
            {pendingDeposits.length}
          </span>
        )}
      </button>
      <button
        onClick={() => { setActiveTab('withdrawals'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
          activeTab === 'withdrawals'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Wallet className="w-4 h-4" />
        출금 신청
        {pendingWithdrawals.length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
            {pendingWithdrawals.length}
          </span>
        )}
      </button>
      <button
        onClick={() => { setActiveTab('inquiries'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
          activeTab === 'inquiries'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <MessageSquare className="w-4 h-4" />
        고객센터
        {pendingInquiries.length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
            {pendingInquiries.length}
          </span>
        )}
      </button>
      <button
        onClick={() => { setActiveTab('bets'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'bets'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Target className="w-4 h-4" />
        거래 관리
      </button>
      <button
        onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'messages'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <MessageSquare className="w-4 h-4" />
        쪽지 보내기
      </button>
      <button
        onClick={() => { setActiveTab('affiliates'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'affiliates'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Share2 className="w-4 h-4" />
        총판 관리
      </button>
      <button
        onClick={() => { setActiveTab('announcements'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'announcements'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Bell className="w-4 h-4" />
        공지사항
      </button>
      <button
        onClick={() => { setActiveTab('blocked-ips'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'blocked-ips'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Ban className="w-4 h-4" />
        IP 차단
      </button>
      <button
        onClick={() => { setActiveTab('maintenance'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'maintenance'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Wrench className="w-4 h-4" />
        서버 점검
      </button>
      <button
        onClick={() => { setActiveTab('forced-bet'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'forced-bet'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        data-testid="tab-forced-bet"
      >
        <Zap className="w-4 h-4" />
        강제 거래
      </button>
      <button
        onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'settings'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Shield className="w-4 h-4" />
        설정
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src="/coinone-logo.png" 
            alt="Coinone Logo" 
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="font-bold text-sm">
            <span className="text-white"></span>
            <span className="text-blue-500 font-bold">COINONE</span>
          </span>
          <span className="text-xs text-muted-foreground">관리자</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0 bg-card">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-left text-sm">관리자 메뉴</SheetTitle>
            </SheetHeader>
            <nav className="p-3 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
              <NavItems />
            </nav>
            <div className="p-3 border-t border-border space-y-2 absolute bottom-0 left-0 right-0 bg-card">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => { setLocation("/"); setMobileMenuOpen(false); }}
              >
                <TrendingUp className="w-4 h-4" />
                거래소
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => { logout.mutate(); setMobileMenuOpen(false); }}
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-56 bg-card border-r border-border flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img 
              src="/coinone-logo.png" 
              alt="Coinone Logo" 
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <span className="font-bold text-lg">
                <span className="text-white"></span>
                <span className="text-blue-500 font-bold">COINONE</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">관리자 패널</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'dashboard'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
              activeTab === 'approvals'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <UserCheck className="w-4 h-4" />
            가입 승인
            {pendingUsers.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
              activeTab === 'deposits'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Wallet className="w-4 h-4" />
            입금 신청
            {pendingDeposits.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {pendingDeposits.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
              activeTab === 'withdrawals'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            출금 신청
            {pendingWithdrawals.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
              activeTab === 'inquiries'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            1:1 문의
            {pendingInquiries.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {pendingInquiries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'users'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Users className="w-4 h-4" />
            회원 관리
          </button>
          <button
            onClick={() => setActiveTab('bets')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'bets'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Target className="w-4 h-4" />
            거래 관리
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'messages'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            쪽지 보내기
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'affiliates'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Share2 className="w-4 h-4" />
            총판 관리
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'announcements'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Bell className="w-4 h-4" />
            공지사항
          </button>
          <button
            onClick={() => setActiveTab('blocked-ips')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'blocked-ips'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Ban className="w-4 h-4" />
            IP 차단
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'maintenance'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Wrench className="w-4 h-4" />
            서버 점검
          </button>
          <button
            onClick={() => setActiveTab('forced-bet')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'forced-bet'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            data-testid="tab-forced-bet"
          >
            <Zap className="w-4 h-4" />
            강제 거래
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'settings'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Shield className="w-4 h-4" />
            설정
          </button>
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setLocation("/")}
          >
            <TrendingUp className="w-4 h-4" />
            거래소
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => logout.mutate()}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 lg:p-6 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl lg:text-2xl font-bold">대시보드</h1>
              <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchUsers(); refetchBets(); refetchOnlineUsers(); }}>
                <RefreshCw className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">새로고침</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4">
              <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-muted-foreground">총 회원수</p>
                <p className="text-lg lg:text-2xl font-bold mt-1">{stats?.totalUsers || 0}명</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">활성: {stats?.activeUsers || 0}명</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
                <div className="flex items-center gap-1 lg:gap-2">
                  <Wifi className="w-3 lg:w-4 h-3 lg:h-4 text-up" />
                  <p className="text-xs lg:text-sm text-muted-foreground">접속자</p>
                </div>
                <p className="text-lg lg:text-2xl font-bold mt-1 text-up">{onlineUsers.length}명</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">실시간</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-muted-foreground">총 거래수</p>
                <p className="text-lg lg:text-2xl font-bold mt-1">{stats?.totalBets || 0}건</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">진행: {stats?.pendingBets || 0}건</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-muted-foreground">승/패</p>
                <p className="text-lg lg:text-2xl font-bold mt-1">
                  <span className="text-up">{stats?.wonBets || 0}</span>
                  <span className="text-muted-foreground mx-0.5 lg:mx-1">/</span>
                  <span className="text-down">{stats?.lostBets || 0}</span>
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-muted-foreground">총 수익</p>
                <p className={cn("text-lg lg:text-2xl font-bold mt-1", (stats?.profit || 0) >= 0 ? "text-up" : "text-down")}>
                  {formatMoney(stats?.profit || 0)}
                </p>
              </div>
            </div>

            {/* Daily Stats - 날짜별 수익 (한국시간 기준) */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-2 lg:p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 lg:gap-2">
                  <Calendar className="w-4 lg:w-5 h-4 lg:h-5 text-primary" />
                  <h2 className="text-sm lg:text-base font-semibold">날짜별 수익</h2>
                  <span className="text-[10px] lg:text-xs text-muted-foreground hidden sm:inline">(최근 30일)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchDailyStats()} data-testid="button-refresh-daily-stats" className="h-7 lg:h-8">
                  <RefreshCw className="w-3 lg:w-4 h-3 lg:h-4" />
                </Button>
              </div>
              <div className="overflow-x-auto max-h-[300px] lg:max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead className="bg-muted/50 text-left sticky top-0">
                    <tr>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium">날짜</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">건수</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">승/패</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">거래액</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">지급액</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">수익</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dailyStats.map((day) => (
                      <tr key={day.date} className="hover:bg-muted/30" data-testid={`row-daily-stats-${day.date}`}>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 font-medium whitespace-nowrap">
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('ko-KR', { 
                            month: '2-digit', 
                            day: '2-digit',
                            weekday: 'short'
                          })}
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right">{day.betCount}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap">
                          <span className="text-up">{day.winCount}</span>
                          <span className="text-muted-foreground mx-0.5">/</span>
                          <span className="text-down">{day.loseCount}</span>
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap">{formatMoney(day.totalBetAmount)}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right text-down whitespace-nowrap">{formatMoney(day.totalPayoutAmount)}</td>
                        <td className={cn("px-2 lg:px-4 py-2 lg:py-3 text-right font-bold whitespace-nowrap", day.houseProfitLoss >= 0 ? "text-up" : "text-down")}>
                          {day.houseProfitLoss >= 0 ? '+' : ''}{formatMoney(day.houseProfitLoss)}
                        </td>
                      </tr>
                    ))}
                    {dailyStats.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 lg:px-4 py-6 lg:py-8 text-center text-muted-foreground">
                          아직 정산된 거래 기록이 없습니다
                        </td>
                      </tr>
                    )}
                    {dailyStats.length > 0 && (
                      <tr className="bg-muted/30 font-bold">
                        <td className="px-2 lg:px-4 py-2 lg:py-3">합계</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right">{dailyStats.reduce((sum, d) => sum + d.betCount, 0)}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap">
                          <span className="text-up">{dailyStats.reduce((sum, d) => sum + d.winCount, 0)}</span>
                          <span className="text-muted-foreground mx-0.5">/</span>
                          <span className="text-down">{dailyStats.reduce((sum, d) => sum + d.loseCount, 0)}</span>
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap">{formatMoney(dailyStats.reduce((sum, d) => sum + d.totalBetAmount, 0))}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right text-down whitespace-nowrap">{formatMoney(dailyStats.reduce((sum, d) => sum + d.totalPayoutAmount, 0))}</td>
                        <td className={cn("px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap", dailyStats.reduce((sum, d) => sum + d.houseProfitLoss, 0) >= 0 ? "text-up" : "text-down")}>
                          {dailyStats.reduce((sum, d) => sum + d.houseProfitLoss, 0) >= 0 ? '+' : ''}{formatMoney(dailyStats.reduce((sum, d) => sum + d.houseProfitLoss, 0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real-time Online Users List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-2 lg:p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 lg:gap-2">
                  <Wifi className="w-4 lg:w-5 h-4 lg:h-5 text-up" />
                  <h2 className="text-sm lg:text-base font-semibold">실시간 접속</h2>
                  <span className="text-[10px] lg:text-xs bg-up/20 text-up px-1.5 lg:px-2 py-0.5 rounded-full" data-testid="text-online-count">{onlineUsers.length}명</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchOnlineUsers()} data-testid="button-refresh-online-users" className="h-7 lg:h-8">
                  <RefreshCw className="w-3 lg:w-4 h-3 lg:h-4" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-center">상태</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium">아이디</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium">회원명</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium">IP</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium">접속시간</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">잔고</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {onlineUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30" data-testid={`row-online-user-${user.id}`}>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-center">
                          <span className="inline-flex items-center justify-center w-5 lg:w-6 h-5 lg:h-6 rounded-full bg-up/20">
                            <span className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-up animate-pulse"></span>
                          </span>
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 font-medium">{user.username}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3">{user.name || '-'}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3">
                          <span className="font-mono text-[10px] lg:text-xs">{user.currentIp || user.lastLoginIp || '-'}</span>
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-muted-foreground text-[10px] lg:text-xs whitespace-nowrap">
                          {user.connectedAt ? formatDate(user.connectedAt) : (user.lastLoginAt ? formatDate(user.lastLoginAt) : '-')}
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right font-medium text-up whitespace-nowrap">
                          {formatMoney(parseFloat(user.balance || '0'))}
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => forceLogoutMutation.mutate(user.id)}
                            disabled={forceLogoutMutation.isPending}
                            className="h-6 lg:h-7 text-[10px] lg:text-xs px-1.5 lg:px-2"
                            data-testid={`button-force-logout-${user.id}`}
                          >
                            <LogOut className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">로그아웃</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {onlineUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-2 lg:px-4 py-6 lg:py-8 text-center text-muted-foreground">
                          <WifiOff className="w-6 lg:w-8 h-6 lg:h-8 mx-auto mb-2 opacity-50" />
                          현재 접속 중인 회원이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">가입 승인</h1>
              <Button variant="outline" size="sm" onClick={() => refetchPendingUsers()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">대기 중인 가입 신청이 없습니다</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 bg-yellow-500/10 border-b border-border flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">{pendingUsers.length}건의 가입 신청이 대기 중입니다</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-2 lg:px-4 py-3 text-center font-medium">처리</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">아이디</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">이름</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">전화번호</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">주민번호</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">지역</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">은행</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">예금주</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">계좌번호</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">총판코드</th>
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">신청일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingUsers.map((user) => {
                        const affiliate = user.affiliateId ? affiliatesList.find(a => a.id === user.affiliateId) : null;
                        return (
                        <tr key={user.id} className="hover:bg-muted/30 bg-yellow-500/5">
                          <td className="px-2 lg:px-4 py-3">
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 px-2 bg-up hover:bg-up/90 text-xs" onClick={() => approveUser.mutate(user.id)} disabled={approveUser.isPending}>
                                승인
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs" onClick={() => rejectUser.mutate(user.id)} disabled={rejectUser.isPending}>
                                거절
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 text-xs" onClick={() => toast.info('가입 신청이 보류 처리되었습니다')}>
                                보류
                              </Button>
                            </div>
                          </td>
                          <td className="px-2 lg:px-4 py-3 font-medium">{user.username}</td>
                          <td className="px-2 lg:px-4 py-3">{user.name || '-'}</td>
                          <td className="px-2 lg:px-4 py-3">{user.phone || '-'}</td>
                          <td className="px-2 lg:px-4 py-3 font-mono text-xs">{user.residentNumber || '-'}</td>
                          <td className="px-2 lg:px-4 py-3">{user.region || '-'}</td>
                          <td className="px-2 lg:px-4 py-3">{user.bankName || '-'}</td>
                          <td className="px-2 lg:px-4 py-3">{user.accountHolder || '-'}</td>
                          <td className="px-2 lg:px-4 py-3 font-mono text-xs">{user.accountNumber || '-'}</td>
                          <td className="px-2 lg:px-4 py-3">
                            {affiliate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                                <Share2 className="w-3 h-3" />
                                {affiliate.referralCode}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-2 lg:px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-lg lg:text-2xl font-bold">회원 관리</h1>
              <div className="flex gap-1 lg:gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchUsers()} className="h-8 px-2 lg:px-3">
                  <RefreshCw className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">새로고침</span>
                </Button>
                <Button size="sm" onClick={() => setCreateUserOpen(true)} className="h-8 px-2 lg:px-3">
                  <UserPlus className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">회원 생성</span>
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">상태</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">아이디</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">비밀번호</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">이름</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">총판</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">보유머니</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">총거래</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">총입금</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">총출금</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">수익률</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">최근로그인</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">가입일</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-border/50 hover:bg-muted/10">
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <span className={cn(
                            "inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium",
                            user.isActive ? "bg-up/20 text-up" : "bg-down/20 text-down"
                          )}>
                            {user.isActive ? '활성' : '동결'}
                          </span>
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-primary hover:text-primary/80 hover:underline font-medium"
                            title="클릭하여 회원 정보 보기"
                          >
                            {user.username}
                          </button>
                          {user.role === 'admin' && (
                            <span className="ml-1 text-[10px] lg:text-xs bg-primary/20 text-primary px-1 rounded">관리자</span>
                          )}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] lg:text-xs">
                              {showPasswords[user.id] ? user.password : '••••••'}
                            </span>
                            <button
                              onClick={() => setShowPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                            >
                              {showPasswords[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">{user.name || '-'}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          {user.affiliateId ? (
                            <span className="inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium bg-purple-500/20 text-purple-400">
                              {affiliatesList.find(a => a.id === user.affiliateId)?.displayName || '알 수 없음'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-mono">{formatMoney(user.balance)}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-mono">{formatMoney(user.totalBet)}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-mono">{formatMoney(user.totalDeposit)}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-mono">{formatMoney(user.totalWithdrawal)}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <span className={cn(
                            "font-medium",
                            parseFloat(user.profitRate) >= 0 ? "text-up" : "text-down"
                          )}>
                            {parseFloat(user.profitRate) >= 0 ? '+' : ''}{user.profitRate}%
                          </span>
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] lg:text-xs font-medium transition-colors"
                              title="수정"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span className="hidden lg:inline">수정</span>
                            </button>
                            <button
                              onClick={() => toggleFreeze(user)}
                              className={cn(
                                "p-1.5 rounded hover:bg-muted/50",
                                user.isActive ? "text-blue-400 hover:text-blue-300" : "text-up hover:text-up"
                              )}
                              title={user.isActive ? "동결" : "활성화"}
                            >
                              {user.isActive ? <Snowflake className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-1.5 rounded hover:bg-down/20 text-down"
                              disabled={user.id === auth.id}
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bets' && (
          <div className="space-y-3 lg:space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4">
              <div className="flex items-center gap-2 lg:gap-4">
                <h1 className="text-lg lg:text-2xl font-bold">실시간 거래 관리</h1>
                <div className={cn(
                  "flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs",
                  wsConnected ? "bg-up/20 text-up" : "bg-down/20 text-down"
                )}>
                  <div className={cn(
                    "w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full",
                    wsConnected ? "bg-up animate-pulse" : "bg-down"
                  )} />
                  {wsConnected ? '연결됨' : '끊김'}
                </div>
              </div>
              <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
                <div className="flex items-center bg-muted/50 rounded-md p-0.5">
                  {(['pending', 'all', 'win', 'lose'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBetFilter(filter)}
                      className={cn(
                        "px-2 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs font-medium rounded-md transition-colors",
                        betFilter === filter 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter === 'pending' ? `진행(${bets.filter(b => b.outcome === 'pending').length})` :
                       filter === 'all' ? '전체' :
                       filter === 'win' ? '적중' : '미적중'}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchBets()} className="h-8 px-2 lg:px-3">
                  <RefreshCw className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">새로고침</span>
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">종목</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">회차</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">회원</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">방향</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">거래금액</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">배당</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">남은시간</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">상태</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBets.map((bet) => (
                      <tr key={bet.id} className={cn(
                        "border-t border-border/50 hover:bg-muted/10",
                        bet.outcome === 'pending' && "bg-yellow-500/5"
                      )}>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-medium">
                          {SYMBOL_NAMES[bet.symbol] || bet.symbol}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <span className="inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium bg-yellow-500/20 text-yellow-500">
                            {bet.roundNumber || '-'}회차
                          </span>
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">{bet.username}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <span className={cn(
                            "inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium",
                            bet.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                          )}>
                            {bet.direction === 'long' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          {editingBetId === bet.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editingBetAmount}
                                onChange={(e) => setEditingBetAmount(e.target.value)}
                                className="w-20 lg:w-24 h-6 lg:h-7 text-[10px] lg:text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => updateBetAmount.mutate({ betId: bet.id, amount: editingBetAmount })}
                                disabled={updateBetAmount.isPending}
                                className="p-0.5 lg:p-1 rounded bg-up/20 hover:bg-up/30 text-up"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => { setEditingBetId(null); setEditingBetAmount(""); }}
                                className="p-0.5 lg:p-1 rounded bg-down/20 hover:bg-down/30 text-down"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-mono">{formatMoney(bet.amount)}</span>
                              {bet.outcome === 'pending' && (
                                <button
                                  onClick={() => {
                                    setEditingBetId(bet.id);
                                    setEditingBetAmount(bet.amount);
                                  }}
                                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="금액 수정"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 font-mono">x{bet.multiplier}</td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          {bet.outcome === 'pending' ? (
                            <span className={cn(
                              "font-mono text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 rounded",
                              new Date(bet.expiresAt).getTime() - currentTime <= 10000 
                                ? "bg-down/20 text-down animate-pulse" 
                                : "bg-yellow-500/20 text-yellow-500"
                            )}>
                              {getTimeRemaining(bet.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-[10px] lg:text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className={cn(
                              "inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium",
                              bet.outcome === 'win' ? "bg-up/20 text-up" :
                              bet.outcome === 'lose' ? "bg-down/20 text-down" :
                              "bg-yellow-500/20 text-yellow-500"
                            )}>
                              {bet.outcome === 'win' ? '적중' : bet.outcome === 'lose' ? '미적중' : '진행중'}
                            </span>
                            {bet.outcome === 'pending' && bet.forcedOutcome && (
                              <span className={cn(
                                "inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-[10px] font-medium",
                                bet.forcedOutcome === 'win' ? "bg-up/30 text-up" : "bg-down/30 text-down"
                              )}>
                                → {bet.forcedOutcome === 'win' ? '적중' : '미적중'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2">
                          <div className="flex items-center justify-end gap-1">
                            {bet.outcome === 'pending' ? (
                              <>
                                <button
                                  onClick={() => setForcedOutcome.mutate({ betId: bet.id, outcome: 'win' })}
                                  disabled={setForcedOutcome.isPending}
                                  className="p-1.5 rounded transition-colors hover:bg-up/20 text-up"
                                  title="적중 예약 (타이머 후 적용)"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setForcedOutcome.mutate({ betId: bet.id, outcome: 'lose' })}
                                  disabled={setForcedOutcome.isPending}
                                  className="p-1.5 rounded transition-colors hover:bg-down/20 text-down"
                                  title="미적중 예약 (타이머 후 적용)"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => updateBetOutcome.mutate({ betId: bet.id, outcome: 'win' })}
                                  disabled={updateBetOutcome.isPending}
                                  className={cn(
                                    "p-1.5 rounded transition-colors",
                                    bet.outcome === 'win' 
                                      ? "bg-up text-white" 
                                      : "hover:bg-up/20 text-up"
                                  )}
                                  title="적중으로 변경"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateBetOutcome.mutate({ betId: bet.id, outcome: 'lose' })}
                                  disabled={updateBetOutcome.isPending}
                                  className={cn(
                                    "p-1.5 rounded transition-colors",
                                    bet.outcome === 'lose' 
                                      ? "bg-down text-white" 
                                      : "hover:bg-down/20 text-down"
                                  )}
                                  title="미적중으로 변경"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBets.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                          {betFilter === 'pending' ? '진행중인 거래가 없습니다' : '거래 기록이 없습니다'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">쪽지 보내기</h1>
            </div>

            <div className="bg-card border border-border rounded-lg">
              <div className="p-4 border-b border-border">
                <p className="text-sm text-muted-foreground">회원을 선택하여 쪽지를 보내세요</p>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">아이디</th>
                      <th className="px-3 py-2 text-left font-medium">이름</th>
                      <th className="px-3 py-2 text-left font-medium">잔고</th>
                      <th className="px-3 py-2 text-left font-medium">상태</th>
                      <th className="px-3 py-2 text-center font-medium">쪽지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.filter(u => u.role !== 'admin').map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-medium">{user.username}</td>
                        <td className="px-3 py-2">{user.name || '-'}</td>
                        <td className="px-3 py-2">{formatMoney(user.balance)}</td>
                        <td className="px-3 py-2">
                          {user.isActive ? (
                            <span className="text-up text-xs">활성</span>
                          ) : (
                            <span className="text-down text-xs">비활성</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMessageDialog(user)}
                            className="gap-1"
                          >
                            <Send className="w-3 h-3" />
                            쪽지 보내기
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.role !== 'admin').length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                          회원이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">설정</h1>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">고객센터 설정</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">텔레그램 링크</label>
                  <div className="flex gap-3">
                    <Input
                      value={telegramLink}
                      onChange={(e) => setTelegramLink(e.target.value)}
                      placeholder="https://t.me/your_channel"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => updateSetting.mutate({ key: 'telegram_link', value: telegramLink })}
                      disabled={updateSetting.isPending}
                    >
                      {updateSetting.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    고객센터에서 텔레그램 문의 클릭 시 이동할 링크입니다.
                  </p>
                </div>

                {telegramLink && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">현재 설정된 링크:</p>
                    <a 
                      href={telegramLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      {telegramLink}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">회사 정보 설정</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">대표이사 / 회사 정보</label>
                  <div className="flex gap-3">
                    <Input
                      value={companyInfo}
                      onChange={(e) => setCompanyInfo(e.target.value)}
                      placeholder="대표이사 김동호 외2인"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => updateSetting.mutate({ key: 'company_info', value: companyInfo })}
                      disabled={updateSetting.isPending}
                    >
                      {updateSetting.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    메인 페이지 하단에 표시될 회사 정보입니다.
                  </p>
                </div>

                {companyInfo && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">현재 설정된 정보:</p>
                    <p className="text-foreground">{companyInfo}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">입금 안내 설정</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">입금 안내 멘트</label>
                  <div className="flex gap-3">
                    <textarea
                      value={depositNotice}
                      onChange={(e) => setDepositNotice(e.target.value)}
                      placeholder="입금 신청 후 아래 계좌로 입금해 주시면 빠르게 처리해 드립니다.&#10;&#10;예: 국민은행 123-456-7890 홍길동"
                      className="flex-1 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      onClick={() => updateSetting.mutate({ key: 'deposit_notice', value: depositNotice })}
                      disabled={updateSetting.isPending}
                      className="self-start"
                    >
                      {updateSetting.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    사용자가 입금 신청 시 표시될 안내 멘트입니다. 회사 계좌 정보를 포함해 주세요.
                  </p>
                </div>

                {depositNotice && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">현재 설정된 안내:</p>
                    <p className="text-foreground whitespace-pre-wrap">{depositNotice}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'affiliates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">총판 관리</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchAffiliates()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button size="sm" onClick={() => setCreateAffiliateOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  총판 추가
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">아이디</th>
                      <th className="px-4 py-3 font-medium">표시명</th>
                      <th className="px-4 py-3 font-medium">가입코드</th>
                      <th className="px-4 py-3 font-medium text-center">회원수</th>
                      <th className="px-4 py-3 font-medium text-right">거래량</th>
                      <th className="px-4 py-3 font-medium text-center">수수료율</th>
                      <th className="px-4 py-3 font-medium text-right">정산 예정</th>
                      <th className="px-4 py-3 font-medium text-center">상태</th>
                      <th className="px-4 py-3 font-medium text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {affiliatesList.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{affiliate.username}</td>
                        <td className="px-4 py-3">{affiliate.displayName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {affiliate.referralCode}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(affiliate.referralCode)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => regenerateReferralCode.mutate(affiliate.id)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{affiliate.userCount}명</td>
                        <td className="px-4 py-3 text-right">{formatMoney(affiliate.totalVolume)}</td>
                        <td className="px-4 py-3 text-center">{affiliate.commissionRate}%</td>
                        <td className="px-4 py-3 text-right">{formatMoney(affiliate.pendingCommission)}</td>
                        <td className="px-4 py-3 text-center">
                          {affiliate.isActive ? (
                            <span className="text-up text-xs bg-up/10 px-2 py-1 rounded">활성</span>
                          ) : (
                            <span className="text-down text-xs bg-down/10 px-2 py-1 rounded">비활성</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-green-500"
                              onClick={() => setSettlementAffiliate(affiliate)}
                              title="정산하기"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingAffiliate(affiliate)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => updateAffiliate.mutate({ id: affiliate.id, isActive: !affiliate.isActive })}
                            >
                              {affiliate.isActive ? <Snowflake className="w-3.5 h-3.5 text-blue-400" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => setDeleteAffiliateConfirm(affiliate.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {affiliatesList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                          등록된 총판이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">공지사항 관리</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchAnnouncements()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button size="sm" onClick={() => setCreateAnnouncementOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  공지 등록
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium w-12 text-center">ID</th>
                      <th className="px-4 py-3 font-medium">제목</th>
                      <th className="px-4 py-3 font-medium text-center">상단고정</th>
                      <th className="px-4 py-3 font-medium text-center">상태</th>
                      <th className="px-4 py-3 font-medium text-center">등록일</th>
                      <th className="px-4 py-3 font-medium text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {announcementsList.map((announcement) => (
                      <tr key={announcement.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-center text-muted-foreground">{announcement.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{announcement.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{announcement.content}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {announcement.isPinned ? (
                            <span className="text-orange-500 font-medium">고정</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => updateAnnouncementMutation.mutate({ id: announcement.id, isActive: !announcement.isActive })}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded",
                              announcement.isActive
                                ? "bg-up/20 text-up"
                                : "bg-down/20 text-down"
                            )}
                          >
                            {announcement.isActive ? '게시중' : '비공개'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                          {formatDate(announcement.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingAnnouncement(announcement)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-down hover:text-down" onClick={() => setDeleteAnnouncementConfirm(announcement.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {announcementsList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          등록된 공지사항이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blocked-ips' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">IP 차단 관리</h1>
              <Button variant="outline" size="sm" onClick={() => refetchBlockedIps()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium mb-3">새 IP 차단</h3>
              <div className="flex gap-3">
                <Input
                  placeholder="IP 주소 (예: 192.168.1.1)"
                  value={newBlockedIp.ipAddress}
                  onChange={(e) => setNewBlockedIp(p => ({ ...p, ipAddress: e.target.value }))}
                  className="max-w-xs"
                />
                <Input
                  placeholder="차단 사유"
                  value={newBlockedIp.reason}
                  onChange={(e) => setNewBlockedIp(p => ({ ...p, reason: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  onClick={() => addBlockedIp.mutate(newBlockedIp)}
                  disabled={!newBlockedIp.ipAddress || addBlockedIp.isPending}
                  data-testid="button-add-blocked-ip"
                >
                  {addBlockedIp.isPending ? '추가 중...' : 'IP 차단'}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium w-12 text-center">ID</th>
                      <th className="px-4 py-3 font-medium">IP 주소</th>
                      <th className="px-4 py-3 font-medium">차단 사유</th>
                      <th className="px-4 py-3 font-medium">차단일</th>
                      <th className="px-4 py-3 font-medium text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {blockedIpsList.map((ip) => (
                      <tr key={ip.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-center text-muted-foreground">{ip.id}</td>
                        <td className="px-4 py-3 font-mono">{ip.ipAddress}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ip.reason || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(ip.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-down hover:text-down"
                            onClick={() => removeBlockedIp.mutate(ip.id)}
                            disabled={removeBlockedIp.isPending}
                            data-testid={`button-unblock-ip-${ip.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {blockedIpsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          차단된 IP가 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">서버 점검 관리</h1>
              <Button variant="outline" size="sm" onClick={() => refetchMaintenance()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium mb-3">종목 점검 등록</h3>
              <div className="flex gap-3">
                <Select
                  value={newMaintenance.symbol}
                  onValueChange={(v) => setNewMaintenance(p => ({ ...p, symbol: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="종목 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableSymbols.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="점검 사유 (예: 정기점검)"
                  value={newMaintenance.reason}
                  onChange={(e) => setNewMaintenance(p => ({ ...p, reason: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  onClick={() => addMaintenance.mutate(newMaintenance)}
                  disabled={!newMaintenance.symbol || addMaintenance.isPending}
                  data-testid="button-add-maintenance"
                >
                  {addMaintenance.isPending ? '등록 중...' : '점검 등록'}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium w-12 text-center">ID</th>
                      <th className="px-4 py-3 font-medium">종목</th>
                      <th className="px-4 py-3 font-medium">점검 사유</th>
                      <th className="px-4 py-3 font-medium">점검 시작일</th>
                      <th className="px-4 py-3 font-medium text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {maintenanceList.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-center text-muted-foreground">{item.id}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 font-medium">
                            <Wrench className="w-3 h-3" />
                            {item.symbol}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.reason || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(item.startedAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-up hover:text-up"
                            onClick={() => removeMaintenance.mutate(item.id)}
                            disabled={removeMaintenance.isPending}
                            data-testid={`button-remove-maintenance-${item.id}`}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            점검 해제
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {maintenanceList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          점검 중인 종목이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="font-medium text-yellow-500 mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                점검 중 종목 안내
              </h3>
              <p className="text-sm text-muted-foreground">
                점검 중인 종목은 거래가 일시 중단됩니다. 점검이 완료되면 "점검 해제" 버튼을 클릭하여 거래를 재개하세요.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'forced-bet' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">강제 거래</h1>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                회원 대신 거래하기
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">회원 선택 *</label>
                  <Select
                    value={forcedBetUserId}
                    onValueChange={setForcedBetUserId}
                  >
                    <SelectTrigger className="w-full" data-testid="select-forced-bet-user">
                      <SelectValue placeholder="회원을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-60">
                      {users.filter(u => u.role !== 'admin').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.name || '이름없음'}) - ₩{parseFloat(user.balance).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">종목 *</label>
                  <Select
                    value={forcedBetSymbol}
                    onValueChange={setForcedBetSymbol}
                  >
                    <SelectTrigger className="w-full" data-testid="select-forced-bet-symbol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="BTC">BTC (비트코인)</SelectItem>
                      <SelectItem value="ETH">ETH (이더리움)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">방향 *</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={forcedBetDirection === 'long' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        forcedBetDirection === 'long' && "bg-up hover:bg-up/90"
                      )}
                      onClick={() => setForcedBetDirection('long')}
                      data-testid="button-forced-bet-long"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      롱 (상승)
                    </Button>
                    <Button
                      type="button"
                      variant={forcedBetDirection === 'short' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        forcedBetDirection === 'short' && "bg-down hover:bg-down/90"
                      )}
                      onClick={() => setForcedBetDirection('short')}
                      data-testid="button-forced-bet-short"
                    >
                      <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                      숏 (하락)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">거래 금액 (₩) *</label>
                  <Input
                    type="number"
                    value={forcedBetAmount}
                    onChange={(e) => setForcedBetAmount(e.target.value)}
                    placeholder="거래 금액 입력"
                    data-testid="input-forced-bet-amount"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">거래 시간 *</label>
                  <Select
                    value={forcedBetDuration.toString()}
                    onValueChange={(v) => setForcedBetDuration(parseInt(v))}
                  >
                    <SelectTrigger className="w-full" data-testid="select-forced-bet-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="60">1분</SelectItem>
                      <SelectItem value="120">2분</SelectItem>
                      <SelectItem value="180">3분</SelectItem>
                      <SelectItem value="300">5분</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  size="lg"
                  className={cn(
                    "min-w-[200px]",
                    forcedBetDirection === 'long' ? "bg-up hover:bg-up/90" : "bg-down hover:bg-down/90"
                  )}
                  disabled={!forcedBetUserId || !forcedBetAmount || isPlacingForcedBet}
                  onClick={async () => {
                    try {
                      setIsPlacingForcedBet(true);
                      const marketRes = await fetch('/api/market/prices');
                      const marketData = await marketRes.json();
                      const symbolPrice = marketData.prices?.find((p: any) => p.symbol === forcedBetSymbol);
                      if (!symbolPrice) {
                        toast.error('현재 가격을 가져올 수 없습니다');
                        return;
                      }

                      const res = await fetch('/api/admin/bets/force', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: forcedBetUserId,
                          symbol: forcedBetSymbol,
                          direction: forcedBetDirection,
                          amount: parseFloat(forcedBetAmount),
                          duration: forcedBetDuration,
                          strikePrice: symbolPrice.price,
                          multiplier: 1.95,
                        }),
                      });

                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || '강제 거래 실패');
                      }

                      toast.success('강제 거래가 성공적으로 등록되었습니다');
                      setForcedBetUserId('');
                      setForcedBetSymbol('BTC');
                      setForcedBetDirection('long');
                      setForcedBetAmount('');
                      setForcedBetDuration(120);
                      refetchBets();
                      refetchUsers();
                    } catch (error: any) {
                      toast.error(error.message || '강제 거래 실패');
                    } finally {
                      setIsPlacingForcedBet(false);
                    }
                  }}
                  data-testid="button-place-forced-bet"
                >
                  {isPlacingForcedBet ? '거래 중...' : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      강제 거래 실행
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h3 className="font-medium text-orange-500 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                강제 거래 안내
              </h3>
              <p className="text-sm text-muted-foreground">
                선택한 회원의 잔고에서 거래 금액이 차감됩니다. 회원이 충분한 잔고를 보유하고 있는지 확인하세요.
                강제 거래는 일반 거래와 동일하게 정산됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Deposits Tab - 입금 신청 관리 */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">입금 신청</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  대기 중: <span className="text-green-500 font-bold">{pendingDeposits.length}건</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  새로고침
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">처리</th>
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">회원</th>
                      <th className="px-2 lg:px-4 py-3 text-right font-medium">금액</th>
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">신청일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {depositRequests.map((request) => (
                      <tr key={request.id} className={cn("hover:bg-muted/30", request.status === 'pending' && "bg-green-500/5")}>
                        <td className="px-2 lg:px-4 py-3">
                          {request.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 px-2 bg-up hover:bg-up/90 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'approved' }),
                                  });
                                  if (!res.ok) throw new Error('승인 실패');
                                  toast.success('입금 신청이 승인되었습니다');
                                  refetchTransactions(); refetchUsers();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>승인</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'rejected' }),
                                  });
                                  if (!res.ok) throw new Error('거절 실패');
                                  toast.success('입금 신청이 거절되었습니다');
                                  refetchTransactions();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>거절</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'hold' }),
                                  });
                                  if (!res.ok) throw new Error('보류 실패');
                                  toast.success('입금 신청이 보류 처리되었습니다');
                                  refetchTransactions();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>보류</Button>
                            </div>
                          )}
                          {request.status !== 'pending' && <span className="text-xs text-muted-foreground">처리완료</span>}
                        </td>
                        <td className="px-2 lg:px-4 py-3">
                          <div className="font-medium">{request.username}</div>
                          <div className="text-xs text-muted-foreground">{request.name}</div>
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-right font-bold text-green-500">
                          +{Number(request.amount).toLocaleString()}원
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-bold",
                            request.status === 'pending' && "bg-yellow-500/20 text-yellow-500",
                            request.status === 'approved' && "bg-green-500/20 text-green-500",
                            request.status === 'rejected' && "bg-red-500/20 text-red-500",
                            (request.status as string) === 'hold' && "bg-gray-500/20 text-gray-500"
                          )}>
                            {request.status === 'pending' ? '대기' : request.status === 'approved' ? '승인' : (request.status as string) === 'hold' ? '보류' : '거절'}
                          </span>
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {depositRequests.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">입금 신청 내역이 없습니다</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab - 출금 신청 관리 */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">출금 신청</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  대기 중: <span className="text-orange-500 font-bold">{pendingWithdrawals.length}건</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  새로고침
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">처리</th>
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">회원</th>
                      <th className="px-2 lg:px-4 py-3 text-right font-medium">금액</th>
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">출금계좌</th>
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">신청일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id} className={cn("hover:bg-muted/30", request.status === 'pending' && "bg-orange-500/5")}>
                        <td className="px-2 lg:px-4 py-3">
                          {request.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 px-2 bg-up hover:bg-up/90 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'approved' }),
                                  });
                                  if (!res.ok) throw new Error('승인 실패');
                                  toast.success('출금 신청이 승인되었습니다');
                                  refetchTransactions(); refetchUsers();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>승인</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'rejected' }),
                                  });
                                  if (!res.ok) throw new Error('거절 실패');
                                  toast.success('출금 신청이 거절되었습니다');
                                  refetchTransactions();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>거절</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'hold' }),
                                  });
                                  if (!res.ok) throw new Error('보류 실패');
                                  toast.success('출금 신청이 보류 처리되었습니다');
                                  refetchTransactions();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>보류</Button>
                            </div>
                          )}
                          {request.status !== 'pending' && <span className="text-xs text-muted-foreground">처리완료</span>}
                        </td>
                        <td className="px-2 lg:px-4 py-3">
                          <div className="font-medium">{request.username}</div>
                          <div className="text-xs text-muted-foreground">{request.name}</div>
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-right font-bold text-red-500">
                          -{Number(request.amount).toLocaleString()}원
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-xs">
                          {request.userBankName && (
                            <div>
                              <div>{request.userBankName}</div>
                              <div className="text-muted-foreground">{request.userAccountNumber}</div>
                              <div className="text-muted-foreground">{request.userAccountHolder}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-bold",
                            request.status === 'pending' && "bg-yellow-500/20 text-yellow-500",
                            request.status === 'approved' && "bg-green-500/20 text-green-500",
                            request.status === 'rejected' && "bg-red-500/20 text-red-500",
                            (request.status as string) === 'hold' && "bg-gray-500/20 text-gray-500"
                          )}>
                            {request.status === 'pending' ? '대기' : request.status === 'approved' ? '승인' : (request.status as string) === 'hold' ? '보류' : '거절'}
                          </span>
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {withdrawalRequests.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">출금 신청 내역이 없습니다</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Inquiries Tab - 고객센터 관리 */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl lg:text-2xl font-bold">고객센터 관리</h1>
              <Button variant="outline" size="sm" onClick={() => refetchInquiries()}>
                <RefreshCw className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">새로고침</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">총 문의</p>
                <p className="text-2xl font-bold">{inquiries.length}건</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">대기 중</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingInquiries.length}건</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="divide-y divide-border">
                {inquiries.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    등록된 문의가 없습니다
                  </div>
                ) : (
                  inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold",
                            inquiry.status === 'pending' 
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-green-500/20 text-green-500"
                          )}>
                            {inquiry.status === 'pending' ? '대기' : '답변완료'}
                          </span>
                          <span className="text-sm text-muted-foreground">{inquiry.username}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(inquiry.createdAt).toLocaleString('ko-KR', { 
                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-2">{inquiry.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{inquiry.content}</p>
                      
                      {inquiry.reply && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-primary">답변</span>
                            {inquiry.repliedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(inquiry.repliedAt).toLocaleString('ko-KR', { 
                                  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{inquiry.reply}</p>
                        </div>
                      )}
                      
                      {inquiry.status === 'pending' && (
                        <div className="space-y-2">
                          {inquiryReplyId === inquiry.id ? (
                            <>
                              <textarea
                                value={inquiryReplyContent}
                                onChange={(e) => setInquiryReplyContent(e.target.value)}
                                placeholder="답변을 입력하세요..."
                                rows={3}
                                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (!inquiryReplyContent.trim()) {
                                      toast.error("답변 내용을 입력해주세요");
                                      return;
                                    }
                                    try {
                                      const res = await fetch(`/api/admin/inquiries/${inquiry.id}/reply`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ reply: inquiryReplyContent }),
                                      });
                                      if (!res.ok) throw new Error("답변 등록 실패");
                                      toast.success("답변이 등록되었습니다");
                                      setInquiryReplyId(null);
                                      setInquiryReplyContent("");
                                      refetchInquiries();
                                    } catch (error) {
                                      toast.error("답변 등록에 실패했습니다");
                                    }
                                  }}
                                >
                                  답변 등록
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setInquiryReplyId(null);
                                    setInquiryReplyContent("");
                                  }}
                                >
                                  취소
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInquiryReplyId(inquiry.id)}
                            >
                              답변하기
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>회원 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">아이디 *</label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser(p => ({ ...p, username: e.target.value }))}
                  placeholder="아이디"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">비밀번호 *</label>
                <Input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}
                  placeholder="비밀번호"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">이름</label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
                  placeholder="이름"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">휴대폰</label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser(p => ({ ...p, phone: e.target.value }))}
                  placeholder="01012345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">시작 잔고</label>
                <Input
                  type="number"
                  value={newUser.balance}
                  onChange={(e) => setNewUser(p => ({ ...p, balance: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">권한</label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="user">일반회원</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateUserOpen(false)}>취소</Button>
              <Button onClick={() => createUser.mutate(newUser)} disabled={createUser.isPending}>
                {createUser.isPending ? '생성 중...' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 정보 수정 - {editingUser?.username}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">아이디</label>
                  <Input
                    value={editingUser.username}
                    onChange={(e) => setEditingUser(p => p ? { ...p, username: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">비밀번호</label>
                  <Input
                    type="text"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser(p => p ? { ...p, password: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">이름</label>
                  <Input
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser(p => p ? { ...p, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">휴대폰</label>
                  <Input
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(p => p ? { ...p, phone: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400 font-medium mb-2">가입 시 입력 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">주민번호</label>
                    <div className="p-2 bg-background/50 rounded-md border border-border">
                      <span className="font-mono text-sm">{editingUser.residentNumber || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">지역</label>
                    <div className="p-2 bg-background/50 rounded-md border border-border">
                      <span className="text-sm">{editingUser.region || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">은행</label>
                <Select 
                  value={editingUser.bankName || ''} 
                  onValueChange={(v) => setEditingUser(p => p ? { ...p, bankName: v } : null)}
                >
                  <SelectTrigger><SelectValue placeholder="은행 선택" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {KOREAN_BANKS.map(bank => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">예금주</label>
                  <Input
                    value={editingUser.accountHolder || ''}
                    onChange={(e) => setEditingUser(p => p ? { ...p, accountHolder: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">계좌번호</label>
                  <Input
                    value={editingUser.accountNumber || ''}
                    onChange={(e) => setEditingUser(p => p ? { ...p, accountNumber: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">접속 정보</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLoginHistoryUser(editingUser)}
                      className="h-7 text-xs"
                      data-testid="button-view-login-history"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      IP 이력
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        forceLogoutMutation.mutate(editingUser.id);
                      }}
                      disabled={forceLogoutMutation.isPending}
                      className="h-7 text-xs"
                      data-testid="button-force-logout-dialog"
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      강제 로그아웃
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">마지막 로그인 IP</label>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{editingUser.lastLoginIp || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">마지막 로그인 시간</label>
                    <div className="p-2 bg-muted/50 rounded-md text-sm">
                      {editingUser.lastLoginAt ? formatDate(editingUser.lastLoginAt) : '-'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">금액 정보</p>
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground">현재 보유머니</label>
                      <span className="text-lg font-bold text-primary font-mono">{formatMoney(editingUser.balance)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={balanceAdjustAmount}
                        onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                        placeholder="조정 금액 입력"
                        className="flex-1"
                      />
                      <button
                        onClick={() => {
                          const amount = parseFloat(balanceAdjustAmount);
                          if (!isNaN(amount) && amount > 0) {
                            const current = parseFloat(editingUser.balance) || 0;
                            setEditingUser(p => p ? { ...p, balance: String(current + amount) } : null);
                            setBalanceAdjustAmount("");
                          }
                        }}
                        className="px-3 py-2 bg-up text-white rounded-md hover:bg-up/90 text-sm font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        추가
                      </button>
                      <button
                        onClick={() => {
                          const amount = parseFloat(balanceAdjustAmount);
                          if (!isNaN(amount) && amount > 0) {
                            const current = parseFloat(editingUser.balance) || 0;
                            setEditingUser(p => p ? { ...p, balance: String(Math.max(0, current - amount)) } : null);
                            setBalanceAdjustAmount("");
                          }
                        }}
                        className="px-3 py-2 bg-down text-white rounded-md hover:bg-down/90 text-sm font-medium flex items-center gap-1"
                      >
                        <Minus className="w-4 h-4" />
                        차감
                      </button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setBalanceAdjustAmount(String(amt))}
                          className="px-2 py-1 text-[10px] bg-muted hover:bg-muted/80 rounded text-muted-foreground"
                        >
                          {(amt / 10000).toLocaleString()}만
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">총입금</label>
                      <div className="p-2 bg-muted/50 rounded-md border border-border text-sm font-mono">
                        {formatMoney(editingUser.totalDeposit)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">총출금</label>
                      <div className="p-2 bg-muted/50 rounded-md border border-border text-sm font-mono">
                        {formatMoney(editingUser.totalWithdrawal)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">권한</label>
                    <Select 
                      value={editingUser.role} 
                      onValueChange={(v) => setEditingUser(p => p ? { ...p, role: v } : null)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="user">일반회원</SelectItem>
                        <SelectItem value="admin">관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">거래 설정</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">자동거래</p>
                        <p className="text-xs text-muted-foreground">자동 거래 활성화</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(p => p ? { ...p, autoBetEnabled: !p.autoBetEnabled } : null)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        editingUser.autoBetEnabled ? "bg-yellow-500" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow",
                        editingUser.autoBetEnabled && "translate-x-5"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-down" />
                      <div>
                        <p className="text-sm font-medium">거래금지</p>
                        <p className="text-xs text-muted-foreground">거래 차단</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(p => p ? { ...p, isBettingBlocked: !p.isBettingBlocked } : null)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        editingUser.isBettingBlocked ? "bg-down" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow",
                        editingUser.isBettingBlocked && "translate-x-5"
                      )} />
                    </button>
                  </div>
                </div>
                {editingUser.autoBetEnabled && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <label className="text-xs text-yellow-500 font-medium">자동거래 배수</label>
                    <Select 
                      value={String(editingUser.autoBetMultiplier || 10)} 
                      onValueChange={(v) => setEditingUser(p => p ? { ...p, autoBetMultiplier: parseInt(v) } : null)}
                    >
                      <SelectTrigger className="mt-1 bg-background/50 border-yellow-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {[2, 5, 10, 20, 50, 100].map((m) => (
                          <SelectItem key={m} value={String(m)}>x{m} 배</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>취소</Button>
                <Button 
                  onClick={() => updateUser.mutate({
                    id: editingUser.id,
                    username: editingUser.username,
                    password: editingUser.password,
                    name: editingUser.name,
                    phone: editingUser.phone,
                    residentNumber: editingUser.residentNumber,
                    region: editingUser.region,
                    bankName: editingUser.bankName,
                    accountHolder: editingUser.accountHolder,
                    accountNumber: editingUser.accountNumber,
                    balance: editingUser.balance,
                    totalDeposit: editingUser.totalDeposit,
                    totalWithdrawal: editingUser.totalWithdrawal,
                    role: editingUser.role,
                    autoBetEnabled: editingUser.autoBetEnabled,
                    autoBetMultiplier: editingUser.autoBetMultiplier,
                    isBettingBlocked: editingUser.isBettingBlocked,
                  })} 
                  disabled={updateUser.isPending}
                >
                  {updateUser.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>회원 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteUser.mutate(deleteConfirm)}
              className="bg-down hover:bg-down/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>쪽지 보내기</DialogTitle>
          </DialogHeader>
          {messageRecipient && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">수신자:</span>{' '}
                  <span className="font-medium">{messageRecipient.username}</span>
                  {messageRecipient.name && <span className="text-muted-foreground"> ({messageRecipient.name})</span>}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">제목</label>
                <Input
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="쪽지 제목을 입력하세요"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">내용</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="쪽지 내용을 입력하세요"
                  className="w-full min-h-[120px] px-3 py-2 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>취소</Button>
                <Button
                  onClick={() => sendMessage.mutate({
                    receiverId: messageRecipient.id,
                    title: messageTitle,
                    content: messageContent,
                  })}
                  disabled={sendMessage.isPending || !messageTitle.trim() || !messageContent.trim()}
                >
                  {sendMessage.isPending ? '전송 중...' : '전송'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={!!loginHistoryUser} onOpenChange={() => setLoginHistoryUser(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>로그인 IP 이력 - {loginHistoryUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {loginHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                로그인 기록이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">IP 주소</th>
                      <th className="px-3 py-2 font-medium">접속 시간</th>
                      <th className="px-3 py-2 font-medium">브라우저 정보</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loginHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{entry.ip}</td>
                        <td className="px-3 py-2 text-xs">{formatDate(entry.loginAt)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate" title={entry.userAgent || ''}>
                          {entry.userAgent || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setLoginHistoryUser(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Affiliate Dialog */}
      <Dialog open={createAffiliateOpen} onOpenChange={setCreateAffiliateOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>총판 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">아이디 *</label>
                <Input
                  value={newAffiliate.username}
                  onChange={(e) => setNewAffiliate(p => ({ ...p, username: e.target.value }))}
                  placeholder="로그인 아이디"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">비밀번호 *</label>
                <Input
                  type="text"
                  value={newAffiliate.password}
                  onChange={(e) => setNewAffiliate(p => ({ ...p, password: e.target.value }))}
                  placeholder="비밀번호"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">표시 이름 *</label>
                <Input
                  value={newAffiliate.displayName}
                  onChange={(e) => setNewAffiliate(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="총판 표시 이름"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">연락처</label>
                <Input
                  value={newAffiliate.phone}
                  onChange={(e) => setNewAffiliate(p => ({ ...p, phone: e.target.value }))}
                  placeholder="01012345678"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">수수료율 (%)</label>
              <Input
                type="number"
                value={newAffiliate.commissionRate}
                onChange={(e) => setNewAffiliate(p => ({ ...p, commissionRate: e.target.value }))}
                placeholder="5"
                min="0"
                max="100"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              가입코드는 총판 생성 시 자동으로 생성됩니다.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateAffiliateOpen(false)}>취소</Button>
              <Button 
                onClick={() => createAffiliate.mutate(newAffiliate)} 
                disabled={createAffiliate.isPending || !newAffiliate.username || !newAffiliate.password || !newAffiliate.displayName}
              >
                {createAffiliate.isPending ? '생성 중...' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Affiliate Dialog */}
      <Dialog open={!!editingAffiliate} onOpenChange={() => setEditingAffiliate(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>총판 정보 수정 - {editingAffiliate?.displayName}</DialogTitle>
          </DialogHeader>
          {editingAffiliate && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">아이디</label>
                  <Input
                    value={editingAffiliate.username}
                    onChange={(e) => setEditingAffiliate(p => p ? { ...p, username: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">비밀번호</label>
                  <Input
                    type="text"
                    value={editingAffiliate.password}
                    onChange={(e) => setEditingAffiliate(p => p ? { ...p, password: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">표시 이름</label>
                  <Input
                    value={editingAffiliate.displayName}
                    onChange={(e) => setEditingAffiliate(p => p ? { ...p, displayName: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">연락처</label>
                  <Input
                    value={editingAffiliate.phone || ''}
                    onChange={(e) => setEditingAffiliate(p => p ? { ...p, phone: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">수수료율 (%)</label>
                <Input
                  type="number"
                  value={editingAffiliate.commissionRate}
                  onChange={(e) => setEditingAffiliate(p => p ? { ...p, commissionRate: e.target.value } : null)}
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingAffiliate(null)}>취소</Button>
                <Button 
                  onClick={() => updateAffiliate.mutate({
                    id: editingAffiliate.id,
                    username: editingAffiliate.username,
                    password: editingAffiliate.password,
                    displayName: editingAffiliate.displayName,
                    phone: editingAffiliate.phone,
                    commissionRate: editingAffiliate.commissionRate,
                  })} 
                  disabled={updateAffiliate.isPending}
                >
                  {updateAffiliate.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Affiliate Confirmation Dialog */}
      <AlertDialog open={!!deleteAffiliateConfirm} onOpenChange={() => setDeleteAffiliateConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>총판 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 총판을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              해당 총판과 연결된 회원들의 총판 정보가 해제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAffiliateConfirm && deleteAffiliate.mutate(deleteAffiliateConfirm)}
              className="bg-down hover:bg-down/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settlement Dialog */}
      <Dialog open={!!settlementAffiliate} onOpenChange={(open) => {
        if (!open) {
          setSettlementAffiliate(null);
          setSettlementAmount("");
          setSettlementMemo("");
        }
      }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              총판 정산
            </DialogTitle>
          </DialogHeader>
          {settlementAffiliate && (
            <div className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">총판</span>
                  <span className="font-medium">{settlementAffiliate.displayName} ({settlementAffiliate.username})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">정산 예정</span>
                  <span className="font-medium text-primary">{formatMoney(settlementAffiliate.pendingCommission)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">정산 금액 *</label>
                <Input
                  type="number"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder="정산할 금액을 입력하세요"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">메모 (선택)</label>
                <Input
                  value={settlementMemo}
                  onChange={(e) => setSettlementMemo(e.target.value)}
                  placeholder="정산 관련 메모"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setSettlementAffiliate(null);
                  setSettlementAmount("");
                  setSettlementMemo("");
                }}>취소</Button>
                <Button 
                  onClick={() => createSettlement.mutate({
                    affiliateId: settlementAffiliate.id,
                    amount: settlementAmount,
                    memo: settlementMemo,
                  })} 
                  disabled={createSettlement.isPending || !settlementAmount || parseInt(settlementAmount) <= 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createSettlement.isPending ? '처리 중...' : '정산 등록'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Announcement Dialog */}
      <Dialog open={createAnnouncementOpen} onOpenChange={setCreateAnnouncementOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>공지사항 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">제목 *</label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(p => ({ ...p, title: e.target.value }))}
                placeholder="공지사항 제목"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">내용 *</label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement(p => ({ ...p, content: e.target.value }))}
                placeholder="공지사항 내용"
                className="w-full min-h-[150px] px-3 py-2 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">게시 날짜</label>
              <Input
                type="date"
                value={newAnnouncement.displayDate}
                onChange={(e) => setNewAnnouncement(p => ({ ...p, displayDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAnnouncement.isPinned}
                  onChange={(e) => setNewAnnouncement(p => ({ ...p, isPinned: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">상단 고정</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAnnouncement.isActive}
                  onChange={(e) => setNewAnnouncement(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">바로 게시</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateAnnouncementOpen(false)}>취소</Button>
              <Button 
                onClick={() => createAnnouncementMutation.mutate(newAnnouncement)} 
                disabled={createAnnouncementMutation.isPending || !newAnnouncement.title || !newAnnouncement.content}
              >
                {createAnnouncementMutation.isPending ? '등록 중...' : '등록'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>공지사항 수정</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">제목</label>
                <Input
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement(p => p ? { ...p, title: e.target.value } : null)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">내용</label>
                <textarea
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement(p => p ? { ...p, content: e.target.value } : null)}
                  className="w-full min-h-[150px] px-3 py-2 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">게시 날짜</label>
                <Input
                  type="date"
                  value={editingAnnouncement.displayDate ? editingAnnouncement.displayDate.split('T')[0] : ''}
                  onChange={(e) => setEditingAnnouncement(p => p ? { ...p, displayDate: e.target.value } : null)}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAnnouncement.isPinned}
                    onChange={(e) => setEditingAnnouncement(p => p ? { ...p, isPinned: e.target.checked } : null)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">상단 고정</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAnnouncement.isActive}
                    onChange={(e) => setEditingAnnouncement(p => p ? { ...p, isActive: e.target.checked } : null)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">게시</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>취소</Button>
                <Button 
                  onClick={() => updateAnnouncementMutation.mutate({
                    id: editingAnnouncement.id,
                    title: editingAnnouncement.title,
                    content: editingAnnouncement.content,
                    isPinned: editingAnnouncement.isPinned,
                    isActive: editingAnnouncement.isActive,
                    displayDate: editingAnnouncement.displayDate,
                  })} 
                  disabled={updateAnnouncementMutation.isPending}
                >
                  {updateAnnouncementMutation.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncementConfirm} onOpenChange={() => setDeleteAnnouncementConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAnnouncementConfirm && deleteAnnouncementMutation.mutate(deleteAnnouncementConfirm)}
              className="bg-down hover:bg-down/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
