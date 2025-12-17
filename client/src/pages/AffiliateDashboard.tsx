import { useState } from 'react';
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

export default function AffiliateDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');

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

  const formatMoney = (amount: number) => {
    return Math.floor(amount).toLocaleString() + '원';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

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
      </div>
    </div>
  );
}
