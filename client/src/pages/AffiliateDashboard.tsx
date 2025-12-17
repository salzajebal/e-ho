import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Users,
  TrendingUp,
  Wallet,
  Clock,
  Copy,
  LogOut,
  RefreshCw,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react';

interface AffiliateAuth {
  id: string;
  username: string;
  displayName: string;
  referralCode: string;
  commissionRate: string;
}

interface AffiliateSummary {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  todayVolume: number;
  monthVolume: number;
  totalVolume: number;
  totalCommission: number;
  pendingCommission: number;
  commissionRate: number;
}

interface AffiliateUser {
  id: string;
  username: string;
  name: string | null;
  createdAt: string;
  totalBets: number;
  totalVolume: number;
}

interface AffiliateCommission {
  id: number;
  affiliateId: string;
  userId: string;
  betId: number;
  betAmount: string;
  commissionAmount: string;
  status: 'pending' | 'settled';
  createdAt: string;
  settledAt: string | null;
}

function AffiliateLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('아이디와 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '로그인에 실패했습니다');
      }

      toast.success('로그인 성공');
      onLogin();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <img
              src="/logo.png"
              alt="Invest Korea Logo"
              className="w-16 h-16 mx-auto rounded-lg mb-4 object-cover"
            />
            <CardTitle className="text-2xl">총판 로그인</CardTitle>
            <p className="text-muted-foreground text-sm">
              INVEST KOREA 총판 관리 시스템
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">아이디</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="총판 아이디"
                data-testid="input-affiliate-username"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                data-testid="input-affiliate-password"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full"
              data-testid="button-affiliate-login"
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type TabType = 'dashboard' | 'users' | 'revenue' | 'settlement';
type DateFilter = 'daily' | 'weekly' | 'monthly' | 'all';
type StatusFilter = 'all' | 'pending' | 'settled';

