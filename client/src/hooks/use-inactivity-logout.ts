import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10분

export function useInactivityLogout(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
    toast({ title: "자동 로그아웃", description: "10분간 활동이 없어 자동으로 로그아웃되었습니다." });
    setLocation("/");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [queryClient, setLocation]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLogout, INACTIVITY_TIMEOUT_MS);
  }, [doLogout]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, resetTimer]);
}
