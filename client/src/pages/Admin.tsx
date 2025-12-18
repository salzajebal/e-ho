import { useState, useEffect } from "react";
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
  approvalStatus: string;
  lastLoginAt: string | null;
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
  expiresAt: string;
  createdAt: string;
  settledAt: string | null;
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
  'BTCUSDT': 'BTC/USDT',
  'ETHUSDT': 'ETH/USDT',
  'USDKRW': 'USD/KRW',
  'GOLD': 'Gold',
  'OIL': 'Oil',
  'HSI': 'Hang Seng',
};

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const doLogin = async () => {
    if (!username || !password) {
      toast.error("아이디와 비밀번호를 입력해주세요");
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
        toast.error(data.error || "로그인에 실패했습니다");
        setIsLoading(false);
        return;
      }
      
      if (data.role !== 'admin') {
        toast.error("관리자 권한이 없습니다");
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setIsLoading(false);
        return;
      }
      
      toast.success("관리자 로그인 성공");
      window.location.reload();
    } catch (error) {
      toast.error("로그인에 실패했습니다");
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
            src="/logo.png" 
            alt="Invest Korea Logo" 
            className="w-16 h-16 rounded-xl object-cover mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-white">INVEST</span>
            <span className="text-orange-500 ml-1">KOREA</span>
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
    </div>
  );
}

