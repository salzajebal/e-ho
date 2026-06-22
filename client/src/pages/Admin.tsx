import { useState, useEffect, useCallback, useRef, Component } from "react";
import { LearnInvestLogo } from "@/components/LearnInvestLogo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  BarChart3,
  LogOut,
  TrendingUp,
  TrendingDown,
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  UserX,
  AlertCircle,
  List,
  ChevronLeft,
  ChevronRight,
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
import { Menu, BookOpen, Building2, Pencil, Activity } from "lucide-react";

class AdminErrorBoundary extends Component<
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
    console.error('[AdminErrorBoundary] 렌더링 오류:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
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

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  title: string;
  content: string;
  isRead: boolean;
  deletedForUser: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string | null;
  phone: string | null;
  residentNumber: string | null;
  birthDate: string | null;
  region: string | null;
  branchCode: string | null;
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
  grade: string;
  isActive: boolean;
  autoBetEnabled: boolean;
  autoBetMultiplier: number;
  isBettingBlocked: boolean;
  maxExecutionEnabled: boolean;
  forcedBetDirection: 'up' | 'down' | null;
  alwaysPendingEnabled: boolean;
  telegramNotifyEnabled: boolean;
  pendingBalanceAdjustment: string;
  withdrawalPassword: string | null;
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
  maxExecutionApplied: boolean;
  originalAmount: string | null;
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
  'BTC': '비트코인',
  'ETH': '이더리움',
  'GOLD': '금',
};