export default function AffiliateDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: auth, isLoading: authLoading, refetch: refetchAuth } = useQuery<AffiliateAuth | null>({
    queryKey: ['/api/affiliate/me'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/me');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: summary, refetch: refetchSummary } = useQuery<AffiliateSummary>({
    queryKey: ['/api/affiliate/summary'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
    enabled: !!auth,
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery<AffiliateUser[]>({
    queryKey: ['/api/affiliate/users'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!auth,
  });

  const { data: commissions = [], refetch: refetchCommissions } = useQuery<AffiliateCommission[]>({
    queryKey: ['/api/affiliate/commissions'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/commissions');
      if (!res.ok) throw new Error('Failed to fetch commissions');
      return res.json();
    },
    enabled: !!auth,
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch('/api/affiliate/logout', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/me'] });
      toast.success('로그아웃 되었습니다');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('클립보드에 복사되었습니다');
  };

  const formatMoney = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.floor(num).toLocaleString() + '원';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDateRange = (filter: DateFilter) => {
    const now = new Date();
    switch (filter) {
      case 'daily':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return today;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      default:
        return null;
    }
  };

  const revenueFilteredCommissions = useMemo(() => {
    let filtered = [...commissions];

    const dateRange = getDateRange(dateFilter);
    if (dateRange) {
      filtered = filtered.filter(c => new Date(c.createdAt) >= dateRange);
    }

    return filtered;
  }, [commissions, dateFilter]);

  const settlementFilteredCommissions = useMemo(() => {
    if (statusFilter === 'all') {
      return commissions;
    }
    return commissions.filter(c => c.status === statusFilter);
  }, [commissions, statusFilter]);

  const revenueByDate = useMemo(() => {
    const grouped: Record<string, { date: string; amount: number; count: number }> = {};
    
    revenueFilteredCommissions.forEach(c => {
      const date = formatDate(c.createdAt);
      if (!grouped[date]) {
        grouped[date] = { date, amount: 0, count: 0 };
      }
      grouped[date].amount += parseFloat(c.commissionAmount);
      grouped[date].count += 1;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [revenueFilteredCommissions]);

  const totalFiltered = useMemo(() => {
    return revenueFilteredCommissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
  }, [revenueFilteredCommissions]);

  const pendingTotal = useMemo(() => {
    return commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
  }, [commissions]);

  const settledTotal = useMemo(() => {
    return commissions
      .filter(c => c.status === 'settled')
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
  }, [commissions]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!auth) {
    return <AffiliateLogin onLogin={() => refetchAuth()} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-56 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Invest Korea Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <p className="font-bold text-sm">INVEST KOREA</p>
              <p className="text-xs text-muted-foreground">총판 대시보드</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              activeTab === 'dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              activeTab === 'users'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            추천 회원
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              activeTab === 'revenue'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <DollarSign className="w-4 h-4" />
            수익 내역
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              activeTab === 'settlement'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <CheckCircle className="w-4 h-4" />
            정산 내역
          </button>
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">로그인</p>
            <p className="font-medium text-sm">{auth.displayName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => logout.mutate()}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">대시보드</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground">가입코드:</span>
                  <code className="font-mono font-bold text-primary">{auth.referralCode}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(auth.referralCode)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">총 추천 회원</p>
                      <p className="text-2xl font-bold">{summary?.totalUsers || 0}명</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="text-muted-foreground">오늘 +{summary?.newUsersToday || 0}</span>
                    <span className="text-muted-foreground">이번달 +{summary?.newUsersThisMonth || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">총 거래량</p>
                      <p className="text-2xl font-bold">{formatMoney(summary?.totalVolume || 0)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="text-muted-foreground">오늘 {formatMoney(summary?.todayVolume || 0)}</span>
                    <span className="text-muted-foreground">이번달 {formatMoney(summary?.monthVolume || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">총 수수료</p>
                      <p className="text-2xl font-bold">{formatMoney(summary?.totalCommission || 0)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    수수료율: {summary?.commissionRate || 0}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">정산 예정액</p>
                      <p className="text-2xl font-bold text-primary">{formatMoney(summary?.pendingCommission || 0)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    미정산 금액
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">최근 가입 회원</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">아이디</th>
                        <th className="px-4 py-3 font-medium">이름</th>
                        <th className="px-4 py-3 font-medium">가입일</th>
                        <th className="px-4 py-3 font-medium text-center">베팅수</th>
                        <th className="px-4 py-3 font-medium text-right">거래량</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{user.username}</td>
                          <td className="px-4 py-3">{user.name || '-'}</td>
                          <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3 text-center">{user.totalBets}회</td>
                          <td className="px-4 py-3 text-right">{formatMoney(user.totalVolume)}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            아직 가입한 회원이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">추천 회원</h1>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                <span className="text-sm">총 {users.length}명</span>
              </div>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">아이디</th>
                        <th className="px-4 py-3 font-medium">이름</th>
                        <th className="px-4 py-3 font-medium">가입일</th>
                        <th className="px-4 py-3 font-medium text-center">베팅수</th>
                        <th className="px-4 py-3 font-medium text-right">거래량</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{user.username}</td>
                          <td className="px-4 py-3">{user.name || '-'}</td>
                          <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3 text-center">{user.totalBets}회</td>
                          <td className="px-4 py-3 text-right">{formatMoney(user.totalVolume)}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            아직 가입한 회원이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">수익 내역</h1>
              <div className="flex items-center gap-2">
                <div className="flex bg-muted/50 rounded-lg p-1">
                  {(['daily', 'weekly', 'monthly', 'all'] as DateFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md transition-colors',
                        dateFilter === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {filter === 'daily' ? '일별' : filter === 'weekly' ? '주별' : filter === 'monthly' ? '월별' : '전체'}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchCommissions()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">조회 기간 수익</p>
                      <p className="text-2xl font-bold text-primary">{formatMoney(totalFiltered)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    총 {revenueFilteredCommissions.length}건
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">미정산</p>
                      <p className="text-2xl font-bold text-yellow-500">{formatMoney(pendingTotal)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">정산 완료</p>
                      <p className="text-2xl font-bold text-green-500">{formatMoney(settledTotal)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  일별 수익 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">날짜</th>
                        <th className="px-4 py-3 font-medium text-center">건수</th>
                        <th className="px-4 py-3 font-medium text-right">수익금</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {revenueByDate.map((item) => (
                        <tr key={item.date} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{item.date}</td>
                          <td className="px-4 py-3 text-center">{item.count}건</td>
                          <td className="px-4 py-3 text-right text-primary font-medium">{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                      {revenueByDate.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            해당 기간에 수익 내역이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">상세 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">일시</th>
                        <th className="px-4 py-3 font-medium text-right">베팅금액</th>
                        <th className="px-4 py-3 font-medium text-right">수수료</th>
                        <th className="px-4 py-3 font-medium text-center">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {revenueFilteredCommissions.slice(0, 20).map((commission) => (
                        <tr key={commission.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">{formatDateTime(commission.createdAt)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(commission.betAmount)}</td>
                          <td className="px-4 py-3 text-right text-primary font-medium">{formatMoney(commission.commissionAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            {commission.status === 'settled' ? (
                              <span className="inline-flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded">
                                <CheckCircle className="w-3 h-3" />
                                지급완료
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-500 text-xs bg-yellow-500/10 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                미지급
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {revenueFilteredCommissions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                            해당 기간에 수익 내역이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">정산 내역</h1>
              <div className="flex items-center gap-2">
                <div className="flex bg-muted/50 rounded-lg p-1">
                  {(['all', 'pending', 'settled'] as StatusFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md transition-colors',
                        statusFilter === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {filter === 'all' ? '전체' : filter === 'pending' ? '미지급' : '지급완료'}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchCommissions()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">미지급 금액</p>
                      <p className="text-2xl font-bold text-yellow-500">{formatMoney(pendingTotal)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {commissions.filter(c => c.status === 'pending').length}건 대기 중
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">지급 완료 금액</p>
                      <p className="text-2xl font-bold text-green-500">{formatMoney(settledTotal)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {commissions.filter(c => c.status === 'settled').length}건 완료
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">정산 상세 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">발생일</th>
                        <th className="px-4 py-3 font-medium text-right">베팅금액</th>
                        <th className="px-4 py-3 font-medium text-right">수수료</th>
                        <th className="px-4 py-3 font-medium text-center">상태</th>
                        <th className="px-4 py-3 font-medium">정산일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {settlementFilteredCommissions.map((commission) => (
                        <tr key={commission.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">{formatDateTime(commission.createdAt)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(commission.betAmount)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatMoney(commission.commissionAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            {commission.status === 'settled' ? (
                              <span className="inline-flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded">
                                <CheckCircle className="w-3 h-3" />
                                지급완료
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-500 text-xs bg-yellow-500/10 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                미지급
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {commission.settledAt ? formatDateTime(commission.settledAt) : '-'}
                          </td>
                        </tr>
                      ))}
                      {settlementFilteredCommissions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            정산 내역이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
