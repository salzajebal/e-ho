import { useState } from "react";
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
  isActive: boolean;
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
  const queryClient = useQueryClient();

  const adminLogin = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "로그인에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.role !== 'admin') {
        toast.error("관리자 권한이 없습니다");
        fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        return;
      }
      queryClient.setQueryData(["/api/auth/me"], data);
      toast.success("관리자 로그인 성공");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminLogin.mutate({ username, password });
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">관리자 아이디</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 입력"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="h-11"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2"
              disabled={adminLogin.isPending}
            >
              {adminLogin.isPending ? "로그인 중..." : "관리자 로그인"}
            </Button>
          </form>
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bets'>('users');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

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

  const { data: stats, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border flex flex-col shrink-0">
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
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">대시보드</h1>
              <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchUsers(); refetchBets(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">총 회원수</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}명</p>
                <p className="text-xs text-muted-foreground mt-1">활성: {stats?.activeUsers || 0}명</p>
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
                      <th className="px-3 py-2 whitespace-nowrap">보유머니</th>
                      <th className="px-3 py-2 whitespace-nowrap">총베팅</th>
                      <th className="px-3 py-2 whitespace-nowrap">총입금</th>
                      <th className="px-3 py-2 whitespace-nowrap">총출금</th>
                      <th className="px-3 py-2 whitespace-nowrap">수익률</th>
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">베팅 관리</h1>
              <Button variant="outline" size="sm" onClick={() => refetchBets()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-3 py-2 whitespace-nowrap">종목</th>
                      <th className="px-3 py-2 whitespace-nowrap">회원아이디</th>
                      <th className="px-3 py-2 whitespace-nowrap">방향</th>
                      <th className="px-3 py-2 whitespace-nowrap">배팅금액</th>
                      <th className="px-3 py-2 whitespace-nowrap">배당</th>
                      <th className="px-3 py-2 whitespace-nowrap">배팅시간</th>
                      <th className="px-3 py-2 whitespace-nowrap">결과</th>
                      <th className="px-3 py-2 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map((bet) => (
                      <tr key={bet.id} className="border-t border-border/50 hover:bg-muted/10">
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
                        <td className="px-3 py-2 font-mono">{formatMoney(bet.amount)}</td>
                        <td className="px-3 py-2 font-mono">x{bet.multiplier}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(bet.createdAt)}
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
                            <button
                              onClick={() => updateBetOutcome.mutate({ betId: bet.id, outcome: 'win' })}
                              disabled={updateBetOutcome.isPending}
                              className={cn(
                                "p-1.5 rounded transition-colors",
                                bet.outcome === 'win' 
                                  ? "bg-up text-white" 
                                  : "hover:bg-up/20 text-up"
                              )}
                              title="적중 처리"
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
                              title="미적중 처리"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bets.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                          베팅 기록이 없습니다
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
    </div>
  );
}