const DURATION_NAMES: Record<number, string> = {
  120: '2분',
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
      // Use separate admin auth API
      const res = await fetch("/api/admin/auth/login", {
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
    <div className="min-h-screen bg-gradient-to-br from-[#1C0F07] via-[#120906] to-[#0A0503] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LearnInvestLogo variant="icon" size={64} className="rounded-xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-amber-400 font-bold">GEMINI</span>
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
        <AlertDialogContent className="bg-[#201208] border border-red-500/30">
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

// Round Forced Directions Tab Component
function RoundForcedTab() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [selectedDuration, setSelectedDuration] = useState<number>(120);
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [isToggling, setIsToggling] = useState(false);
  const [isGlobalToggling, setIsGlobalToggling] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const duration = selectedDuration;

  const getKSTDate = (): Date => {
    const now = new Date();
    const kstOffset = 9 * 60;
    const utcOffset = now.getTimezoneOffset();
    return new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
  };

  const calculateRoundNumber = (durationSeconds: number): number => {
    const kstTime = getKSTDate();
    const secondsSinceMidnight = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
    return Math.floor(secondsSinceMidnight / durationSeconds) + 1;
  };

  const getRoundTimeRemaining = (durationSeconds: number): number => {
    const kstTime = getKSTDate();
    const secondsSinceMidnight = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
    const elapsedInRound = secondsSinceMidnight % durationSeconds;
    return durationSeconds - elapsedInRound;
  };

  const getKSTDateKey = () => {
    const kstDate = getKSTDate();
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateKey = getKSTDateKey();
  const maxRounds = Math.floor(86400 / duration);

  const getRoundTimeWindow = (roundNumber: number, durationSeconds: number): { start: string; end: string } => {
    const startSec = (roundNumber - 1) * durationSeconds;
    const endSec = roundNumber * durationSeconds;
    const fmt = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    return { start: fmt(startSec), end: fmt(Math.min(endSec, 86400)) };
  };

  useEffect(() => {
    const calculateRoundInfo = () => {
      const round = calculateRoundNumber(duration);
      const remainingSeconds = getRoundTimeRemaining(duration);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      setCurrentRound(round);
      setTimeLeft({ minutes, seconds });
      // If the selected future round has now become the current or past round, reset selection
      setSelectedRound(prev => {
        if (prev !== null && prev < round) return null;
        return prev;
      });
    };

    calculateRoundInfo();
    const interval = setInterval(calculateRoundInfo, 1000);
    return () => clearInterval(interval);
  }, [duration]);

  const { data: forcedDirections = [], refetch: refetchDirections } = useQuery<any[]>({
    queryKey: ['/api/admin/round-forced', dateKey],
    queryFn: async () => {
      const res = await fetch(`/api/admin/round-forced?dateKey=${dateKey}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: globalForced = {}, refetch: refetchGlobal } = useQuery<Record<string, string>>({
    queryKey: ['/api/admin/global-forced'],
    queryFn: async () => {
      const res = await fetch('/api/admin/global-forced', { credentials: 'include' });
      if (!res.ok) return {};
      return res.json();
    },
    refetchInterval: 5000,
  });

  const currentGlobalKey = `${selectedSymbol}:${duration}`;
  const currentGlobalValue = globalForced[currentGlobalKey] || '';

  const effectiveSelectedRound = selectedRound ?? currentRound;
  const isSelectedFuture = effectiveSelectedRound > currentRound;
  const isSelectedPast = effectiveSelectedRound < currentRound;

  const handleGlobalToggle = async (forcedOutcome: 'all_win' | 'all_lose') => {
    if (isGlobalToggling) return;
    setIsGlobalToggling(true);
    try {
      const newValue = currentGlobalValue === forcedOutcome ? 'none' : forcedOutcome;
      const res = await fetch('/api/admin/global-forced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: selectedSymbol,
          duration,
          forcedOutcome: newValue,
        }),
      });
      if (!res.ok) throw new Error('설정 실패');
      const result = await res.json();
      if (newValue === 'none') {
        toast.success(`${selectedSymbol} ${duration / 60}분 전체 회차 강제설정 해제`);
      } else {
        const reSettled = result.reSettled || 0;
        const reSettledMsg = reSettled > 0 ? ` (${reSettled}건 재정산)` : '';
        toast.success(`${selectedSymbol} ${duration / 60}분 전체 회차 ${newValue === 'all_win' ? '전체적중' : '전체미적중'} 적용${reSettledMsg}`);
      }
      refetchGlobal();
    } catch (error) {
      toast.error('글로벌 강제설정에 실패했습니다');
    } finally {
      setIsGlobalToggling(false);
    }
  };

  const currentRoundSettings = forcedDirections.filter(
    d => d.symbol === selectedSymbol && d.duration === duration && d.roundNumber === effectiveSelectedRound
  );
  const hasDirection = currentRoundSettings.find(d => d.forcedDirection === 'up' || d.forcedDirection === 'down');
  const hasOutcome = currentRoundSettings.find(d => d.forcedDirection === 'all_win' || d.forcedDirection === 'all_lose');
  const hasDisplay = currentRoundSettings.find(d => d.forcedDirection === 'display_up' || d.forcedDirection === 'display_down');

  const handleToggle = async (forcedDirection: string) => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const res = await fetch('/api/admin/round-forced/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: selectedSymbol,
          duration,
          roundNumber: effectiveSelectedRound,
          dateKey,
          forcedDirection,
        }),
      });
      if (!res.ok) throw new Error('설정 실패');
      const result = await res.json();
      const labels: Record<string, string> = { up: '매수', down: '매도', all_win: '전체적중', all_lose: '전체미적중', display_up: '결과표시↑', display_down: '결과표시↓' };
      if (result.action === 'created') {
        toast.success(`${effectiveSelectedRound}회차 ${labels[forcedDirection]} 적용`);
      } else {
        toast.success(`${effectiveSelectedRound}회차 ${labels[forcedDirection]} 해제`);
      }
      refetchDirections();
    } catch (error) {
      toast.error('회차별 설정에 실패했습니다');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteForced = async (item: any) => {
    try {
      const res = await fetch('/api/admin/round-forced/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: item.symbol,
          duration: item.duration,
          roundNumber: item.roundNumber,
          dateKey: item.dateKey,
          forcedDirection: item.forcedDirection,
        }),
      });
      if (!res.ok) throw new Error('삭제 실패');
      toast.success('설정이 해제되었습니다');
      refetchDirections();
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  const filteredDirections = forcedDirections
    .filter(d => d.symbol === selectedSymbol && d.duration === duration)
    .sort((a, b) => b.roundNumber - a.roundNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">회차별 거래결과 설정</h1>
      </div>

      {/* Current Round Status Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs opacity-80">현재 진행 중인 회차</div>
            <div className="text-2xl font-bold">{currentRound}회차</div>
            <div className="text-xs opacity-70">총 {maxRounds}회차 중</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">남은 시간</div>
          <div className="text-3xl font-mono font-bold">
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Round Picker */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-yellow-500" />
            회차 선택
            {isSelectedFuture && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-normal">예약 모드</span>
            )}
            {isSelectedPast && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">과거 회차</span>
            )}
          </h3>
          {selectedRound !== null && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedRound(null)}
            >
              현재 회차로 돌아가기
            </Button>
          )}
        </div>
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <div className="flex gap-2 min-w-max">
            {Array.from({ length: 20 }, (_, i) => currentRound - 2 + i)
              .filter(r => r >= 1 && r <= maxRounds)
              .map(r => {
                const { start, end } = getRoundTimeWindow(r, duration);
                const rSettings = forcedDirections.filter(
                  d => d.symbol === selectedSymbol && d.duration === duration && d.roundNumber === r
                );
                const isSelected = r === effectiveSelectedRound;
                const isCurrent = r === currentRound;
                const isFuture = r > currentRound;
                const isPast = r < currentRound;
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRound(isCurrent ? null : r)}
                    className={cn(
                      "flex flex-col items-center px-2.5 py-2 rounded-lg border min-w-[72px] transition-all text-left",
                      isSelected && isCurrent
                        ? "border-blue-500 bg-blue-500/20 ring-1 ring-blue-500"
                        : isSelected
                        ? "border-amber-500 bg-amber-500/20 ring-1 ring-amber-500"
                        : isCurrent
                        ? "border-blue-500/50 bg-blue-500/10"
                        : isFuture
                        ? "border-border hover:border-green-500/50 hover:bg-green-500/5 cursor-pointer"
                        : "border-border/50 bg-muted/10 opacity-60 cursor-pointer"
                    )}
                  >
                    <span className={cn("text-xs font-bold", isCurrent ? "text-blue-400" : isFuture ? "text-foreground" : "text-muted-foreground")}>
                      #{r}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{start}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">~{end}</span>
                    {isCurrent && (
                      <span className="text-[8px] text-blue-400 font-medium mt-0.5">진행중</span>
                    )}
                    {isFuture && rSettings.length === 0 && (
                      <span className="text-[8px] text-muted-foreground mt-0.5">대기</span>
                    )}
                    {isPast && rSettings.length === 0 && (
                      <span className="text-[8px] text-muted-foreground mt-0.5">종료</span>
                    )}
                    {rSettings.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                        {rSettings.map((s: any) => (
                          <span key={s.id} className={cn(
                            "text-[8px] px-1 py-0.5 rounded font-bold",
                            s.forcedDirection === 'display_up' ? "bg-cyan-500/30 text-cyan-400" :
                            s.forcedDirection === 'display_down' ? "bg-amber-500/30 text-amber-400" :
                            s.forcedDirection === 'all_win' ? "bg-green-500/30 text-green-400" :
                            s.forcedDirection === 'all_lose' ? "bg-red-500/30 text-red-400" :
                            s.forcedDirection === 'up' ? "bg-up/30 text-up" :
                            "bg-down/30 text-down"
                          )}>
                            {s.forcedDirection === 'display_up' ? '↑' :
                             s.forcedDirection === 'display_down' ? '↓' :
                             s.forcedDirection === 'all_win' ? '✓전' :
                             s.forcedDirection === 'all_lose' ? '✗전' :
                             s.forcedDirection === 'up' ? '↑매' : '↓매'}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          현재 회차 이후를 선택하면 해당 회차 시작 전 미리 결과를 예약할 수 있습니다. 회차가 종료될 때 자동으로 적용됩니다.
        </p>
      </div>

      {/* Symbol & Duration Selection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          종목/시간 선택
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground font-medium">종목 선택</label>
              <div className="grid grid-cols-3 gap-2">
                {[{s:'BTC',l:'비트코인'},{s:'ETH',l:'이더리움'},{s:'GOLD',l:'금'}].map(({s,l}) => (
                  <Button
                    key={s}
                    type="button"
                    variant={selectedSymbol === s ? 'default' : 'outline'}
                    className={cn(
                      "h-12 text-sm font-bold",
                      selectedSymbol === s && "bg-amber-600 hover:bg-amber-700"
                    )}
                    onClick={() => setSelectedSymbol(s)}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground font-medium">시간 선택</label>
              <div className="flex gap-2">
                {[120].map(d => (
                  <Button
                    key={d}
                    type="button"
                    variant={selectedDuration === d ? 'default' : 'outline'}
                    className={cn(
                      "flex-1 h-12 text-sm font-bold",
                      selectedDuration === d && "bg-amber-600 hover:bg-amber-700"
                    )}
                    onClick={() => setSelectedDuration(d)}
                  >
                    {d / 60}분
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Forced Settings - 전체 회차 자동 적용 */}
      <div className={cn(
        "border rounded-lg p-6",
        currentGlobalValue ? "bg-gradient-to-r from-purple-900/30 to-purple-800/20 border-purple-500/50" : "bg-card border-border"
      )}>
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          전체 회차 자동 적용 (끌 때까지 모든 회차에 적용)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          켜두면 어드민이 보지 않아도 해당 종목/시간의 모든 회차에 자동으로 적용됩니다. 개별 회차 설정이 있으면 개별 설정이 우선합니다.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            disabled={isGlobalToggling}
            className={cn(
              "h-16 text-lg font-bold transition-all",
              currentGlobalValue === 'all_win'
                ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                : "bg-transparent border-2 border-green-600/50 text-green-500 hover:bg-green-600/10"
            )}
            onClick={() => handleGlobalToggle('all_win')}
            data-testid="toggle-global-all-win"
          >
            <Check className="w-5 h-5 mr-2" />
            전체적중 (자동)
            {currentGlobalValue === 'all_win' && <Check className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            type="button"
            disabled={isGlobalToggling}
            className={cn(
              "h-16 text-lg font-bold transition-all",
              currentGlobalValue === 'all_lose'
                ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-500 ring-offset-2 ring-offset-background"
                : "bg-transparent border-2 border-red-600/50 text-red-500 hover:bg-red-600/10"
            )}
            onClick={() => handleGlobalToggle('all_lose')}
            data-testid="toggle-global-all-lose"
          >
            <X className="w-5 h-5 mr-2" />
            전체미적중 (자동)
            {currentGlobalValue === 'all_lose' && <Check className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {currentGlobalValue && (
          <div className="mt-4 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1.5 rounded-full text-sm font-bold animate-pulse",
                currentGlobalValue === 'all_win' ? "bg-green-600/20 text-green-500" : "bg-red-600/20 text-red-500"
              )}>
                {currentGlobalValue === 'all_win' ? '✅ 전체적중' : '❌ 전체미적중'} 자동 적용 중
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedSymbol} {duration / 60}분 - 모든 회차
              </span>
            </div>
          </div>
        )}

        {/* Show all active global settings */}
        {Object.keys(globalForced).filter(k => globalForced[k]).length > 0 && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">현재 활성화된 글로벌 설정:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(globalForced).filter(([, v]) => v).map(([key, value]) => {
                const [sym, dur] = key.split(':');
                return (
                  <span key={key} className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    value === 'all_win' ? "bg-green-600/20 text-green-500" : "bg-red-600/20 text-red-500",
                    key === currentGlobalKey && "ring-1 ring-white/30"
                  )}>
                    {sym} {parseInt(dur) / 60}분: {value === 'all_win' ? '전체적중' : '전체미적중'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Round Settings */}
      <div className={cn(
        "border rounded-lg p-6",
        isSelectedFuture ? "bg-green-950/20 border-green-500/30" : "bg-card border-border"
      )}>
        <h3 className="font-medium mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          {effectiveSelectedRound}회차 설정
          {isSelectedFuture && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              예약 — 회차 종료 시 자동 적용
            </span>
          )}
          {!isSelectedFuture && !isSelectedPast && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">진행중</span>
          )}
          {isSelectedPast && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">종료된 회차</span>
          )}
        </h3>
        {isSelectedFuture && (
          <p className="text-xs text-green-400/70 mb-4">
            ⏰ {getRoundTimeWindow(effectiveSelectedRound, duration).start} ~ {getRoundTimeWindow(effectiveSelectedRound, duration).end} 회차에 미리 결과를 예약합니다.
          </p>
        )}
        {!isSelectedFuture && !isSelectedPast && (
          <p className="text-xs text-muted-foreground mb-4">현재 진행 중인 회차입니다. 설정 즉시 적용됩니다.</p>
        )}
        {isSelectedPast && (
          <p className="text-xs text-muted-foreground mb-4">이미 종료된 회차입니다. 재정산이 발생할 수 있습니다.</p>
        )}

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground font-medium">결과 방향 강제 (표시 + 정산 연동)</label>
            <p className="text-xs text-muted-foreground">이 회차의 결과 방향을 강제합니다. 매수 설정 시 매수 베팅 유저는 적중, 매도 유저는 미적중 처리됩니다.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={isToggling}
                className={cn(
                  "h-14 text-base font-bold transition-all",
                  hasDisplay?.forcedDirection === 'display_up'
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white ring-2 ring-cyan-500 ring-offset-2 ring-offset-background"
                    : "bg-transparent border-2 border-cyan-600/50 text-cyan-500 hover:bg-cyan-600/10"
                )}
                onClick={() => handleToggle('display_up')}
                data-testid="toggle-round-display-up"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                매수↑
                {hasDisplay?.forcedDirection === 'display_up' && <Check className="w-4 h-4 ml-2" />}
              </Button>
              <Button
                type="button"
                disabled={isToggling}
                className={cn(
                  "h-14 text-base font-bold transition-all",
                  hasDisplay?.forcedDirection === 'display_down'
                    ? "bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
                    : "bg-transparent border-2 border-amber-600/50 text-amber-500 hover:bg-amber-600/10"
                )}
                onClick={() => handleToggle('display_down')}
                data-testid="toggle-round-display-down"
              >
                <TrendingDown className="w-5 h-5 mr-2" />
                매도↓
                {hasDisplay?.forcedDirection === 'display_down' && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>

          {/* Current settings summary */}
          {(hasDirection || hasOutcome || hasDisplay) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">{effectiveSelectedRound}회차 현재 설정:</div>
              <div className="flex flex-wrap gap-2">
                {hasDirection && (
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-bold",
                    hasDirection.forcedDirection === 'up' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                  )}>
                    {hasDirection.forcedDirection === 'up' ? '📈 매수' : '📉 매도'}
                  </span>
                )}
                {hasOutcome && (
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-bold",
                    hasOutcome.forcedDirection === 'all_win' ? "bg-green-600/20 text-green-500" : "bg-red-600/20 text-red-500"
                  )}>
                    {hasOutcome.forcedDirection === 'all_win' ? '✅ 전체적중' : '❌ 전체미적중'}
                  </span>
                )}
                {hasDisplay && (
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-bold",
                    hasDisplay.forcedDirection === 'display_up' ? "bg-cyan-600/20 text-cyan-500" : "bg-amber-600/20 text-amber-500"
                  )}>
                    {hasDisplay.forcedDirection === 'display_up' ? '🔵 매수↑' : '🟠 매도↓'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-medium">
            {SYMBOL_NAMES[selectedSymbol] || selectedSymbol} {duration / 60}분 - 오늘 설정된 회차 목록
          </h3>
          <Button variant="outline" size="sm" onClick={() => refetchDirections()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            새로고침
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium">회차</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-center font-medium">설정</th>
                <th className="px-4 py-3 text-center font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDirections.map((item) => (
                <tr key={item.id} className={cn(
                  "hover:bg-muted/30",
                  item.roundNumber === currentRound && "bg-blue-500/10"
                )}>
                  <td className="px-4 py-3 font-mono">
                    {item.roundNumber}회차
                    {item.roundNumber === currentRound && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">진행중</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.roundNumber < currentRound ? (
                      <span className="text-muted-foreground">완료</span>
                    ) : item.roundNumber === currentRound ? (
                      <span className="text-blue-500 font-medium">진행중</span>
                    ) : (
                      <span className="text-green-500">대기 중</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded text-sm font-medium",
                      item.forcedDirection === 'up' ? "bg-up/20 text-up" :
                      item.forcedDirection === 'down' ? "bg-down/20 text-down" :
                      item.forcedDirection === 'all_win' ? "bg-green-600/20 text-green-500" :
                      item.forcedDirection === 'all_lose' ? "bg-red-600/20 text-red-500" :
                      item.forcedDirection === 'display_up' ? "bg-cyan-600/20 text-cyan-500" :
                      item.forcedDirection === 'display_down' ? "bg-amber-600/20 text-amber-500" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {item.forcedDirection === 'up' ? '매수' : 
                       item.forcedDirection === 'down' ? '매도' :
                       item.forcedDirection === 'all_win' ? '전체적중' :
                       item.forcedDirection === 'all_lose' ? '전체미적중' :
                       item.forcedDirection === 'display_up' ? '매수↑' :
                       item.forcedDirection === 'display_down' ? '매도↓' : item.forcedDirection}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.roundNumber >= currentRound && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDeleteForced(item)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDirections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    설정된 회차가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          회차별 설정 안내
        </h3>
        <p className="text-sm text-muted-foreground">
          현재 진행 중인 회차의 거래 결과를 강제로 설정합니다. 설정된 회차에서는 모든 사용자의 거래가 지정된 방향으로 정산됩니다.
          매수로 설정하면 매수 거래는 승리, 매도 거래는 패배로 처리됩니다.
        </p>
      </div>
    </div>
  );
}

export default function Admin() {
  // Track if user was previously logged in (to detect session expiration)
  const wasLoggedInRef = useRef(false);
  const [sessionExpiredDialogOpen, setSessionExpiredDialogOpen] = useState(false);

  // Use separate admin auth API (not shared with user session)
  const { data: auth, isLoading: authLoading } = useQuery<{ id: string; username: string; role: string } | null>({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 3000,
    refetchInterval: 10000, // Check session every 10 seconds (faster detection)
  });

  // Detect session expiration - show dialog and reset to login view
  useEffect(() => {
    if (!authLoading) {
      if (auth) {
        wasLoggedInRef.current = true;
        setSessionExpiredDialogOpen(false);
      } else if (wasLoggedInRef.current && !auth) {
        wasLoggedInRef.current = false;
        setSessionExpiredDialogOpen(true);
      }
    }
  }, [auth, authLoading]);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Admin logout - only clears admin session
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
      queryClient.setQueryData(["/api/admin/auth/me"], null);
      toast.success("로그아웃되었습니다");
      window.location.reload();
    } catch (error) {
      toast.error("로그아웃에 실패했습니다");
    }
  };

  // Prevent browser back button from leaving admin page
  useEffect(() => {
    // Replace current history state to prevent going back to previous page
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      // Push the state again to prevent leaving
      window.history.pushState(null, '', window.location.href);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  type AdminTab = 'dashboard' | 'users' | 'bets' | 'settings' | 'approvals' | 'messages' | 'announcements' | 'blocked-ips' | 'maintenance' | 'forced-bet' | 'round-forced' | 'deposits' | 'withdrawals' | 'inquiries' | 'branches' | 'order-history';
  const VALID_TABS: AdminTab[] = ['dashboard', 'users', 'bets', 'settings', 'approvals', 'messages', 'announcements', 'blocked-ips', 'maintenance', 'forced-bet', 'round-forced', 'deposits', 'withdrawals', 'inquiries', 'branches', 'order-history'];
  const savedTab = localStorage.getItem('admin_active_tab') as AdminTab | null;
  const [activeTab, setActiveTabState] = useState<AdminTab>(savedTab && VALID_TABS.includes(savedTab) ? savedTab : 'users');
  const setActiveTab = (tab: AdminTab) => {
    localStorage.setItem('admin_active_tab', tab);
    setActiveTabState(tab);
  };
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(20);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const { data: orderHistory, refetch: refetchOrderHistory } = useQuery<{
    bets: Array<{
      id: number; userId: string; username: string; name: string; symbol: string;
      direction: string; amount: string; duration: number; roundNumber: number;
      outcome: string; forcedOutcome: string | null; payout: string | null;
      multiplier: string; balanceBefore: string | null; balanceAfter: string | null;
      createdAt: string; settledAt: string | null;
    }>;
    total: number; totalPages: number;
  }>({
    queryKey: ['/api/admin/bets/history', orderPage, orderPageSize, orderSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: orderPage.toString(),
        pageSize: orderPageSize.toString(),
        search: orderSearch,
      });
      const res = await fetch(`/api/admin/bets/history?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: activeTab === 'order-history',
  });
  const [inquiryReplyId, setInquiryReplyId] = useState<number | null>(null);
  const [inquiryReplyContent, setInquiryReplyContent] = useState("");
  const [inquiryEditId, setInquiryEditId] = useState<number | null>(null);
  const [inquiryEditContent, setInquiryEditContent] = useState("");
  const [inquirySearch, setInquirySearch] = useState("");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<AdminUser | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [editingMessage, setEditingMessage] = useState<{ id: number; title: string; content: string } | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState("");
  const [pendingAdjustAmount, setPendingAdjustAmount] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSortField, setUserSortField] = useState<string | null>(null);
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loginHistoryUser, setLoginHistoryUser] = useState<AdminUser | null>(null);
  const [telegramLink, setTelegramLink] = useState("");
  const [kakaoLink, setKakaoLink] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [depositNotice, setDepositNotice] = useState("");
  const [withdrawalLockNotice, setWithdrawalLockNotice] = useState("");
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingTemplateTitle, setEditingTemplateTitle] = useState("");
  const [editingTemplateContent, setEditingTemplateContent] = useState("");
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
  const [deleteTransactionConfirm, setDeleteTransactionConfirm] = useState<number | null>(null);
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

  // Per-user max execution toggle
  const toggleUserMaxExecution = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/max-execution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      refetchUsers();
      toast.success(variables.enabled ? "맥스체결 ON" : "맥스체결 OFF");
    },
    onError: () => {
      toast.error("맥스체결 변경 실패");
    },
  });

  const toggleBetMaxExecution = useMutation({
    mutationFn: async ({ betId, enabled }: { betId: number; enabled: boolean }) => {
      const res = await fetch(`/api/admin/bets/${betId}/max-execution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      return res.json();
    },
    onMutate: ({ betId, enabled }) => {
      setBetMaxExecOverride(prev => ({ ...prev, [betId]: enabled }));
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<AdminBet[]>(["/api/admin/bets"], (old) =>
        old ? old.map(b => b.id === variables.betId ? { ...b, maxExecutionApplied: variables.enabled } : b) : old
      );
      setBetMaxExecOverride(prev => { const next = { ...prev }; delete next[variables.betId]; return next; });
      refetchUsers();
      toast.success(variables.enabled ? "10x 체결 ON" : "10x 체결 해제");
    },
    onError: (error: Error, variables) => {
      setBetMaxExecOverride(prev => { const next = { ...prev }; delete next[variables.betId]; return next; });
      toast.error(error.message || "10x 체결 변경 실패");
    },
  });

  const batchMaxExecution = useMutation({
    mutationFn: async ({ userIds, enabled }: { userIds: string[]; enabled: boolean }) => {
      const res = await fetch("/api/admin/users/batch-max-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userIds, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      refetchUsers();
      toast.success(`${variables.userIds.length}명 맥스체결 ${variables.enabled ? "ON" : "OFF"}`);
    },
    onError: () => {
      toast.error("일괄 변경 실패");
    },
  });

  // Betting control states
  const [betFilter, setBetFilter] = useState<'all' | 'pending' | 'win' | 'lose'>('pending');
  const [betMaxExecOverride, setBetMaxExecOverride] = useState<Record<number, boolean>>({});
  const [editingBetId, setEditingBetId] = useState<number | null>(null);
  const [editingBetAmount, setEditingBetAmount] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Forced betting states
  const [forcedBetUserId, setForcedBetUserId] = useState("");
  const [forcedBetSymbol, setForcedBetSymbol] = useState("BTC");
  const [forcedBetDuration, setForcedBetDuration] = useState<number>(120);
  const [forcedBetDirection, setForcedBetDirection] = useState<"long" | "short">("long");
  const [forcedBetAmount, setForcedBetAmount] = useState("");
  const [forcedBetUserSearch, setForcedBetUserSearch] = useState("");
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
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 10000,
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
      const res = await fetch("/api/admin/daily-stats?days=30", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily stats");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const { data: users = [], refetch: refetchUsers, isFetching: isUsersFetching } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });

  const { data: bets = [], refetch: refetchBets } = useQuery<AdminBet[]>({
    queryKey: ["/api/admin/bets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bets", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bets");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  // Pending users for approval
  const { data: pendingUsers = [], refetch: refetchPendingUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/pending-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending-users", { credentials: "include" });
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
    senderName: string | null;
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
      const res = await fetch("/api/admin/transactions", { credentials: "include" });
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

  // 날짜별 입출금 집계 (승인된 건 기준, KST 기준)
  const dailyTransactionMap = transactionRequests
    .filter(t => t.status === 'approved')
    .reduce<Record<string, { deposit: number; withdrawal: number }>>((acc, t) => {
      const kst = new Date(new Date(t.createdAt).getTime() + 9 * 60 * 60 * 1000);
      const dateKey = kst.toISOString().slice(0, 10);
      if (!acc[dateKey]) acc[dateKey] = { deposit: 0, withdrawal: 0 };
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'deposit') acc[dateKey].deposit += amt;
      else acc[dateKey].withdrawal += amt;
      return acc;
    }, {});

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
    isReplyRead: boolean;
    createdAt: string;
    username?: string;
    name?: string;
  }
  const { data: inquiries = [], refetch: refetchInquiries } = useQuery<Inquiry[]>({
    queryKey: ["/api/admin/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inquiries", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });
  const pendingInquiries = inquiries.filter(i => i.status === 'pending');

  // Inquiry templates (1:1 문의 답변 템플릿)
  interface InquiryTemplate {
    id: number;
    title: string;
    content: string;
    createdAt: string;
  }
  const { data: inquiryTemplates = [], refetch: refetchTemplates } = useQuery<InquiryTemplate[]>({
    queryKey: ["/api/admin/inquiry-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inquiry-templates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inquiry templates");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  // WebSocket for real-time bet and transaction updates
  useEffect(() => {
    if (auth?.role !== 'admin') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/admin`);

    ws.onopen = () => {
      console.log('Admin WebSocket connection opened');
    };

    const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
    const debouncedRefetch = (key: string, fn: () => void, delay = 1000) => {
      if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
      debounceTimers[key] = setTimeout(fn, delay);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'connected') {
          setWsConnected(true);
          console.log('Admin WebSocket authenticated via session');
        } else if (msg.event === 'force_logout') {
          console.log('Admin force logout received');
          queryClient.setQueryData(["/api/admin/auth/me"], null);
        } else if (msg.event === 'bet_placed' || msg.event === 'bet_updated' || msg.event === 'bet_settled') {
          debouncedRefetch('bets', () => refetchBets());
          debouncedRefetch('users', () => refetchUsers());
          if (msg.event === 'bet_placed') {
            toast.info(`새 거래: ${msg.data.user?.username || 'Unknown'} - ${formatMoney(msg.data.bet.amount)}`);
          }
        } else if (msg.event === 'balance_updated') {
          debouncedRefetch('users', () => refetchUsers());
        } else if (msg.event === 'transaction_request') {
          debouncedRefetch('transactions', () => refetchTransactions());
          debouncedRefetch('users', () => refetchUsers());
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
        } else if (msg.event === 'new_user_registered') {
          debouncedRefetch('pendingUsers', () => refetchPendingUsers());
          const displayName = msg.data?.name || msg.data?.username || '알 수 없음';
          toast.info(`🆕 새 회원가입: ${displayName}`, {
            duration: 8000,
            style: { fontWeight: 'bold' },
          });
        } else if (msg.event === 'user_connected' || msg.event === 'user_disconnected') {
          debouncedRefetch('onlineUsers', () => refetchOnlineUsers());
        }
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    ws.onclose = (event) => {
      setWsConnected(false);
      console.log(`Admin WebSocket disconnected (code: ${event.code})`);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => ws.close();
  }, [auth?.role, refetchBets, refetchTransactions, refetchUsers, refetchPendingUsers]);

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
      const res = await fetch("/api/admin/online-users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch online users");
      return res.json();
    },
    enabled: auth?.role === 'admin',
    refetchInterval: 5000,
  });

  // Affiliates
  const { data: affiliatesList = [], refetch: refetchAffiliates } = useQuery<AdminAffiliate[]>({
    queryKey: ["/api/admin/affiliates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/affiliates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch affiliates");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  // Announcements
  const { data: announcementsList = [], refetch: refetchAnnouncements } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    queryFn: async () => {
      const res = await fetch("/api/admin/announcements", { credentials: "include" });
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
      const res = await fetch("/api/admin/blocked-ips", { credentials: "include" });
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
        credentials: "include",
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
        credentials: "include",
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
      const res = await fetch("/api/admin/maintenance", { credentials: "include" });
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
  const availableSymbols = ["BTC", "ETH", "GOLD"];

  // Branch management (지점코드 관리)
  const [newBranch, setNewBranch] = useState({ code: "", name: "" });
  const [editingBranch, setEditingBranch] = useState<{ id: number; code: string; name: string; isActive: boolean } | null>(null);
  const { data: branchesList = [] } = useQuery<{ id: number; code: string; name: string; isActive: boolean; createdAt: string }[]>({
    queryKey: ["/api/admin/branches"],
    queryFn: async () => {
      const res = await fetch("/api/admin/branches", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch branches");
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const createBranch = useMutation({
    mutationFn: async (data: { code: string; name: string }) => {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create branch");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      setNewBranch({ code: "", name: "" });
      toast.success("지점코드가 생성되었습니다");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateBranch = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; code?: string; name?: string; isActive?: boolean }) => {
      const res = await fetch(`/api/admin/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      setEditingBranch(null);
      toast.success("지점코드가 수정되었습니다");
    },
    onError: () => {
      toast.error("지점코드 수정에 실패했습니다");
    },
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/branches/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      toast.success("지점코드가 삭제되었습니다");
    },
    onError: () => {
      toast.error("지점코드 삭제에 실패했습니다");
    },
  });

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
      const newDeposits = pendingDeposits.length;
      const newWithdrawals = pendingWithdrawals.length;
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
  }, [pendingTransactions.length, prevTransactionCount, playNotificationSound, speakNotification, pendingDeposits.length, pendingWithdrawals.length]);

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

  const holdUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/hold`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to hold user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast.success("회원 가입이 보류 처리되었습니다");
    },
    onError: () => {
      toast.error("보류 처리에 실패했습니다");
    },
  });

  const updateMessage = useMutation({
    mutationFn: async ({ id, title, content }: { id: number; title: string; content: string }) => {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to update message");
      return res.json();
    },
    onSuccess: () => {
      if (messageManageUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/messages", messageManageUser.id] });
      }
      setEditingMessage(null);
      toast.success("쪽지가 수정되었습니다");
    },
    onError: () => toast.error("쪽지 수정에 실패했습니다"),
  });

  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, title, content }: { receiverId: string; title: string; content: string }) => {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, title, content }),
        credentials: 'include',
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

  // Message management state
  const [messageManageUser, setMessageManageUser] = useState<AdminUser | null>(null);
  
  // Fetch messages for user (admin view - includes deleted)
  const { data: userMessagesData = [], refetch: refetchUserMessages } = useQuery<Message[]>({
    queryKey: ["/api/admin/messages", messageManageUser?.id],
    queryFn: async () => {
      if (!messageManageUser) return [];
      const res = await fetch(`/api/admin/messages/${messageManageUser.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!messageManageUser,
  });

  // Soft delete message for user
  const deleteMessageForUser = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete message");
      return res.json();
    },
    onSuccess: () => {
      refetchUserMessages();
      toast.success("메시지가 회원에게서 삭제되었습니다");
    },
    onError: () => {
      toast.error("메시지 삭제에 실패했습니다");
    },
  });

  // Update settings when data loads
  useEffect(() => {
    if (settingsData?.telegram_link !== undefined) {
      setTelegramLink(settingsData.telegram_link);
    }
    if (settingsData?.kakao_link !== undefined) {
      setKakaoLink(settingsData.kakao_link);
    }
    if (settingsData?.company_info !== undefined) {
      setCompanyInfo(settingsData.company_info);
    }
    if (settingsData?.deposit_notice !== undefined) {
      setDepositNotice(settingsData.deposit_notice);
    }
    if (settingsData?.withdrawal_lock_notice !== undefined) {
      setWithdrawalLockNotice(settingsData.withdrawal_lock_notice);
    }
  }, [settingsData]);

  // ── 텔레그램 봇 알림 설정 상태 ──────────────────────────────────────────
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [tgShowToken, setTgShowToken] = useState(false);
  const [tgDetectedChats, setTgDetectedChats] = useState<{ id: string; title: string; type: string }[]>([]);

  const { data: tgBotData, refetch: refetchTgBot } = useQuery<{
    botToken: string; chatId: string; configured: boolean;
  }>({
    queryKey: ["/api/admin/settings/telegram-bot"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings/telegram-bot", { credentials: "include" });
      if (!res.ok) return { botToken: "", chatId: "", configured: false };
      return res.json();
    },
    enabled: auth?.role === 'admin',
  });

  const saveTgBot = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings/telegram-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ botToken: tgBotToken, chatId: tgChatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      return data;
    },
    onSuccess: () => {
      toast.success("텔레그램 봇 설정이 저장되었습니다");
      setTgBotToken("");
      setTgChatId("");
      refetchTgBot();
    },
    onError: (e: any) => toast.error(e.message || "저장에 실패했습니다"),
  });

  const deleteTgBot = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings/telegram-bot", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      toast.success("텔레그램 봇 설정이 초기화되었습니다");
      refetchTgBot();
    },
    onError: () => toast.error("초기화에 실패했습니다"),
  });

  const testTgBot = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings/telegram-bot/test", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "테스트 실패");
      return data;
    },
    onSuccess: () => toast.success("테스트 메시지가 전송되었습니다 ✅"),
    onError: (e: any) => toast.error(e.message || "테스트 전송에 실패했습니다"),
  });

  const detectTgChat = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch("/api/admin/settings/telegram-bot/detect-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ botToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "감지 실패");
      return data as { chats: { id: string; title: string; type: string }[] };
    },
    onSuccess: (data) => {
      if (data.chats.length === 0) {
        toast.error("감지된 채팅방이 없습니다. 봇을 그룹방에 초대한 뒤 그룹방에서 메시지를 보내고 다시 시도하세요.");
      } else {
        setTgDetectedChats(data.chats);
        toast.success(`${data.chats.length}개의 채팅방이 감지되었습니다`);
      }
    },
    onError: (e: any) => toast.error(e.message || "채팅 ID 감지에 실패했습니다"),
  });

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

  const changeBetDirection = useMutation({
    mutationFn: async ({ betId, direction }: { betId: number; direction: 'long' | 'short' }) => {
      const res = await fetch(`/api/admin/bets/${betId}/direction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "포지션 변경 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      toast.success("포지션이 변경되었습니다");
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

  const setUserForcedDirection = useMutation({
    mutationFn: async ({ userId, direction }: { userId: number | string; direction: 'up' | 'down' | null }) => {
      const res = await fetch(`/api/admin/users/${userId}/forced-bet-direction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set direction");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast.success(data.message || "강제 방향 설정됨");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const forceBetOutcome = useMutation({
    mutationFn: async ({ betId, forcedOutcome }: { betId: number; forcedOutcome: 'win' | 'lose' | null }) => {
      const res = await fetch(`/api/admin/bets/${betId}/force-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forcedOutcome }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set forced outcome");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bets"] });
      toast.success(data.message || "강제 결과 설정됨");
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
  // Also hide pending bets that expired more than 10 seconds ago (they should be settled by auto-settlement)
  const safeBets = Array.isArray(bets) ? bets : [];
  const filteredBets = safeBets.filter(bet => {
    // For pending filter, hide bets that are expired for more than 10 seconds
    if (bet.outcome === 'pending') {
      const expiresAt = new Date(bet.expiresAt).getTime();
      const now = currentTime;
      if (now - expiresAt > 10000) {
        return false;
      }
    }
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

  const resetWithdrawalPinLockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-withdrawal-pin-lock`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "출금 비밀번호 잠금이 해제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-pin-locks"] });
    },
    onError: () => {
      toast.error("잠금 해제에 실패했습니다");
    },
  });

  const lockWithdrawalPinMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/lock-withdrawal-pin`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "출금이 잠금 처리되었습니다");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-pin-locks"] });
    },
    onError: () => {
      toast.error("잠금 처리에 실패했습니다");
    },
  });

  const { data: withdrawalPinLocks } = useQuery<{ lockedIds: number[] }>({
    queryKey: ["/api/admin/withdrawal-pin-locks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdrawal-pin-locks");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 10000,
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
    return (
      <>
        <AdminLogin />
        <AlertDialog open={sessionExpiredDialogOpen} onOpenChange={() => {}}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                세션 만료
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                로그인 세션이 만료되었습니다. 다시 로그인해 주세요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setSessionExpiredDialogOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
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
      timeZone: 'Asia/Seoul',
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
        onClick={() => { setActiveTab('bets'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
          activeTab === 'bets'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Activity className="w-4 h-4" />
        거래 관리
        {safeBets.filter(b => b.outcome === 'pending').length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
            {safeBets.filter(b => b.outcome === 'pending').length}
          </span>
        )}
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
        onClick={() => { setActiveTab('order-history'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'order-history'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        data-testid="tab-order-history"
      >
        <List className="w-4 h-4" />
        주문내역
      </button>
      <button
        onClick={() => { setActiveTab('round-forced'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'round-forced'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        data-testid="tab-round-forced"
      >
        <Calendar className="w-4 h-4" />
        회차별 설정
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
        onClick={() => { setActiveTab('branches'); setMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          activeTab === 'branches'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Building2 className="w-4 h-4" />
        지점코드 관리
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
      <div className="border-t border-gray-800 my-2" />
      <button
        onClick={() => { setLocation('/admin/manual'); setMobileMenuOpen(false); }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-amber-500 hover:bg-amber-500/10"
      >
        <BookOpen className="w-4 h-4" />
        매뉴얼
      </button>
    </>
  );

  return (
    <AdminErrorBoundary>
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LearnInvestLogo variant="icon" size={28} className="rounded-lg" />
          <span className="font-bold text-sm text-amber-400">GEMINI</span>
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
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
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
            <LearnInvestLogo variant="icon" size={32} className="rounded-lg" />
            <div>
              <span className="font-bold text-lg text-amber-400">GEMINI</span>
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
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
              activeTab === 'bets'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Activity className="w-4 h-4" />
            거래 관리
            {safeBets.filter(b => b.outcome === 'pending').length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {safeBets.filter(b => b.outcome === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('order-history')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'order-history'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            data-testid="tab-order-history-desktop"
          >
            <List className="w-4 h-4" />
            주문내역
          </button>
          <button
            onClick={() => setActiveTab('round-forced')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'round-forced'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            data-testid="tab-round-forced-desktop"
          >
            <Calendar className="w-4 h-4" />
            회차별 설정
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
            onClick={() => setActiveTab('branches')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'branches'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Building2 className="w-4 h-4" />
            지점코드 관리
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
          <div className="border-t border-gray-800 my-2" />
          <button
            onClick={() => setLocation('/admin/manual')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-amber-500 hover:bg-amber-500/10"
          >
            <BookOpen className="w-4 h-4" />
            매뉴얼
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
            onClick={() => handleLogout()}
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
                <p className="text-xs lg:text-sm text-muted-foreground">총 입출금 건</p>
                <p className="text-lg lg:text-2xl font-bold mt-1">
                  {transactionRequests.length}건
                </p>
              </div>
            </div>

            {/* Daily Stats - 날짜별 수익 (한국시간 기준) */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-2 lg:p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 lg:gap-2">
                  <Calendar className="w-4 lg:w-5 h-4 lg:h-5 text-primary" />
                  <h2 className="text-sm lg:text-base font-semibold">날짜별 입출금</h2>
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
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">입금액</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">출금액</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">합계</th>
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
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap text-up">
                          {formatMoney(dailyTransactionMap[day.date]?.deposit || 0)}
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap text-down">
                          {formatMoney(dailyTransactionMap[day.date]?.withdrawal || 0)}
                        </td>
                        <td className={cn("px-2 lg:px-4 py-2 lg:py-3 text-right font-bold whitespace-nowrap",
                          ((dailyTransactionMap[day.date]?.deposit || 0) - (dailyTransactionMap[day.date]?.withdrawal || 0)) >= 0 ? "text-up" : "text-down"
                        )}>
                          {formatMoney((dailyTransactionMap[day.date]?.deposit || 0) - (dailyTransactionMap[day.date]?.withdrawal || 0))}
                        </td>
                      </tr>
                    ))}
                    {dailyStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 lg:px-4 py-6 lg:py-8 text-center text-muted-foreground">
                          아직 정산된 거래 기록이 없습니다
                        </td>
                      </tr>
                    )}
                    {dailyStats.length > 0 && (
                      <tr className="bg-muted/30 font-bold">
                        <td className="px-2 lg:px-4 py-2 lg:py-3">합계</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right">{dailyStats.reduce((sum, d) => sum + d.betCount, 0)}</td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap text-up">
                          {formatMoney(Object.values(dailyTransactionMap).reduce((s, v) => s + v.deposit, 0))}
                        </td>
                        <td className="px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap text-down">
                          {formatMoney(Object.values(dailyTransactionMap).reduce((s, v) => s + v.withdrawal, 0))}
                        </td>
                        <td className={cn("px-2 lg:px-4 py-2 lg:py-3 text-right whitespace-nowrap",
                          (Object.values(dailyTransactionMap).reduce((s, v) => s + v.deposit - v.withdrawal, 0)) >= 0 ? "text-up" : "text-down"
                        )}>
                          {formatMoney(Object.values(dailyTransactionMap).reduce((s, v) => s + v.deposit - v.withdrawal, 0))}
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
                      <th className="px-2 lg:px-4 py-2 lg:py-3 font-medium text-right">보유금액</th>
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
                        <th className="px-2 lg:px-4 py-3 text-left font-medium">생년월일</th>
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
                        <tr key={user.id} className={cn("hover:bg-muted/30", user.approvalStatus === 'hold' ? "bg-orange-500/10" : "bg-yellow-500/5")}>
                          <td className="px-2 lg:px-4 py-3">
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 px-2 bg-up hover:bg-up/90 text-xs" onClick={() => approveUser.mutate(user.id)} disabled={approveUser.isPending}>
                                승인
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs" onClick={() => rejectUser.mutate(user.id)} disabled={rejectUser.isPending}>
                                거절
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 text-xs" onClick={() => holdUser.mutate(user.id)} disabled={holdUser.isPending}>
                                보류
                              </Button>
                            </div>
                          </td>
                          <td className="px-2 lg:px-4 py-3 font-medium">
                            {user.username}
                            {user.approvalStatus === 'hold' && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-500 rounded">보류중</span>
                            )}
                          </td>
                          <td className="px-2 lg:px-4 py-3">{user.name || '-'}</td>
                          <td className="px-2 lg:px-4 py-3">{user.phone || '-'}</td>
                          <td className="px-2 lg:px-4 py-3 font-mono text-xs">{user.birthDate || user.residentNumber || '-'}</td>
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
                <Button variant="outline" size="sm" disabled={isManualRefreshing} onClick={async () => {
                  setIsManualRefreshing(true);
                  await refetchUsers();
                  setTimeout(() => {
                    setIsManualRefreshing(false);
                    toast.success("회원 목록이 새로고침되었습니다");
                  }, 600);
                }} className="h-8 px-2 lg:px-3">
                  <RefreshCw className={cn("w-4 h-4 lg:mr-2", isManualRefreshing && "animate-spin")} />
                  <span className="hidden lg:inline">새로고침</span>
                </Button>
                <Button size="sm" onClick={() => setCreateUserOpen(true)} className="h-8 px-2 lg:px-3">
                  <UserPlus className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">회원 생성</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="아이디, 이름, 예금주, 계좌번호, 휴대폰으로 검색..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {userSearchQuery && (
                  <button
                    onClick={() => setUserSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {userSearchQuery && (
                <span className="text-sm text-muted-foreground">
                  {users.filter(user => {
                    const query = userSearchQuery.toLowerCase();
                    return (
                      user.username.toLowerCase().includes(query) ||
                      (user.name && user.name.toLowerCase().includes(query)) ||
                      (user.accountHolder && user.accountHolder.toLowerCase().includes(query)) ||
                      (user.accountNumber && user.accountNumber.toLowerCase().includes(query)) ||
                      (user.phone && user.phone.toLowerCase().includes(query))
                    );
                  }).length}건 검색됨
                </span>
              )}
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
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">강제설정</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">총판</th>
                      {[
                        { field: 'balance', label: '보유머니' },
                        { field: 'totalBet', label: '총거래' },
                        { field: 'totalDeposit', label: '총입금' },
                        { field: 'totalWithdrawal', label: '총출금' },
                        { field: 'profitRate', label: '수익률' },
                      ].map(col => (
                        <th key={col.field} className="px-2 lg:px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (userSortField === col.field) {
                                if (userSortDirection === 'desc') {
                                  setUserSortDirection('asc');
                                } else {
                                  setUserSortField(null);
                                }
                              } else {
                                setUserSortField(col.field);
                                setUserSortDirection('desc');
                              }
                            }}
                            className={cn(
                              "flex items-center gap-1 hover:text-foreground transition-colors",
                              userSortField === col.field ? "text-primary font-semibold" : ""
                            )}
                            data-testid={`sort-${col.field}`}
                          >
                            {col.label}
                            {userSortField === col.field ? (
                              userSortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        </th>
                      ))}
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">최근로그인</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">가입일</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-center">출금잠금</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => {
                        if (!userSearchQuery) return true;
                        const query = userSearchQuery.toLowerCase();
                        return (
                          user.username.toLowerCase().includes(query) ||
                          (user.name && user.name.toLowerCase().includes(query)) ||
                          (user.accountHolder && user.accountHolder.toLowerCase().includes(query)) ||
                          (user.accountNumber && user.accountNumber.toLowerCase().includes(query)) ||
                          (user.phone && user.phone.toLowerCase().includes(query))
                        );
                      })
                      .sort((a, b) => {
                        if (!userSortField) return 0;
                        const aVal = parseFloat((a as any)[userSortField] || '0');
                        const bVal = parseFloat((b as any)[userSortField] || '0');
                        return userSortDirection === 'desc' ? bVal - aVal : aVal - bVal;
                      })
                      .map((user) => (
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
                          <div className="flex flex-col gap-0.5">
                            {user.forcedBetDirection ? (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-bold",
                                user.forcedBetDirection === 'up' 
                                  ? "bg-up/30 text-up" 
                                  : "bg-down/30 text-down"
                              )}>
                                {user.forcedBetDirection === 'up' ? '매수' : '매도'}
                              </span>
                            ) : null}
                            {user.alwaysPendingEnabled && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                                미실현
                              </span>
                            )}
                            {!user.forcedBetDirection && !user.alwaysPendingEnabled && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
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
                        <td className="px-2 lg:px-3 py-1.5 lg:py-2 text-center">
                          {withdrawalPinLocks?.lockedIds.includes(Number(user.id)) ? (
                            <button
                              onClick={() => resetWithdrawalPinLockMutation.mutate(user.id)}
                              disabled={resetWithdrawalPinLockMutation.isPending}
                              className="inline-flex items-center gap-1 px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                              title="출금 잠금 해제"
                            >
                              🔒 해제
                            </button>
                          ) : (
                            <button
                              onClick={() => lockWithdrawalPinMutation.mutate(user.id)}
                              disabled={lockWithdrawalPinMutation.isPending}
                              className="inline-flex items-center gap-1 px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-medium bg-muted text-muted-foreground hover:bg-orange-500/20 hover:text-orange-500 transition-colors"
                              title="출금 잠금"
                            >
                              🔓 제한
                            </button>
                          )}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl lg:text-2xl font-bold">거래 관리</h1>
              <Button variant="outline" size="sm" onClick={() => refetchBets()}>
                <RefreshCw className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">새로고침</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(['pending', 'all', 'win', 'lose'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={betFilter === f ? 'default' : 'outline'}
                  onClick={() => setBetFilter(f)}
                >
                  {f === 'pending' ? `진행중 (${safeBets.filter(b => b.outcome === 'pending').length})` :
                   f === 'all' ? '전체' :
                   f === 'win' ? '승리' : '패배'}
                </Button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">ID</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">사용자</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">종목</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">방향</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">금액</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">결과</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">예약결과</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">남은시간</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                          거래 내역이 없습니다
                        </td>
                      </tr>
                    ) : filteredBets.map((bet) => {
                      const expiresAt = new Date(bet.expiresAt).getTime();
                      const remaining = Math.max(0, Math.ceil((expiresAt - currentTime) / 1000));
                      return (
                        <tr key={bet.id} className="border-t border-border/50 hover:bg-muted/10">
                          <td className="px-2 lg:px-3 py-1.5 text-muted-foreground">#{bet.id}</td>
                          <td className="px-2 lg:px-3 py-1.5 font-medium">{bet.username}</td>
                          <td className="px-2 lg:px-3 py-1.5">{bet.symbol}</td>
                          <td className="px-2 lg:px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                bet.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                              )}>
                                {bet.direction === 'long' ? '매수' : '매도'}
                              </span>
                              {bet.outcome === 'pending' && (
                                <button
                                  onClick={() => changeBetDirection.mutate({ betId: bet.id, direction: bet.direction === 'long' ? 'short' : 'long' })}
                                  className="text-muted-foreground hover:text-foreground p-0.5"
                                  title="방향 전환"
                                >
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-2 lg:px-3 py-1.5">
                            {editingBetId === bet.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editingBetAmount}
                                  onChange={e => setEditingBetAmount(e.target.value)}
                                  className="h-6 w-24 text-xs px-1"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') updateBetAmount.mutate({ betId: bet.id, amount: editingBetAmount });
                                    if (e.key === 'Escape') { setEditingBetId(null); setEditingBetAmount(""); }
                                  }}
                                />
                                <button onClick={() => updateBetAmount.mutate({ betId: bet.id, amount: editingBetAmount })} className="text-up hover:text-up/80"><Check className="w-3 h-3" /></button>
                                <button onClick={() => { setEditingBetId(null); setEditingBetAmount(""); }} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span>{parseInt(bet.amount).toLocaleString()}원</span>
                                {bet.outcome === 'pending' && (
                                  <button onClick={() => { setEditingBetId(bet.id); setEditingBetAmount(bet.amount); }} className="text-muted-foreground hover:text-foreground p-0.5">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                              bet.outcome === 'pending' ? "bg-muted text-muted-foreground" :
                              bet.outcome === 'win' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                            )}>
                              {bet.outcome === 'pending' ? '진행중' : bet.outcome === 'win' ? '승리' : '패배'}
                            </span>
                          </td>
                          <td className="px-2 lg:px-3 py-1.5">
                            {bet.outcome === 'pending' ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => forceBetOutcome.mutate({ betId: bet.id, forcedOutcome: 'win' })}
                                  className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors",
                                    bet.forcedOutcome === 'win' ? "bg-up text-white border-up" : "border-up/50 text-up hover:bg-up/10")}
                                >승</button>
                                <button
                                  onClick={() => forceBetOutcome.mutate({ betId: bet.id, forcedOutcome: 'lose' })}
                                  className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors",
                                    bet.forcedOutcome === 'lose' ? "bg-down text-white border-down" : "border-down/50 text-down hover:bg-down/10")}
                                >패</button>
                                {bet.forcedOutcome && (
                                  <button
                                    onClick={() => forceBetOutcome.mutate({ betId: bet.id, forcedOutcome: null })}
                                    className="text-muted-foreground hover:text-foreground p-0.5"
                                    title="예약 취소"
                                  ><X className="w-3 h-3" /></button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5">
                            {bet.outcome === 'pending' ? (
                              <span className={cn("font-mono text-xs", remaining <= 10 ? "text-down font-bold" : "text-muted-foreground")}>
                                {remaining}초
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              {bet.outcome !== 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateBetOutcome.mutate({ betId: bet.id, outcome: 'win' })}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-up/50 text-up hover:bg-up/10"
                                  >승</button>
                                  <button
                                    onClick={() => updateBetOutcome.mutate({ betId: bet.id, outcome: 'lose' })}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-down/50 text-down hover:bg-down/10"
                                  >패</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
              <div className="p-4 border-b border-border flex items-center gap-3">
                <p className="text-sm text-muted-foreground shrink-0">회원을 선택하여 쪽지를 보내세요</p>
                <Input
                  placeholder="아이디 또는 이름 검색..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="max-w-xs h-8 text-sm"
                />
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">아이디</th>
                      <th className="px-3 py-2 text-left font-medium">이름</th>
                      <th className="px-3 py-2 text-left font-medium">보유금액</th>
                      <th className="px-3 py-2 text-left font-medium">상태</th>
                      <th className="px-3 py-2 text-center font-medium">쪽지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.filter(u => u.role !== 'admin' && (
                      !messageSearchQuery ||
                      u.username.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                      (u.name || '').toLowerCase().includes(messageSearchQuery.toLowerCase())
                    )).map((user) => (
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
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMessageDialog(user)}
                              className="gap-1"
                            >
                              <Send className="w-3 h-3" />
                              보내기
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMessageManageUser(user)}
                              className="gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              관리
                            </Button>
                          </div>
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

        {activeTab === 'branches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold" data-testid="text-branches-title">지점코드 관리</h1>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">새 지점코드 추가</h2>
              <div className="flex gap-3 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">지점코드</label>
                  <Input
                    value={newBranch.code}
                    onChange={(e) => setNewBranch(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="예: BR001"
                    data-testid="input-branch-code"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">지점명</label>
                  <Input
                    value={newBranch.name}
                    onChange={(e) => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 서울지점"
                    data-testid="input-branch-name"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!newBranch.code || !newBranch.name) {
                      toast.error("지점코드와 지점명을 모두 입력해주세요");
                      return;
                    }
                    createBranch.mutate(newBranch);
                  }}
                  disabled={createBranch.isPending}
                  data-testid="button-create-branch"
                >
                  {createBranch.isPending ? "생성 중..." : "추가"}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">지점코드</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">지점명</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">상태</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">생성일</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {branchesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        등록된 지점코드가 없습니다
                      </td>
                    </tr>
                  ) : (
                    branchesList.map((branch) => (
                      <tr key={branch.id} className="border-b border-border hover:bg-muted/20" data-testid={`row-branch-${branch.id}`}>
                        <td className="px-4 py-3">
                          {editingBranch?.id === branch.id ? (
                            <Input
                              value={editingBranch.code}
                              onChange={(e) => setEditingBranch(prev => prev ? { ...prev, code: e.target.value } : null)}
                              className="h-8 w-32"
                            />
                          ) : (
                            <span className="font-mono font-semibold text-amber-500">{branch.code}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingBranch?.id === branch.id ? (
                            <Input
                              value={editingBranch.name}
                              onChange={(e) => setEditingBranch(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="h-8 w-40"
                            />
                          ) : (
                            <span>{branch.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingBranch?.id === branch.id ? (
                            <Button
                              size="sm"
                              variant={editingBranch.isActive ? "default" : "outline"}
                              onClick={() => setEditingBranch(prev => prev ? { ...prev, isActive: !prev.isActive } : null)}
                              className="h-7 text-xs"
                            >
                              {editingBranch.isActive ? "활성" : "비활성"}
                            </Button>
                          ) : (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              branch.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            )}>
                              {branch.isActive ? "활성" : "비활성"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                          {new Date(branch.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingBranch?.id === branch.id ? (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => updateBranch.mutate({
                                  id: editingBranch.id,
                                  code: editingBranch.code,
                                  name: editingBranch.name,
                                  isActive: editingBranch.isActive,
                                })}
                                disabled={updateBranch.isPending}
                              >
                                저장
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setEditingBranch(null)}
                              >
                                취소
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setEditingBranch({
                                  id: branch.id,
                                  code: branch.code,
                                  name: branch.name,
                                  isActive: branch.isActive,
                                })}
                              >
                                수정
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => {
                                  if (confirm("이 지점코드를 삭제하시겠습니까?")) {
                                    deleteBranch.mutate(branch.id);
                                  }
                                }}
                                disabled={deleteBranch.isPending}
                              >
                                삭제
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                    </a>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground">카카오톡 링크</label>
                  <div className="flex gap-3">
                    <Input
                      value={kakaoLink}
                      onChange={(e) => setKakaoLink(e.target.value)}
                      placeholder="https://open.kakao.com/..."
                      className="flex-1"
                    />
                    <Button
                      onClick={() => updateSetting.mutate({ key: 'kakao_link', value: kakaoLink })}
                      disabled={updateSetting.isPending}
                    >
                      {updateSetting.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    고객센터에서 카카오톡 문의 클릭 시 이동할 링크입니다.
                  </p>
                </div>

                {kakaoLink && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">현재 카카오톡 링크:</p>
                    <a 
                      href={kakaoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      {kakaoLink}
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

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-1">출금 잠금 안내 설정</h2>
              <p className="text-xs text-muted-foreground mb-4">비밀번호 3회 오류로 출금이 잠겼을 때 사용자에게 표시할 [보호 조치 해제 절차] 내용을 입력하세요.</p>

              <div className="space-y-4">
                <div className="rounded-md bg-muted/50 border border-border p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
{`안녕하세요, GEMINI 보안 운영팀입니다.

현재 회원님의 계정에서 비밀번호 3회 오류가 감지되어, 금융 사고 예방을 위한 실시간 계정 보호 조치(잠금)가 실행되었습니다. 본 조치는 외부 해킹 및 보이스피싱으로부터 자산을 보호하기 위한 필수 절차입니다.

제한된 출금 및 조회 기능을 복구하기 위해 아래의 강화된 본인 확인 절차를 이행해 주시기 바랍니다.

[보호 조치 해제 절차]`}
                  <span className="text-primary font-semibold"> ← 아래 내용이 이어서 표시됩니다</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">[보호 조치 해제 절차] 내용</label>
                  <div className="flex gap-3">
                    <textarea
                      value={withdrawalLockNotice}
                      onChange={(e) => setWithdrawalLockNotice(e.target.value)}
                      placeholder="예) 1:1 문의 채널을 통해 담당자에게 연락해 주세요."
                      className="flex-1 min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button
                      onClick={() => updateSetting.mutate({ key: 'withdrawal_lock_notice', value: withdrawalLockNotice })}
                      disabled={updateSetting.isPending}
                      className="self-start"
                    >
                      {updateSetting.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 텔레그램 봇 알림 설정 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">텔레그램 봇 알림 설정</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    1:1 문의 접수 · 입금신청 · 100만원 이상 베팅 시 텔레그램으로 알림을 받습니다.
                  </p>
                </div>
                {tgBotData?.configured && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    연결됨
                  </span>
                )}
              </div>

              {tgBotData?.configured && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">봇 토큰</span>
                    <span className="font-mono text-xs">{tgBotData.botToken || "설정됨"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">채팅 ID</span>
                    <span className="font-mono text-xs">{tgBotData.chatId}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">봇 토큰 (Bot Token)</label>
                  <div className="relative">
                    <Input
                      type={tgShowToken ? "text" : "password"}
                      value={tgBotToken}
                      onChange={(e) => setTgBotToken(e.target.value)}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxyz"
                      className="pr-10"
                      data-testid="input-tg-bot-token"
                    />
                    <button
                      type="button"
                      onClick={() => setTgShowToken(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {tgShowToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @BotFather에서 발급받은 봇 토큰을 입력하세요.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">채팅 ID (Chat ID)</label>
                  <div className="flex gap-2">
                    <Input
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                      placeholder="-1001234567890 또는 @채널명"
                      data-testid="input-tg-chat-id"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!tgBotToken && !tgBotData?.configured) {
                          toast.error("봇 토큰을 먼저 입력해주세요");
                          return;
                        }
                        setTgDetectedChats([]);
                        detectTgChat.mutate(tgBotToken);
                      }}
                      disabled={detectTgChat.isPending}
                      data-testid="button-detect-chat-id"
                      className="whitespace-nowrap"
                    >
                      {detectTgChat.isPending ? "감지 중..." : "🔍 자동 감지"}
                    </Button>
                  </div>
                  {tgDetectedChats.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">감지된 채팅방 — 클릭하면 자동 입력됩니다:</p>
                      {tgDetectedChats.map((chat) => (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => {
                            setTgChatId(chat.id);
                            setTgDetectedChats([]);
                            toast.success(`"${chat.title}" 채팅방이 선택되었습니다`);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 text-sm transition-colors text-left"
                          data-testid={`button-select-chat-${chat.id}`}
                        >
                          <span className="font-medium truncate">{chat.title}</span>
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground font-mono">{chat.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    봇을 그룹방에 초대하고 메시지를 보낸 뒤 🔍 자동 감지 버튼을 누르면 채팅 ID가 자동으로 입력됩니다.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => saveTgBot.mutate()}
                    disabled={!tgBotToken || !tgChatId || saveTgBot.isPending}
                    data-testid="button-save-tg-bot"
                  >
                    {saveTgBot.isPending ? "저장 중..." : "저장"}
                  </Button>
                  {tgBotData?.configured && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => testTgBot.mutate()}
                        disabled={testTgBot.isPending}
                        data-testid="button-test-tg-bot"
                      >
                        <Send className="w-4 h-4 mr-1.5" />
                        {testTgBot.isPending ? "전송 중..." : "테스트 전송"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (confirm("텔레그램 봇 설정을 초기화하시겠습니까?")) {
                            deleteTgBot.mutate();
                          }
                        }}
                        disabled={deleteTgBot.isPending}
                        data-testid="button-delete-tg-bot"
                      >
                        {deleteTgBot.isPending ? "초기화 중..." : "초기화"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">알림 트리거 목록</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-base">📩</span> 1:1 고객 문의 접수 시
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-base">💰</span> 입금신청 접수 시
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-base">🎯</span> 100만원 이상 베팅 건 발생 시
                  </li>
                </ul>
              </div>
            </div>

            {/* 자주 쓰는 답변 관리 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">자주 쓰는 답변 관리</h2>
              <p className="text-sm text-muted-foreground mb-4">고객센터 답변 시 빠르게 사용할 수 있는 답변 템플릿을 관리합니다.</p>
              
              {/* 새 템플릿 추가 */}
              <div className="space-y-3 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="text-sm font-medium">새 템플릿 추가</h3>
                <Input
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="템플릿 제목 (예: 입금 안내)"
                  className="text-sm"
                />
                <textarea
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  placeholder="템플릿 내용을 입력하세요..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!newTemplateTitle.trim() || !newTemplateContent.trim()) {
                      toast.error("제목과 내용을 모두 입력해주세요");
                      return;
                    }
                    try {
                      const res = await fetch("/api/admin/inquiry-templates", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: newTemplateTitle, content: newTemplateContent }),
                      });
                      if (!res.ok) throw new Error("템플릿 추가 실패");
                      toast.success("템플릿이 추가되었습니다");
                      setNewTemplateTitle("");
                      setNewTemplateContent("");
                      refetchTemplates();
                    } catch (error) {
                      toast.error("템플릿 추가에 실패했습니다");
                    }
                  }}
                >
                  템플릿 추가
                </Button>
              </div>

              {/* 템플릿 목록 */}
              <div className="space-y-3">
                {inquiryTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">등록된 템플릿이 없습니다</p>
                ) : (
                  inquiryTemplates.map((template) => (
                    <div key={template.id} className="p-3 bg-muted/20 rounded-lg border border-border">
                      {editingTemplateId === template.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingTemplateTitle}
                            onChange={(e) => setEditingTemplateTitle(e.target.value)}
                            placeholder="제목"
                            className="text-sm"
                          />
                          <textarea
                            value={editingTemplateContent}
                            onChange={(e) => setEditingTemplateContent(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (!editingTemplateTitle.trim() || !editingTemplateContent.trim()) {
                                  toast.error("제목과 내용을 모두 입력해주세요");
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/admin/inquiry-templates/${template.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ title: editingTemplateTitle, content: editingTemplateContent }),
                                  });
                                  if (!res.ok) throw new Error("수정 실패");
                                  toast.success("템플릿이 수정되었습니다");
                                  setEditingTemplateId(null);
                                  refetchTemplates();
                                } catch (error) {
                                  toast.error("템플릿 수정에 실패했습니다");
                                }
                              }}
                            >
                              저장
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTemplateId(null)}>
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">{template.content}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => {
                                setEditingTemplateId(template.id);
                                setEditingTemplateTitle(template.title);
                                setEditingTemplateContent(template.content);
                              }}
                            >
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-500 hover:text-red-600"
                              onClick={async () => {
                                if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
                                try {
                                  const res = await fetch(`/api/admin/inquiry-templates/${template.id}`, {
                                    method: "DELETE",
                                  });
                                  if (!res.ok) throw new Error("삭제 실패");
                                  toast.success("템플릿이 삭제되었습니다");
                                  refetchTemplates();
                                } catch (error) {
                                  toast.error("템플릿 삭제에 실패했습니다");
                                }
                              }}
                            >
                              삭제
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-muted-foreground">회원 검색 및 선택 *</label>
                  <Input
                    type="text"
                    value={forcedBetUserSearch}
                    onChange={(e) => setForcedBetUserSearch(e.target.value)}
                    placeholder="아이디 또는 이름으로 검색..."
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-muted/20">
                    {users
                      .filter(u => u.role !== 'admin')
                      .filter(u => 
                        forcedBetUserSearch === '' ||
                        u.username.toLowerCase().includes(forcedBetUserSearch.toLowerCase()) ||
                        (u.name && u.name.toLowerCase().includes(forcedBetUserSearch.toLowerCase()))
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className={cn(
                            "px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                            forcedBetUserId === user.id && "bg-primary/20 hover:bg-primary/30"
                          )}
                          onClick={() => setForcedBetUserId(user.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{user.username}</span>
                              <span className="text-muted-foreground text-sm ml-2">({user.name || '이름없음'})</span>
                            </div>
                            <span className="text-sm font-mono">₩{parseFloat(user.balance).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    {users.filter(u => u.role !== 'admin').filter(u => 
                      forcedBetUserSearch === '' ||
                      u.username.toLowerCase().includes(forcedBetUserSearch.toLowerCase()) ||
                      (u.name && u.name.toLowerCase().includes(forcedBetUserSearch.toLowerCase()))
                    ).length === 0 && (
                      <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                  {forcedBetUserId && (
                    <div className="text-sm text-primary mt-1">
                      선택됨: {users.find(u => u.id === forcedBetUserId)?.username}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">종목 *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{s:'BTC',l:'비트코인'},{s:'ETH',l:'이더리움'},{s:'GOLD',l:'금'}].map(({s,l}) => (
                      <Button
                        key={s}
                        type="button"
                        variant={forcedBetSymbol === s ? 'default' : 'outline'}
                        className={cn("flex-1", forcedBetSymbol === s && "bg-amber-600 hover:bg-amber-700")}
                        onClick={() => setForcedBetSymbol(s)}
                      >
                        {l}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">거래 시간 *</label>
                  <div className="flex gap-2">
                    {[120].map(d => (
                      <Button
                        key={d}
                        type="button"
                        variant={forcedBetDuration === d ? 'default' : 'outline'}
                        className={cn("flex-1", forcedBetDuration === d && "bg-amber-600 hover:bg-amber-700")}
                        onClick={() => setForcedBetDuration(d)}
                      >
                        {d / 60}분
                      </Button>
                    ))}
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-muted-foreground">방향 *</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={forcedBetDirection === 'long' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1 h-12",
                        forcedBetDirection === 'long' && "bg-up hover:bg-up/90"
                      )}
                      onClick={() => setForcedBetDirection('long')}
                      data-testid="button-forced-bet-long"
                    >
                      <TrendingUp className="w-5 h-5 mr-2" />
                      매수 (상승)
                    </Button>
                    <Button
                      type="button"
                      variant={forcedBetDirection === 'short' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1 h-12",
                        forcedBetDirection === 'short' && "bg-down hover:bg-down/90"
                      )}
                      onClick={() => setForcedBetDirection('short')}
                      data-testid="button-forced-bet-short"
                    >
                      <TrendingUp className="w-5 h-5 mr-2 rotate-180" />
                      매도 (하락)
                    </Button>
                  </div>
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
                          multiplier: 2.00,
                        }),
                      });

                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || '강제 거래 실패');
                      }

                      toast.success('강제 거래가 성공적으로 등록되었습니다');
                      setForcedBetUserId('');
                      setForcedBetSymbol('BTC');
                      setForcedBetDuration(120);
                      setForcedBetDirection('long');
                      setForcedBetAmount('');
                      setForcedBetUserSearch('');
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
                선택한 회원의 보유금액에서 거래 금액이 차감됩니다. 회원이 충분한 보유금액을 보유하고 있는지 확인하세요.
                강제 거래는 일반 거래와 동일하게 정산됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Order History Tab - 주문내역 */}
        {activeTab === 'order-history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-lg lg:text-2xl font-bold flex items-center gap-2">
                <List className="w-5 h-5 text-primary" />
                주문내역
              </h1>
              <Button variant="ghost" size="sm" onClick={() => refetchOrderHistory()} className="h-8">
                <RefreshCw className="w-4 h-4 mr-1" />새로고침
              </Button>
            </div>

            {/* Search + Page size */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Input
                  placeholder="회원 아이디 또는 이름 검색"
                  value={orderSearchInput}
                  onChange={(e) => setOrderSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setOrderSearch(orderSearchInput);
                      setOrderPage(1);
                    }
                  }}
                  className="h-8 text-sm"
                  data-testid="input-order-search"
                />
                <Button size="sm" className="h-8 px-3" onClick={() => { setOrderSearch(orderSearchInput); setOrderPage(1); }}>
                  검색
                </Button>
                {orderSearch && (
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setOrderSearch(''); setOrderSearchInput(''); setOrderPage(1); }}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>보기:</span>
                <select
                  value={orderPageSize}
                  onChange={(e) => { setOrderPageSize(Number(e.target.value)); setOrderPage(1); }}
                  className="h-8 rounded border border-border bg-background text-sm px-1"
                  data-testid="select-order-page-size"
                >
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>개</span>
              </div>
            </div>

            {/* Summary */}
            {orderHistory && (
              <p className="text-xs text-muted-foreground">
                전체 <span className="text-foreground font-medium">{orderHistory.total.toLocaleString()}</span>건 중{' '}
                {((orderPage - 1) * orderPageSize + 1).toLocaleString()}–{Math.min(orderPage * orderPageSize, orderHistory.total).toLocaleString()}번째
              </p>
            )}

            {/* Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">거래번호</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">아이디 (이름)</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">종목</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap">시간</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">회차</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-center">회원픽</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-center">리모컨</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-center">결과</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">거래금액</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">거래전 보유금</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-right">거래후 보유금</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-center">상태</th>
                      <th className="px-2 lg:px-3 py-2 whitespace-nowrap text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!orderHistory && (
                      <tr><td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">불러오는 중...</td></tr>
                    )}
                    {orderHistory?.bets.length === 0 && (
                      <tr><td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">거래 내역이 없습니다</td></tr>
                    )}
                    {orderHistory?.bets.map((bet) => {
                      const timeStr = new Date(bet.createdAt).toLocaleString('ko-KR', {
                        month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                        timeZone: 'Asia/Seoul',
                      });
                      const isWin = bet.outcome === 'win';
                      const isLose = bet.outcome === 'lose';
                      const isPending = bet.outcome === 'pending';
                      return (
                        <tr key={bet.id} className="border-t border-border/50 hover:bg-muted/10" data-testid={`row-order-${bet.id}`}>
                          <td className="px-2 lg:px-3 py-1.5 font-mono text-muted-foreground">{bet.id}</td>
                          <td className="px-2 lg:px-3 py-1.5">
                            <div className="font-medium">{bet.username}</div>
                            {bet.name && <div className="text-[10px] text-muted-foreground">{bet.name}</div>}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 whitespace-nowrap">{SYMBOL_NAMES[bet.symbol] || bet.symbol}</td>
                          <td className="px-2 lg:px-3 py-1.5 whitespace-nowrap text-muted-foreground">{timeStr}</td>
                          <td className="px-2 lg:px-3 py-1.5 text-right">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-500">
                              {bet.roundNumber}회차
                            </span>
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-center">
                            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                              bet.direction === 'long' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                            )}>
                              {bet.direction === 'long' ? '매수' : '매도'}
                            </span>
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-center">
                            {bet.forcedOutcome ? (
                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                                bet.forcedOutcome === 'win' ? "bg-up/20 text-up" : "bg-down/20 text-down"
                              )}>
                                {bet.forcedOutcome === 'win' ? '적중' : '미적중'}
                              </span>
                            ) : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-500">진행중</span>
                            ) : (() => {
                              const resultDir = isWin
                                ? bet.direction
                                : (bet.direction === 'long' ? 'short' : 'long');
                              return resultDir === 'long'
                                ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-up/20 text-up">매수</span>
                                : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-down/20 text-down">매도</span>;
                            })()}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-right whitespace-nowrap font-medium">
                            {formatMoney(parseFloat(bet.amount))}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-right whitespace-nowrap text-muted-foreground">
                            {bet.balanceBefore ? formatMoney(parseFloat(bet.balanceBefore)) : '-'}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-right whitespace-nowrap text-muted-foreground">
                            {bet.balanceAfter ? formatMoney(parseFloat(bet.balanceAfter)) : '-'}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-500">대기</span>
                            ) : isWin ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-up text-white">실현</span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-down text-white">실격</span>
                            )}
                          </td>
                          <td className="px-2 lg:px-3 py-1.5 text-center">
                            <button
                              onClick={async () => {
                                if (!confirm(`거래번호 ${bet.id}를 삭제하시겠습니까?\n삭제 시 회원 화면에서도 즉시 사라집니다.`)) return;
                                try {
                                  const res = await fetch(`/api/admin/bets/${bet.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                  });
                                  if (!res.ok) throw new Error('삭제 실패');
                                  toast.success(`거래 #${bet.id} 삭제 완료`);
                                  refetchOrderHistory();
                                } catch {
                                  toast.error('거래 삭제에 실패했습니다');
                                }
                              }}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                              data-testid={`button-delete-bet-${bet.id}`}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {orderHistory && orderHistory.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setOrderPage(1)} disabled={orderPage === 1}
                >
                  <ChevronLeft className="w-3 h-3" /><ChevronLeft className="w-3 h-3 -ml-2" />
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(7, orderHistory.totalPages) }, (_, i) => {
                  const half = 3;
                  let start = Math.max(1, orderPage - half);
                  const end = Math.min(orderHistory.totalPages, start + 6);
                  start = Math.max(1, end - 6);
                  return start + i;
                }).filter(p => p <= orderHistory.totalPages).map(p => (
                  <Button
                    key={p} variant={p === orderPage ? "default" : "outline"} size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setOrderPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setOrderPage(p => Math.min(orderHistory.totalPages, p + 1))} disabled={orderPage === orderHistory.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setOrderPage(orderHistory.totalPages)} disabled={orderPage === orderHistory.totalPages}
                >
                  <ChevronRight className="w-3 h-3" /><ChevronRight className="w-3 h-3 -ml-2" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {orderPage} / {orderHistory.totalPages} 페이지
                </span>
              </div>
            )}
          </div>
        )}

        {/* Round Forced Directions Tab - 회차별 강제설정 */}
        {activeTab === 'round-forced' && (
          <RoundForcedTab />
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
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">보내시는 분</th>
                      <th className="px-2 lg:px-4 py-3 text-right font-medium">금액</th>
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-2 lg:px-4 py-3 text-left font-medium">신청일</th>
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {depositRequests.map((request) => (
                      <tr key={request.id} className={cn("hover:bg-muted/30", request.status === 'pending' && "bg-green-500/5")}>
                        <td className="px-2 lg:px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {request.status !== 'approved' && (
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
                            )}
                            {request.status !== 'rejected' && (
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'rejected' }),
                                  });
                                  if (!res.ok) throw new Error('거절 실패');
                                  toast.success('입금 신청이 거절되었습니다');
                                  refetchTransactions(); refetchUsers();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>거절</Button>
                            )}
                            {(request.status as string) !== 'hold' && (
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
                            )}
                          </div>
                        </td>
                        <td className="px-2 lg:px-4 py-3">
                          <div className="font-medium">{request.username}</div>
                          <div className="text-xs text-muted-foreground">{request.name}</div>
                        </td>
                        <td className="px-2 lg:px-4 py-3">
                          <span className="text-sm font-medium text-amber-400">{request.senderName || '-'}</span>
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
                          {new Date(request.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-center">
                          {deleteTransactionConfirm === request.id ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" className="h-7 px-2 bg-red-600 hover:bg-red-700 text-xs text-white" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}`, { method: 'DELETE', credentials: 'include' });
                                  if (!res.ok) throw new Error('삭제 실패');
                                  toast.success('내역이 삭제되었습니다');
                                  setDeleteTransactionConfirm(null);
                                  refetchTransactions();
                                } catch { toast.error('삭제에 실패했습니다'); }
                              }}>확인</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteTransactionConfirm(null)}>취소</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs" onClick={() => setDeleteTransactionConfirm(request.id)}>삭제</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {depositRequests.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">입금 신청 내역이 없습니다</td></tr>
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
                      <th className="px-2 lg:px-4 py-3 text-center font-medium">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id} className={cn("hover:bg-muted/30", request.status === 'pending' && "bg-orange-500/5")}>
                        <td className="px-2 lg:px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {request.status !== 'approved' && (
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
                            )}
                            {request.status !== 'rejected' && (
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}/process`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'rejected' }),
                                  });
                                  if (!res.ok) throw new Error('거절 실패');
                                  toast.success('출금 신청이 거절되었습니다');
                                  refetchTransactions(); refetchUsers();
                                } catch (error) { toast.error('처리에 실패했습니다'); }
                              }}>거절</Button>
                            )}
                            {(request.status as string) !== 'hold' && (
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
                            )}
                          </div>
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
                          {new Date(request.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}
                        </td>
                        <td className="px-2 lg:px-4 py-3 text-center">
                          {deleteTransactionConfirm === request.id ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" className="h-7 px-2 bg-red-600 hover:bg-red-700 text-xs text-white" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/transactions/${request.id}`, { method: 'DELETE', credentials: 'include' });
                                  if (!res.ok) throw new Error('삭제 실패');
                                  toast.success('내역이 삭제되었습니다');
                                  setDeleteTransactionConfirm(null);
                                  refetchTransactions();
                                } catch { toast.error('삭제에 실패했습니다'); }
                              }}>확인</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteTransactionConfirm(null)}>취소</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs" onClick={() => setDeleteTransactionConfirm(request.id)}>삭제</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {withdrawalRequests.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">출금 신청 내역이 없습니다</td></tr>
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

            {/* 검색 입력 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="회원 아이디, 이름, 제목, 내용 검색..."
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  className="h-9 pl-9 text-sm"
                  data-testid="input-inquiry-search"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {inquirySearch && (
                <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => setInquirySearch('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
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
                {(() => {
                  const q = inquirySearch.trim().toLowerCase();
                  const filtered = [...inquiries]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .filter((inq) => {
                      if (!q) return true;
                      return (
                        (inq.username || '').toLowerCase().includes(q) ||
                        (inq.name || '').toLowerCase().includes(q) ||
                        (inq.title || '').toLowerCase().includes(q) ||
                        (inq.content || '').toLowerCase().includes(q)
                      );
                    });
                  if (filtered.length === 0) return (
                    <div className="p-8 text-center text-muted-foreground">
                      {q ? `"${inquirySearch}" 검색 결과가 없습니다` : '등록된 문의가 없습니다'}
                    </div>
                  );
                  return filtered.map((inquiry) => (
                    <div key={inquiry.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold",
                            inquiry.status === 'pending' 
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-green-500/20 text-green-500"
                          )}>
                            {inquiry.status === 'pending' ? '대기' : '답변완료'}
                          </span>
                          {inquiry.status === 'answered' && (
                            inquiry.isReplyRead
                              ? <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">회원읽음</span>
                              : <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400">회원안읽음</span>
                          )}
                          <span className="text-sm text-muted-foreground">{inquiry.name || inquiry.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(inquiry.createdAt).toLocaleString('ko-KR', { 
                              month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={async () => {
                              if (!confirm("이 문의를 삭제하시겠습니까?")) return;
                              try {
                                const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });
                                if (!res.ok) throw new Error();
                                toast.success("문의가 삭제되었습니다");
                                refetchInquiries();
                              } catch {
                                toast.error("삭제에 실패했습니다");
                              }
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">{inquiry.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{inquiry.content}</p>
                      
                      {inquiry.reply && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-primary">답변</span>
                              {inquiry.repliedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(inquiry.repliedAt).toLocaleString('ko-KR', { 
                                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                            {inquiryEditId !== inquiry.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setInquiryEditId(inquiry.id);
                                  setInquiryEditContent(inquiry.reply || "");
                                }}
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                수정
                              </Button>
                            )}
                          </div>
                          {inquiryEditId === inquiry.id ? (
                            <div className="space-y-2 mt-2">
                              <textarea
                                value={inquiryEditContent}
                                onChange={(e) => setInquiryEditContent(e.target.value)}
                                rows={4}
                                className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (!inquiryEditContent.trim()) {
                                      toast.error("답변 내용을 입력해주세요");
                                      return;
                                    }
                                    try {
                                      const res = await fetch(`/api/admin/inquiries/${inquiry.id}/reply`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ reply: inquiryEditContent }),
                                      });
                                      if (!res.ok) throw new Error();
                                      toast.success("답변이 수정되었습니다");
                                      setInquiryEditId(null);
                                      setInquiryEditContent("");
                                      refetchInquiries();
                                    } catch {
                                      toast.error("답변 수정에 실패했습니다");
                                    }
                                  }}
                                >
                                  저장
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setInquiryEditId(null);
                                    setInquiryEditContent("");
                                  }}
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{inquiry.reply}</p>
                          )}
                        </div>
                      )}
                      
                      {inquiry.status === 'pending' && (
                        <div className="space-y-2">
                          {inquiryReplyId === inquiry.id ? (
                            <>
                              {inquiryTemplates.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1.5">자주 쓰는 답변</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {inquiryTemplates.map((template) => (
                                      <Button
                                        key={template.id}
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setInquiryReplyContent(template.content)}
                                      >
                                        {template.title}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
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
                  ));
                })()}
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
                <label className="text-xs text-muted-foreground">시작 보유금액</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">생년월일</label>
                  <Input
                    value={editingUser.birthDate || ''}
                    onChange={(e) => setEditingUser(p => p ? { ...p, birthDate: e.target.value } : null)}
                    placeholder="예: 901231"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">지점코드</label>
                  <div className="p-2 bg-background/50 rounded-md border border-border h-10 flex items-center">
                    <span className="font-mono text-sm text-amber-500">{editingUser.branchCode || '-'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">출금 비밀번호 (6자리)</label>
                  <Input
                    type="text"
                    value={editingUser.withdrawalPassword || ''}
                    onChange={(e) => setEditingUser(p => p ? { ...p, withdrawalPassword: e.target.value.replace(/\D/g, '').slice(0, 6) } : null)}
                    placeholder="6자리 숫자"
                    maxLength={6}
                    className="font-mono"
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">상부회원 이관 (총판)</label>
                <Select
                  value={editingUser.affiliateId || '__none__'}
                  onValueChange={(v) => setEditingUser(p => p ? { ...p, affiliateId: v === '__none__' ? null : v } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="총판 없음" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="__none__">총판 없음 (직영)</SelectItem>
                    {affiliatesList.map(aff => (
                      <SelectItem key={aff.id} value={aff.id}>
                        {aff.displayName} ({aff.username}) — {aff.referralCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetWithdrawalPinLockMutation.mutate(editingUser.id)}
                      disabled={resetWithdrawalPinLockMutation.isPending}
                      className="h-7 text-xs border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                      data-testid="button-reset-withdrawal-pin-lock"
                    >
                      🔓 출금잠금 해제
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
                        onClick={async () => {
                          const amount = parseFloat(balanceAdjustAmount);
                          if (!isNaN(amount) && amount > 0) {
                            try {
                              const res = await fetch(`/api/admin/users/${editingUser.id}/adjust-balance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ amount: amount }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || "보유금액 조정 실패");
                              setEditingUser(p => p ? { ...p, balance: String(data.newBalance) } : null);
                              setBalanceAdjustAmount("");
                              toast.success(`${amount.toLocaleString()}원이 추가되었습니다 (현재: ${data.newBalance.toLocaleString()}원)`);
                              refetchUsers();
                            } catch (error: any) {
                              toast.error(error.message || "보유금액 추가에 실패했습니다");
                            }
                          }
                        }}
                        className="px-3 py-2 bg-up text-white rounded-md hover:bg-up/90 text-sm font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        추가
                      </button>
                      <button
                        onClick={async () => {
                          const amount = parseFloat(balanceAdjustAmount);
                          if (!isNaN(amount) && amount > 0) {
                            try {
                              const res = await fetch(`/api/admin/users/${editingUser.id}/adjust-balance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ amount: -amount }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || "보유금액 조정 실패");
                              setEditingUser(p => p ? { ...p, balance: String(data.newBalance) } : null);
                              setBalanceAdjustAmount("");
                              toast.success(`${amount.toLocaleString()}원이 차감되었습니다 (현재: ${data.newBalance.toLocaleString()}원)`);
                              refetchUsers();
                            } catch (error: any) {
                              toast.error(error.message || "보유금액 차감에 실패했습니다");
                            }
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
                  
                  {/* 예약 추가/차감 섹션 */}
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        예약 금액 (다음 배팅 정산 시 적용)
                      </label>
                      {parseFloat(editingUser.pendingBalanceAdjustment || '0') !== 0 && (
                        <span className={cn(
                          "text-sm font-bold font-mono",
                          parseFloat(editingUser.pendingBalanceAdjustment || '0') > 0 ? "text-up" : "text-down"
                        )}>
                          {parseFloat(editingUser.pendingBalanceAdjustment || '0') > 0 ? '+' : ''}
                          {parseFloat(editingUser.pendingBalanceAdjustment || '0').toLocaleString()}원
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={pendingAdjustAmount}
                        onChange={(e) => setPendingAdjustAmount(e.target.value)}
                        placeholder="예약 금액 입력"
                        className="flex-1"
                      />
                      <button
                        onClick={async () => {
                          const amount = parseFloat(pendingAdjustAmount);
                          if (!isNaN(amount) && amount > 0) {
                            try {
                              console.log(`[Pending] 예약 추가 요청: userId=${editingUser.id}, amount=${amount}`);
                              const res = await fetch(`/api/admin/users/${editingUser.id}/pending-balance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ amount: amount }),
                              });
                              console.log(`[Pending] 응답 상태: ${res.status}`);
                              const data = await res.json();
                              console.log(`[Pending] 응답 데이터:`, data);
                              if (!res.ok) throw new Error(data.error || "예약 금액 설정 실패");
                              setEditingUser(p => p ? { ...p, pendingBalanceAdjustment: String(amount) } : null);
                              setPendingAdjustAmount("");
                              toast.success(`예약 추가 ${amount.toLocaleString()}원이 설정되었습니다`);
                              refetchUsers();
                            } catch (error: any) {
                              console.error(`[Pending] 에러:`, error);
                              toast.error(error.message || "예약 금액 설정에 실패했습니다");
                            }
                          } else {
                            toast.error("올바른 금액을 입력해주세요");
                          }
                        }}
                        className="px-3 py-2 bg-up text-white rounded-md hover:bg-up/90 text-sm font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        예약추가
                      </button>
                      <button
                        onClick={async () => {
                          const amount = parseFloat(pendingAdjustAmount);
                          if (!isNaN(amount) && amount > 0) {
                            try {
                              console.log(`[Pending] 예약 차감 요청: userId=${editingUser.id}, amount=-${amount}`);
                              const res = await fetch(`/api/admin/users/${editingUser.id}/pending-balance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ amount: -amount }),
                              });
                              console.log(`[Pending] 응답 상태: ${res.status}`);
                              const data = await res.json();
                              console.log(`[Pending] 응답 데이터:`, data);
                              if (!res.ok) throw new Error(data.error || "예약 금액 설정 실패");
                              setEditingUser(p => p ? { ...p, pendingBalanceAdjustment: String(-amount) } : null);
                              setPendingAdjustAmount("");
                              toast.success(`예약 차감 ${amount.toLocaleString()}원이 설정되었습니다`);
                              refetchUsers();
                            } catch (error: any) {
                              console.error(`[Pending] 에러:`, error);
                              toast.error(error.message || "예약 금액 설정에 실패했습니다");
                            }
                          } else {
                            toast.error("올바른 금액을 입력해주세요");
                          }
                        }}
                        className="px-3 py-2 bg-down text-white rounded-md hover:bg-down/90 text-sm font-medium flex items-center gap-1"
                      >
                        <Minus className="w-4 h-4" />
                        예약차감
                      </button>
                    </div>
                    {parseFloat(editingUser.pendingBalanceAdjustment || '0') !== 0 && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/users/${editingUser.id}/pending-balance`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ amount: 0 }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "예약 취소 실패");
                            setEditingUser(p => p ? { ...p, pendingBalanceAdjustment: "0" } : null);
                            toast.success("예약 금액이 취소되었습니다");
                            refetchUsers();
                          } catch (error: any) {
                            toast.error(error.message || "예약 취소에 실패했습니다");
                          }
                        }}
                        className="mt-2 w-full px-3 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-sm font-medium"
                      >
                        예약 취소
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      * 예약 금액은 해당 회원의 다음 배팅 정산 시 적중금에 합산되어 적용됩니다.
                    </p>
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

                {/* 미실현 모드 토글 - 전체 너비 */}
                <div className="flex items-center gap-3 p-3 bg-red-950/30 border border-red-500/30 rounded-lg">
                  <EyeOff className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-300">미실현 모드</p>
                    <p className="text-xs text-muted-foreground">베팅 미정산 + 결과 방향 반전 표시</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(editingUser.alwaysPendingEnabled ?? false) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">ON</span>
                    )}
                    <button
                      data-testid="toggle-always-pending"
                      onClick={async () => {
                        try {
                          const newVal = !(editingUser.alwaysPendingEnabled ?? false);
                          const res = await fetch(`/api/admin/users/${editingUser.id}/always-pending`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ enabled: newVal }),
                          });
                          if (!res.ok) throw new Error("미실현 모드 변경 실패");
                          setEditingUser(p => p ? { ...p, alwaysPendingEnabled: newVal } : null);
                          toast.success(newVal ? "미실현 모드 ON" : "미실현 모드 OFF");
                          refetchUsers();
                        } catch (error: any) {
                          toast.error(error.message || "미실현 모드 변경 실패");
                        }
                      }}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors shrink-0",
                        (editingUser.alwaysPendingEnabled ?? false) ? "bg-red-500" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow",
                        (editingUser.alwaysPendingEnabled ?? false) && "translate-x-5"
                      )} />
                    </button>
                  </div>
                </div>

                {/* 텔레그램 거래알림 */}
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border">
                  <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-300">텔레그램 거래알림</p>
                    <p className="text-xs text-muted-foreground">금액 무관 모든 거래 알림 발송</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(editingUser.telegramNotifyEnabled ?? false) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">ON</span>
                    )}
                    <button
                      data-testid="toggle-telegram-notify"
                      onClick={() => setEditingUser(p => p ? { ...p, telegramNotifyEnabled: !(p.telegramNotifyEnabled ?? false) } : null)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors shrink-0",
                        (editingUser.telegramNotifyEnabled ?? false) ? "bg-blue-500" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow",
                        (editingUser.telegramNotifyEnabled ?? false) && "translate-x-5"
                      )} />
                    </button>
                  </div>
                </div>

                {editingUser.autoBetEnabled && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <label className="text-xs text-yellow-500 font-medium">자동거래 배수</label>
                    <Select 
                      value={String(editingUser.autoBetMultiplier ?? 10)} 
                      onValueChange={(v) => setEditingUser(p => p ? { ...p, autoBetMultiplier: parseFloat(v) } : null)}
                    >
                      <SelectTrigger className="mt-1 bg-background/50 border-yellow-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {[0.1, 10].map((m) => (
                          <SelectItem key={m} value={String(m)}>x{m} 배</SelectItem>
                        ))}
                        <SelectItem value="0">MAX (전액)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-500">위험 영역</h4>
                    <p className="text-xs text-muted-foreground">이 작업은 되돌릴 수 없습니다</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={async () => {
                        if (!confirm(`${editingUser.username}의 모든 거래내역을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
                        try {
                          const res = await fetch(`/api/admin/users/${editingUser.id}/bets`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error);
                          toast.success(data.message);
                          refetchUsers();
                        } catch (error: any) {
                          toast.error(error.message || "거래내역 삭제에 실패했습니다");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      거래내역 삭제
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={async () => {
                        if (!confirm(`${editingUser.username}의 모든 문의 내역을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
                        try {
                          const res = await fetch(`/api/admin/users/${editingUser.id}/inquiries`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error);
                          toast.success(data.message);
                          refetchUsers();
                        } catch (error: any) {
                          toast.error(error.message || "문의 삭제에 실패했습니다");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      문의 삭제
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`정말로 ${editingUser.username}님을 강제 탈퇴시키시겠습니까?\n\n모든 데이터(거래내역, 문의내역 등)가 삭제되며, 이 작업은 되돌릴 수 없습니다.`)) return;
                        try {
                          const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error);
                          toast.success(data.message || "회원이 탈퇴 처리되었습니다");
                          setEditingUser(null);
                          refetchUsers();
                        } catch (error: any) {
                          toast.error(error.message || "회원 탈퇴에 실패했습니다");
                        }
                      }}
                      data-testid="button-force-withdraw"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      강제 탈퇴
                    </Button>
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
                    birthDate: editingUser.birthDate,
                    residentNumber: editingUser.residentNumber,
                    region: editingUser.region,
                    bankName: editingUser.bankName,
                    accountHolder: editingUser.accountHolder,
                    accountNumber: editingUser.accountNumber,
                    totalDeposit: editingUser.totalDeposit,
                    totalWithdrawal: editingUser.totalWithdrawal,
                    role: editingUser.role,
                    autoBetEnabled: editingUser.autoBetEnabled,
                    autoBetMultiplier: editingUser.autoBetMultiplier,
                    isBettingBlocked: editingUser.isBettingBlocked,
                    alwaysPendingEnabled: editingUser.alwaysPendingEnabled ?? false,
                    telegramNotifyEnabled: editingUser.telegramNotifyEnabled ?? false,
                    withdrawalPassword: editingUser.withdrawalPassword || '',
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

      {/* Message Management Dialog */}
      <Dialog open={!!messageManageUser} onOpenChange={() => setMessageManageUser(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>쪽지 관리 - {messageManageUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              회원에게 보낸 쪽지 목록입니다. 삭제하면 회원에게만 안 보이고 관리자는 계속 볼 수 있습니다.
            </p>
            {userMessagesData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                보낸 쪽지가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {userMessagesData.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "p-4 rounded-lg border",
                      msg.deletedForUser 
                        ? "bg-muted/30 border-muted opacity-60" 
                        : "bg-background border-border"
                    )}
                  >
                    {editingMessage?.id === msg.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingMessage.title}
                          onChange={(e) => setEditingMessage(m => m ? { ...m, title: e.target.value } : null)}
                          placeholder="제목"
                          className="text-sm"
                        />
                        <textarea
                          value={editingMessage.content}
                          onChange={(e) => setEditingMessage(m => m ? { ...m, content: e.target.value } : null)}
                          placeholder="내용"
                          className="w-full min-h-[100px] px-3 py-2 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>취소</Button>
                          <Button
                            size="sm"
                            onClick={() => updateMessage.mutate({ id: editingMessage.id, title: editingMessage.title, content: editingMessage.content })}
                            disabled={updateMessage.isPending || !editingMessage.title.trim() || !editingMessage.content.trim()}
                          >
                            {updateMessage.isPending ? '저장 중...' : '저장'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{msg.title}</h4>
                            {msg.deletedForUser && (
                              <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded">회원삭제됨</span>
                            )}
                            {msg.isRead && !msg.deletedForUser && (
                              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">읽음</span>
                            )}
                            {!msg.isRead && !msg.deletedForUser && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">안읽음</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(msg.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        {!msg.deletedForUser && (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                              onClick={() => setEditingMessage({ id: msg.id, title: msg.title, content: msg.content })}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                              onClick={() => deleteMessageForUser.mutate(msg.id)}
                              disabled={deleteMessageForUser.isPending}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              삭제
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setMessageManageUser(null)}>닫기</Button>
          </div>
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

      {/* Session Expired Dialog */}
      <AlertDialog open={sessionExpiredDialogOpen} onOpenChange={() => {}}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              세션 만료
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              로그인 세션이 만료되었습니다. 다시 로그인해 주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setSessionExpiredDialogOpen(false);
                queryClient.setQueryData(["/api/admin/auth/me"], null);
                queryClient.removeQueries({ predicate: (query) => {
                  const key = query.queryKey[0] as string;
                  return typeof key === 'string' && key.startsWith('/api/admin/') && key !== '/api/admin/auth/me';
                }});
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              다시 로그인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminErrorBoundary>
  );
}
