import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  username: string;
  name?: string | null;
  balance: string;
  role: 'user' | 'admin';
  bankName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
}

export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
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
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      toast.success(`${data.username}님, 로그인되었습니다!`);
      // Stay on current page - don't redirect
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      username: string; 
      password: string;
      name: string;
      phone: string;
      birthDate?: string;
      branchCode?: string;
      withdrawalPassword: string;
      bankName: string;
      accountHolder: string;
      accountNumber: string;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "회원가입에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Check if pending approval (new registration flow)
      if (data.pendingApproval) {
        toast.success("회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.", { duration: 5000 });
      } else {
        queryClient.setQueryData(["/api/auth/me"], data);
        toast.success(`${data.username}님, 회원가입이 완료되었습니다!`);
      }
      // Stay on current page - don't redirect
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("로그아웃에 실패했습니다");
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast.success("로그아웃되었습니다");
      setLocation("/");
    },
  });
}