export default function Admin() {
  const { data: auth, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bets' | 'settings' | 'approvals' | 'messages' | 'affiliates' | 'announcements' | 'blocked-ips' | 'maintenance' | 'forced-bet' | 'transactions'>('users');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<AdminUser | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [telegramLink, setTelegramLink] = useState("");
  const [prevPendingCount, setPrevPendingCount] = useState(0);
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
  });

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    balance: '10000000',
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
  const [forcedBetSymbol, setForcedBetSymbol] = useState("NDX");
  const [forcedBetDirection, setForcedBetDirection] = useState<"long" | "short">("long");
  const [forcedBetAmount, setForcedBetAmount] = useState("");
  const [forcedBetDuration, setForcedBetDuration] = useState(60);
  const [isPlacingForcedBet, setIsPlacingForcedBet] = useState(false);

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
            toast.info(`새 베팅: ${msg.data.user?.username || 'Unknown'} - ${formatMoney(msg.data.bet.amount)}`);
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
  const availableSymbols = ["NDX", "SP500"];

  // Notification for new pending users
  useEffect(() => {
    if (pendingUsers.length > prevPendingCount) {
      // Show notification for any new pending users (including first one)
      toast.info(`새로운 가입 신청이 있습니다! (${pendingUsers.length}건)`, {
        duration: 5000,
      });
      // Play notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleC4bT3+q0sqLRxIHQZC8z6NsGAI4p+ftoHYjCCJ+l7u7fEsACh8JXXmLmYxpPwAKJiM+a4qdi2xGAAoSDzg/T1tdYV1QQAA=');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
    }
    setPrevPendingCount(pendingUsers.length);
  }, [pendingUsers.length, prevPendingCount]);

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

  // Update telegram link when settings load
  useEffect(() => {
    if (settingsData?.telegram_link !== undefined) {
      setTelegramLink(settingsData.telegram_link);
    }
  }, [settingsData]);

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
        balance: '10000000', role: 'user',
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
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
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
      toast.success("베팅 결과가 변경되었습니다");
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
      toast.success("베팅 금액이 수정되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const forceSettleBet = useMutation({
    mutationFn: async ({ betId, outcome }: { betId: number; outcome: 'win' | 'lose' }) => {
      const res = await fetch(`/api/admin/bets/${betId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to settle bet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast.success("베팅이 강제 정산되었습니다");
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
    mutationFn: async (data: { title: string; content: string; isActive: boolean; isPinned: boolean }) => {
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
      setNewAnnouncement({ title: '', content: '', isActive: true, isPinned: false });
      toast.success("공지사항이 등록되었습니다");
    },
    onError: () => {
      toast.error("등록에 실패했습니다");
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title?: string; content?: string; isActive?: boolean; isPinned?: boolean }) => {
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
        onClick={() => { setActiveTab('transactions'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
          activeTab === 'transactions'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Wallet className="w-4 h-4" />
        입출금 관리
        {pendingTransactions.length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
            {pendingTransactions.length}
          </span>
        )}
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
        onClick={() => { setActiveTab('bets'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'bets'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Target className="w-4 h-4" />
        베팅 관리
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
        강제 배팅
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
            src="/logo.png" 
            alt="Invest Korea Logo" 
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="font-bold text-sm">
            <span className="text-white">INVEST</span>
            <span className="text-orange-500 ml-1">KOREA</span>
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
              src="/logo.png" 
              alt="Invest Korea Logo" 
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <span className="font-bold text-lg">
                <span className="text-white">INVEST</span>
                <span className="text-orange-500 ml-1">KOREA</span>
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
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
              activeTab === 'transactions'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Wallet className="w-4 h-4" />
            입출금 관리
            {pendingTransactions.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {pendingTransactions.length}
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
            베팅 관리
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
            강제 배팅
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
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-up" />
                  <p className="text-sm text-muted-foreground">현재 접속자</p>
                </div>
                <p className="text-2xl font-bold mt-1 text-up">{onlineUsers.length}명</p>
                <p className="text-xs text-muted-foreground mt-1">실시간</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">총 베팅수</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalBets || 0}건</p>
                <p className="text-xs text-muted-foreground mt-1">진행 중: {stats?.pendingBets || 0}건</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">승/패</p>
                <p className="text-2xl font-bold mt-1">
                  <span className="text-up">{stats?.wonBets || 0}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-down">{stats?.lostBets || 0}</span>
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">총 수익</p>
                <p className={cn("text-2xl font-bold mt-1", (stats?.profit || 0) >= 0 ? "text-up" : "text-down")}>
                  {formatMoney(stats?.profit || 0)}
                </p>
              </div>
            </div>

            {/* Daily Stats - 날짜별 수익 (한국시간 기준) */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">날짜별 수익 현황</h2>
                  <span className="text-xs text-muted-foreground">(한국시간 기준, 최근 30일)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchDailyStats()} data-testid="button-refresh-daily-stats">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">날짜</th>
                      <th className="px-4 py-3 font-medium text-right">베팅 건수</th>
                      <th className="px-4 py-3 font-medium text-right">승/패</th>
                      <th className="px-4 py-3 font-medium text-right">총 베팅금액</th>
                      <th className="px-4 py-3 font-medium text-right">총 지급금액</th>
                      <th className="px-4 py-3 font-medium text-right">수익</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dailyStats.map((day) => (
                      <tr key={day.date} className="hover:bg-muted/30" data-testid={`row-daily-stats-${day.date}`}>
                        <td className="px-4 py-3 font-medium">
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit',
                            weekday: 'short'
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">{day.betCount}건</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-up">{day.winCount}</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-down">{day.loseCount}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatMoney(day.totalBetAmount)}</td>
                        <td className="px-4 py-3 text-right text-down">{formatMoney(day.totalPayoutAmount)}</td>
                        <td className={cn("px-4 py-3 text-right font-bold", day.houseProfitLoss >= 0 ? "text-up" : "text-down")}>
                          {day.houseProfitLoss >= 0 ? '+' : ''}{formatMoney(day.houseProfitLoss)}
                        </td>
                      </tr>
                    ))}
                    {dailyStats.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          아직 정산된 베팅 기록이 없습니다
                        </td>
                      </tr>
                    )}
                    {dailyStats.length > 0 && (
                      <tr className="bg-muted/30 font-bold">
                        <td className="px-4 py-3">합계</td>
                        <td className="px-4 py-3 text-right">{dailyStats.reduce((sum, d) => sum + d.betCount, 0)}건</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-up">{dailyStats.reduce((sum, d) => sum + d.winCount, 0)}</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-down">{dailyStats.reduce((sum, d) => sum + d.loseCount, 0)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatMoney(dailyStats.reduce((sum, d) => sum + d.totalBetAmount, 0))}</td>
                        <td className="px-4 py-3 text-right text-down">{formatMoney(dailyStats.reduce((sum, d) => sum + d.totalPayoutAmount, 0))}</td>
                        <td className={cn("px-4 py-3 text-right", dailyStats.reduce((sum, d) => sum + d.houseProfitLoss, 0) >= 0 ? "text-up" : "text-down")}>
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
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-up" />
                  <h2 className="font-semibold">실시간 접속 현황</h2>
                  <span className="text-xs bg-up/20 text-up px-2 py-0.5 rounded-full" data-testid="text-online-count">{onlineUsers.length}명 접속 중</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchOnlineUsers()} data-testid="button-refresh-online-users">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-center">상태</th>
                      <th className="px-4 py-3 font-medium">아이디</th>
                      <th className="px-4 py-3 font-medium">회원명</th>
                      <th className="px-4 py-3 font-medium">접속 IP</th>
                      <th className="px-4 py-3 font-medium">접속 시간</th>
                      <th className="px-4 py-3 font-medium text-right">현재 잔고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {onlineUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30" data-testid={`row-online-user-${user.id}`}>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-up/20">
                            <span className="w-2 h-2 rounded-full bg-up animate-pulse"></span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{user.username}</td>
                        <td className="px-4 py-3">{user.name || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs">{user.currentIp || user.lastLoginIp || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {user.connectedAt ? formatDate(user.connectedAt) : (user.lastLoginAt ? formatDate(user.lastLoginAt) : '-')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-up">
                          {formatMoney(parseFloat(user.balance || '0'))}
                        </td>
                      </tr>
                    ))}
                    {onlineUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                    <thead className="bg-muted/30">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-4 py-3 whitespace-nowrap">아이디</th>
                        <th className="px-4 py-3 whitespace-nowrap">이름</th>
                        <th className="px-4 py-3 whitespace-nowrap">전화번호</th>
                        <th className="px-4 py-3 whitespace-nowrap">은행</th>
                        <th className="px-4 py-3 whitespace-nowrap">예금주</th>
                        <th className="px-4 py-3 whitespace-nowrap">계좌번호</th>
                        <th className="px-4 py-3 whitespace-nowrap">총판코드</th>
                        <th className="px-4 py-3 whitespace-nowrap">신청일</th>
                        <th className="px-4 py-3 whitespace-nowrap text-right">승인/거절</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => {
                        const affiliate = user.affiliateId ? affiliatesList.find(a => a.id === user.affiliateId) : null;
                        return (
                        <tr key={user.id} className="border-t border-border/50 hover:bg-muted/10">
                          <td className="px-4 py-3 font-medium">{user.username}</td>
                          <td className="px-4 py-3">{user.name || '-'}</td>
                          <td className="px-4 py-3">{user.phone || '-'}</td>
                          <td className="px-4 py-3">{user.bankName || '-'}</td>
                          <td className="px-4 py-3">{user.accountHolder || '-'}</td>
                          <td className="px-4 py-3 font-mono text-xs">{user.accountNumber || '-'}</td>
                          <td className="px-4 py-3">
                            {affiliate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                                <Share2 className="w-3 h-3" />
                                {affiliate.referralCode}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => approveUser.mutate(user.id)}
                                disabled={approveUser.isPending}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectUser.mutate(user.id)}
                                disabled={rejectUser.isPending}
                              >
                                <X className="w-4 h-4 mr-1" />
                                거절
                              </Button>
                            </div>
                          </td>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">회원 관리</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button size="sm" onClick={() => setCreateUserOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  회원 생성
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-3 py-2 whitespace-nowrap">상태</th>
                      <th className="px-3 py-2 whitespace-nowrap">아이디</th>
                      <th className="px-3 py-2 whitespace-nowrap">비밀번호</th>
                      <th className="px-3 py-2 whitespace-nowrap">이름</th>
                      <th className="px-3 py-2 whitespace-nowrap">총판</th>
                      <th className="px-3 py-2 whitespace-nowrap">보유머니</th>
                      <th className="px-3 py-2 whitespace-nowrap">총베팅</th>
                      <th className="px-3 py-2 whitespace-nowrap">총입금</th>
                      <th className="px-3 py-2 whitespace-nowrap">총출금</th>
                      <th className="px-3 py-2 whitespace-nowrap">수익률</th>
                      <th className="px-3 py-2 whitespace-nowrap">자동배팅</th>
                      <th className="px-3 py-2 whitespace-nowrap">최근로그인</th>
                      <th className="px-3 py-2 whitespace-nowrap">가입일</th>
                      <th className="px-3 py-2 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-border/50 hover:bg-muted/10">
                        <td className="px-3 py-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            user.isActive ? "bg-up/20 text-up" : "bg-down/20 text-down"
                          )}>
                            {user.isActive ? '활성' : '동결'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {user.username}
                          {user.role === 'admin' && (
                            <span className="ml-1 text-xs bg-primary/20 text-primary px-1 rounded">관리자</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">
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
                        <td className="px-3 py-2">{user.name || '-'}</td>
                        <td className="px-3 py-2">
                          {user.affiliateId ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                              {affiliatesList.find(a => a.id === user.affiliateId)?.displayName || '알 수 없음'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono">{formatMoney(user.balance)}</td>
                        <td className="px-3 py-2 font-mono">{formatMoney(user.totalBet)}</td>
                        <td className="px-3 py-2 font-mono">{formatMoney(user.totalDeposit)}</td>
                        <td className="px-3 py-2 font-mono">{formatMoney(user.totalWithdrawal)}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "font-medium",
                            parseFloat(user.profitRate) >= 0 ? "text-up" : "text-down"
                          )}>
                            {parseFloat(user.profitRate) >= 0 ? '+' : ''}{user.profitRate}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => toggleAutoBet(user)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                              user.autoBetEnabled 
                                ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {user.autoBetEnabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                            {user.autoBetEnabled ? `ON (x${user.autoBetMultiplier || 10})` : 'OFF'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                              title="수정"
                            >
                              <Edit2 className="w-4 h-4" />
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
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">실시간 베팅 관리</h1>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                  wsConnected ? "bg-up/20 text-up" : "bg-down/20 text-down"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    wsConnected ? "bg-up animate-pulse" : "bg-down"
                  )} />
                  {wsConnected ? '실시간 연결됨' : '연결 끊김'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted/50 rounded-md p-0.5">
                  {(['pending', 'all', 'win', 'lose'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBetFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                        betFilter === filter 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter === 'pending' ? `진행중 (${bets.filter(b => b.outcome === 'pending').length})` :
                       filter === 'all' ? '전체' :
                       filter === 'win' ? '적중' : '미적중'}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchBets()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-3 py-2 whitespace-nowrap">종목</th>
                      <th className="px-3 py-2 whitespace-nowrap">회원</th>
                      <th className="px-3 py-2 whitespace-nowrap">방향</th>
                      <th className="px-3 py-2 whitespace-nowrap">배팅금액</th>
                      <th className="px-3 py-2 whitespace-nowrap">배당</th>
                      <th className="px-3 py-2 whitespace-nowrap">남은시간</th>
                      <th className="px-3 py-2 whitespace-nowrap">상태</th>
                      <th className="px-3 py-2 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBets.map((bet) => (
                      <tr key={bet.id} className={cn(
                        "border-t border-border/50 hover:bg-muted/10",
                        bet.outcome === 'pending' && "bg-yellow-500/5"
                      )}>
                        <td className="px-3 py-2 font-medium">
                          {SYMBOL_NAMES[bet.symbol] || bet.symbol}
                        </td>
                        <td className="px-3 py-2">{bet.username}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            bet.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                          )}>
                            {bet.direction === 'long' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {editingBetId === bet.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editingBetAmount}
                                onChange={(e) => setEditingBetAmount(e.target.value)}
                                className="w-24 h-7 text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => updateBetAmount.mutate({ betId: bet.id, amount: editingBetAmount })}
                                disabled={updateBetAmount.isPending}
                                className="p-1 rounded bg-up/20 hover:bg-up/30 text-up"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => { setEditingBetId(null); setEditingBetAmount(""); }}
                                className="p-1 rounded bg-down/20 hover:bg-down/30 text-down"
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
                        <td className="px-3 py-2 font-mono">x{bet.multiplier}</td>
                        <td className="px-3 py-2">
                          {bet.outcome === 'pending' ? (
                            <span className={cn(
                              "font-mono text-xs px-2 py-0.5 rounded",
                              new Date(bet.expiresAt).getTime() - currentTime <= 10000 
                                ? "bg-down/20 text-down animate-pulse" 
                                : "bg-yellow-500/20 text-yellow-500"
                            )}>
                              {getTimeRemaining(bet.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            bet.outcome === 'win' ? "bg-up/20 text-up" :
                            bet.outcome === 'lose' ? "bg-down/20 text-down" :
                            "bg-yellow-500/20 text-yellow-500"
                          )}>
                            {bet.outcome === 'win' ? '적중' : bet.outcome === 'lose' ? '미적중' : '진행중'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            {bet.outcome === 'pending' ? (
                              <>
                                <button
                                  onClick={() => forceSettleBet.mutate({ betId: bet.id, outcome: 'win' })}
                                  disabled={forceSettleBet.isPending}
                                  className="p-1.5 rounded transition-colors hover:bg-up/20 text-up"
                                  title="강제 적중 처리"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => forceSettleBet.mutate({ betId: bet.id, outcome: 'lose' })}
                                  disabled={forceSettleBet.isPending}
                                  className="p-1.5 rounded transition-colors hover:bg-down/20 text-down"
                                  title="강제 미적중 처리"
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
                          {betFilter === 'pending' ? '진행중인 베팅이 없습니다' : '베팅 기록이 없습니다'}
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
              <h1 className="text-2xl font-bold">강제 배팅</h1>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                회원 대신 배팅하기
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
                      <SelectItem value="NDX">NDX (NASDAQ 100)</SelectItem>
                      <SelectItem value="SP500">SP500 (S&P 500)</SelectItem>
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
                  <label className="text-sm text-muted-foreground">배팅 금액 (₩) *</label>
                  <Input
                    type="number"
                    value={forcedBetAmount}
                    onChange={(e) => setForcedBetAmount(e.target.value)}
                    placeholder="배팅 금액 입력"
                    data-testid="input-forced-bet-amount"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">배팅 시간 *</label>
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
                          multiplier: 1.90,
                        }),
                      });

                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || '강제 배팅 실패');
                      }

                      toast.success('강제 배팅이 성공적으로 등록되었습니다');
                      setForcedBetUserId('');
                      setForcedBetSymbol('NDX');
                      setForcedBetDirection('long');
                      setForcedBetAmount('');
                      setForcedBetDuration(60);
                      refetchBets();
                      refetchUsers();
                    } catch (error: any) {
                      toast.error(error.message || '강제 배팅 실패');
                    } finally {
                      setIsPlacingForcedBet(false);
                    }
                  }}
                  data-testid="button-place-forced-bet"
                >
                  {isPlacingForcedBet ? '배팅 중...' : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      강제 배팅 실행
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h3 className="font-medium text-orange-500 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                강제 배팅 안내
              </h3>
              <p className="text-sm text-muted-foreground">
                선택한 회원의 잔고에서 배팅 금액이 차감됩니다. 회원이 충분한 잔고를 보유하고 있는지 확인하세요.
                강제 배팅은 일반 배팅과 동일하게 정산됩니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">입출금 관리</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  대기 중: <span className="text-orange-500 font-bold">{pendingTransactions.length}건</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchTransactions()}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  새로고침
                </Button>
              </div>
            </div>

            {/* Pending Transactions */}
            {pendingTransactions.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="font-medium text-orange-500 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  대기 중인 신청 ({pendingTransactions.length}건)
                </h3>
                <div className="space-y-3">
                  {pendingTransactions.map((request) => (
                    <div key={request.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-bold",
                              request.type === 'deposit'
                                ? "bg-green-500/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            )}>
                              {request.type === 'deposit' ? '입금' : '출금'}
                            </span>
                            <span className="font-medium">{request.username}</span>
                            <span className="text-muted-foreground">({request.name || '이름없음'})</span>
                          </div>
                          <div className="text-xl font-bold">
                            {Number(request.amount).toLocaleString()}원
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.type === 'withdrawal' && request.userBankName && (
                              <span>계좌: {request.userBankName} {request.userAccountNumber} ({request.userAccountHolder})</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            신청일: {new Date(request.createdAt).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'rejected' }),
                                });
                                if (!res.ok) throw new Error('거절 실패');
                                toast.success('신청이 거절되었습니다');
                                refetchTransactions();
                              } catch (error) {
                                toast.error('처리에 실패했습니다');
                              }
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            거절
                          </Button>
                          <Button
                            size="sm"
                            className="bg-up hover:bg-up/90"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'approved' }),
                                });
                                if (!res.ok) throw new Error('승인 실패');
                                toast.success(request.type === 'deposit' ? '입금이 승인되었습니다' : '출금이 승인되었습니다');
                                refetchTransactions();
                                refetchUsers();
                              } catch (error) {
                                toast.error('처리에 실패했습니다');
                              }
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            승인
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Transactions */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">전체 입출금 내역</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">유형</th>
                      <th className="px-4 py-3 text-left font-medium">회원</th>
                      <th className="px-4 py-3 text-right font-medium">금액</th>
                      <th className="px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-4 py-3 text-left font-medium">신청일</th>
                      <th className="px-4 py-3 text-left font-medium">처리일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactionRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold",
                            request.type === 'deposit'
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          )}>
                            {request.type === 'deposit' ? '입금' : '출금'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{request.username}</div>
                          <div className="text-xs text-muted-foreground">{request.name}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {Number(request.amount).toLocaleString()}원
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold",
                            request.status === 'pending' && "bg-yellow-500/20 text-yellow-500",
                            request.status === 'approved' && "bg-green-500/20 text-green-500",
                            request.status === 'rejected' && "bg-red-500/20 text-red-500"
                          )}>
                            {request.status === 'pending' ? '대기' : request.status === 'approved' ? '승인' : '거절'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(request.createdAt).toLocaleString('ko-KR', { 
                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {request.processedAt 
                            ? new Date(request.processedAt).toLocaleString('ko-KR', { 
                                month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                    {transactionRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          입출금 내역이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                <p className="text-sm font-medium mb-3">금액 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">보유머니</label>
                    <Input
                      type="number"
                      value={editingUser.balance}
                      onChange={(e) => setEditingUser(p => p ? { ...p, balance: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">총입금</label>
                    <Input
                      type="number"
                      value={editingUser.totalDeposit}
                      onChange={(e) => setEditingUser(p => p ? { ...p, totalDeposit: e.target.value } : null)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">총출금</label>
                    <Input
                      type="number"
                      value={editingUser.totalWithdrawal}
                      onChange={(e) => setEditingUser(p => p ? { ...p, totalWithdrawal: e.target.value } : null)}
                    />
                  </div>
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
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>취소</Button>
                <Button 
                  onClick={() => updateUser.mutate({
                    id: editingUser.id,
                    username: editingUser.username,
                    password: editingUser.password,
                    name: editingUser.name,
                    phone: editingUser.phone,
                    bankName: editingUser.bankName,
                    accountHolder: editingUser.accountHolder,
                    accountNumber: editingUser.accountNumber,
                    balance: editingUser.balance,
                    totalDeposit: editingUser.totalDeposit,
                    totalWithdrawal: editingUser.totalWithdrawal,
                    role: editingUser.role,
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
