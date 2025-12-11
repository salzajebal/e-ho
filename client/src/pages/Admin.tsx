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
  Settings,
  LogOut,
  TrendingUp,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
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

interface AdminUser {
  id: string;
  username: string;
  balance: string;
  role: string;
  isActive: boolean;
  createdAt: string;
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

export default function Admin() {
  const { data: auth, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const updateUser = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; balance?: string; role?: string; isActive?: boolean }) => {
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!auth || auth.role !== 'admin') {
    setLocation("/login");
    return null;
  }

  const handleSaveBalance = (userId: string) => {
    updateUser.mutate({ id: userId, balance: editBalance });
  };

  const handleToggleActive = (user: AdminUser) => {
    updateUser.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleToggleRole = (user: AdminUser) => {
    updateUser.mutate({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">명인FX</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">관리자 패널</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === 'settings'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Settings className="w-4 h-4" />
            설정
          </button>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setLocation("/")}
          >
            <TrendingUp className="w-4 h-4" />
            거래소로 이동
          </Button>
          <Button
            variant="ghost"
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
              <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchUsers(); }}>
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
                <p className="text-xs text-muted-foreground mt-1">
                  승률: {stats?.totalBets ? ((stats.wonBets / (stats.wonBets + stats.lostBets)) * 100 || 0).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">총 수익</p>
                <p className={cn("text-2xl font-bold mt-1", (stats?.profit || 0) >= 0 ? "text-up" : "text-down")}>
                  {((stats?.profit || 0) >= 0 ? '+' : '')}{Math.floor(stats?.profit || 0).toLocaleString()}원
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  베팅: {Math.floor(stats?.totalBetAmount || 0).toLocaleString()}원
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="font-semibold mb-4">최근 회원</h2>
              <div className="space-y-2">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        user.isActive ? "bg-up" : "bg-down"
                      )} />
                      <span className="font-medium">{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">관리자</span>
                      )}
                    </div>
                    <span className="font-mono text-sm">{Math.floor(parseFloat(user.balance)).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">회원 관리</h1>
              <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">아이디</th>
                    <th className="px-4 py-3">잔고</th>
                    <th className="px-4 py-3">권한</th>
                    <th className="px-4 py-3">가입일</th>
                    <th className="px-4 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-border/50 hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={cn(
                            "w-3 h-3 rounded-full",
                            user.isActive ? "bg-up" : "bg-down"
                          )}
                          title={user.isActive ? "활성 (클릭하여 비활성화)" : "비활성 (클릭하여 활성화)"}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editBalance}
                              onChange={(e) => setEditBalance(e.target.value)}
                              className="w-32 h-8"
                            />
                            <button
                              onClick={() => handleSaveBalance(user.id)}
                              className="text-up hover:bg-up/10 p-1 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="text-down hover:bg-down/10 p-1 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{Math.floor(parseFloat(user.balance)).toLocaleString()}원</span>
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditBalance(user.balance);
                              }}
                              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleRole(user)}
                          className={cn(
                            "text-xs px-2 py-1 rounded",
                            user.role === 'admin'
                              ? "bg-primary/20 text-primary"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {user.role === 'admin' ? '관리자' : '일반회원'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-down hover:bg-down/10 p-1.5 rounded"
                          disabled={user.id === auth.id}
                          title={user.id === auth.id ? "자기 자신은 삭제할 수 없습니다" : "삭제"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">설정</h1>
            
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-semibold">사이트 설정</h2>
              <p className="text-sm text-muted-foreground">
                추가 설정 기능은 추후 업데이트될 예정입니다.
              </p>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <div>
                    <p className="font-medium">기본 배당률</p>
                    <p className="text-sm text-muted-foreground">베팅 승리 시 배당률</p>
                  </div>
                  <span className="font-mono text-lg">1.90x</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <div>
                    <p className="font-medium">신규 회원 기본 잔고</p>
                    <p className="text-sm text-muted-foreground">회원가입 시 지급되는 잔고</p>
                  </div>
                  <span className="font-mono text-lg">10,000,000원</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">최소 베팅 금액</p>
                    <p className="text-sm text-muted-foreground">베팅 가능한 최소 금액</p>
                  </div>
                  <span className="font-mono text-lg">1,000원</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
