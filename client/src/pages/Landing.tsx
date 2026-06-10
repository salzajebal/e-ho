import { useState, useEffect, useRef } from "react";
import { SymbolIcon } from "@/components/SymbolIcon";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Shield, Zap, Headphones, TrendingUp, Lock, Award, X, ChevronDown, ChevronRight, Phone, Mail, MessageCircle, History, Wallet, Menu, Bell, FileText, Check, Calendar as CalendarIcon, RefreshCw, UserCog, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLogin, useRegister, useAuth, useLogout } from "@/hooks/use-auth";
import { useUserWebSocket } from "@/hooks/use-user-websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LearnInvestLogo } from "@/components/LearnInvestLogo";

const CRYPTO_ASSETS = [
  { symbol: "BTC", name: "비트코인" },
  { symbol: "ETH", name: "이더리움" },
  { symbol: "GOLD", name: "금" },
];

const KOREAN_BANKS = [
  "KB국민은행", "신한은행", "우리은행", "하나은행", "NH농협은행",
  "IBK기업은행", "SC제일은행", "한국씨티은행", "KDB산업은행",
  "카카오뱅크", "케이뱅크", "토스뱅크",
  "수협은행", "새마을금고", "신협", "우체국",
  "대구은행", "부산은행", "광주은행", "전북은행", "경남은행", "제주은행",
  "산림조합", "저축은행",
];

const KOREAN_REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도",
  "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

function isWithinOperatingHours(): boolean {
  return true; // 24시간 운영
}

interface LandingMarketData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  priceHistory: number[];
}

function useLandingMarketData() {
  const [markets, setMarkets] = useState<LandingMarketData[]>([
    { symbol: "BTC", name: "비트코인", price: 95000.0, changePercent: 0, priceHistory: [] },
    { symbol: "ETH", name: "이더리움", price: 3500.0, changePercent: 0, priceHistory: [] },
    { symbol: "GOLD", name: "금", price: 3200.0, changePercent: 0, priceHistory: [] },
  ]);
  
  const historyRef = useRef<Record<string, number[]>>({
    BTC: [],
    ETH: [],
    GOLD: [],
  });
  
  const lastApiPrices = useRef<Record<string, { price: number; changePercent: number }>>({});

  useEffect(() => {
    // Fetch real prices from API with timeout
    const fetchRealPrices = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/market/prices', {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.prices && !result.fallback) {
          setMarkets(prev => prev.map(m => {
            const apiPrice = result.prices.find((p: any) => p.symbol === m.symbol);
            if (apiPrice) {
              lastApiPrices.current[m.symbol] = {
                price: apiPrice.price,
                changePercent: apiPrice.changePercent,
              };
              
              if (historyRef.current[m.symbol].length === 0) {
                const history: number[] = [];
                let price = apiPrice.price * 0.998;
                for (let i = 0; i < 20; i++) {
                  price = price + (Math.random() - 0.45) * price * 0.001;
                  history.push(price);
                }
                historyRef.current[m.symbol] = history;
              }
              
              historyRef.current[m.symbol] = [...historyRef.current[m.symbol].slice(-19), apiPrice.price];
              
              return {
                ...m,
                price: apiPrice.price,
                changePercent: apiPrice.changePercent,
                priceHistory: [...historyRef.current[m.symbol]]
              };
            }
            return m;
          }));
        }
      } catch (error) {
        // Silent fail - keep last known prices
      }
    };

    // Initial fetch with multiple retries
    fetchRealPrices();
    setTimeout(fetchRealPrices, 300);
    setTimeout(fetchRealPrices, 800);

    // Fetch from API every 1 second for real-time updates
    const apiInterval = setInterval(fetchRealPrices, 1000);

    return () => {
      clearInterval(apiInterval);
    };
  }, []);

  return markets;
}

function generateSparklinePath(prices: number[]): string {
  if (prices.length < 2) return "M0,25 L120,25";
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  
  const points = prices.map((price, i) => {
    const x = (i / (prices.length - 1)) * 120;
    const y = 45 - ((price - min) / range) * 40;
    return `${x},${y}`;
  });
  
  return `M${points.join(' L')}`;
}

export default function Landing() {
  const [isIpBlocked, setIsIpBlocked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 입금 모달
  const [showDepositPageModal, setShowDepositPageModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSenderName, setDepositSenderName] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  // 출금 모달
  const [showWithdrawalPageModal, setShowWithdrawalPageModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalModalPin, setWithdrawalModalPin] = useState('');
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  
  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [regBirthDate, setRegBirthDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [region, setRegion] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [withdrawalPin, setWithdrawalPin] = useState("");
  const [withdrawalPinConfirm, setWithdrawalPinConfirm] = useState("");
  const [registerErrorMessage, setRegisterErrorMessage] = useState("");
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // My Page state
  const [showMyPageModal, setShowMyPageModal] = useState(false);
  const [myPageNewPassword, setMyPageNewPassword] = useState("");
  const [myPageConfirmPassword, setMyPageConfirmPassword] = useState("");
  const [myPageBankName, setMyPageBankName] = useState("");
  const [myPageAccountNumber, setMyPageAccountNumber] = useState("");
  const [myPageAccountHolder, setMyPageAccountHolder] = useState("");
  const [myPageSaving, setMyPageSaving] = useState(false);

  const [showInquiryFormModal, setShowInquiryFormModal] = useState(false);
  const [showMyInquiriesModal, setShowMyInquiriesModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [showWithdrawalSuccessModal, setShowWithdrawalSuccessModal] = useState(false);
  const [withdrawalSuccessAmount, setWithdrawalSuccessAmount] = useState('');
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{id: number; title: string; content: string; isRead: boolean; createdAt: string} | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<{id: number; title: string; content: string; isPinned: boolean; displayDate: string; createdAt: string} | null>(null);
  const [inquiryTitle, setInquiryTitle] = useState("");
  const [inquiryContent, setInquiryContent] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { data: user } = useAuth();
  const [, setLocation] = useLocation();
  const marketData = useLandingMarketData();

  // 입금신청 "보내시는 분" 자동 세팅
  // IP 차단 여부 확인 (페이지 최초 로드 시)
  useEffect(() => {
    fetch('/api/blocked-ip-check')
      .then(res => res.json())
      .then(data => { if (data.blocked) setIsIpBlocked(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const autoName = user?.name || user?.accountHolder || '';
    if (autoName) {
      setDepositSenderName(autoName);
    }
  }, [user?.name, user?.accountHolder]);

  // URL ?tab= 파라미터로 모달 자동 오픈 (트레이딩 페이지에서 넘어올 때)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (!tab) return;
    // 파라미터 제거
    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    window.history.replaceState({}, '', url.toString());
    const open = () => {
      if (tab === 'history') setShowHistoryModal(true);
      else if (tab === 'deposit') { setDepositAmount(''); setShowDepositPageModal(true); }
      else if (tab === 'withdraw') { if ((user as any)?.isBettingBlocked) { toast.error("거래정지 해제 이후 다시 시도해 주세요."); return; } setWithdrawalAmount(''); setShowWithdrawalPageModal(true); }
      else if (tab === 'notice') setShowAnnouncementsModal(true);
      else if (tab === 'cs') setShowCustomerServiceModal(true);
      else if (tab === 'messages') setShowMessagesModal(true);
    };
    // user 로드 후 열기
    if (user !== undefined) open();
  }, [user]);

  // Fetch user balance and bet history if logged in
  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ["/api/user/balance"],
    queryFn: async () => {
      const res = await fetch("/api/user/balance");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  const { data: betHistory } = useQuery({
    queryKey: ["/api/bets/history"],
    queryFn: async () => {
      const res = await fetch("/api/bets/history");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  // Fetch telegram link
  const { data: telegramData } = useQuery({
    queryKey: ["/api/settings/telegram"],
    queryFn: async () => {
      const res = await fetch("/api/settings/telegram");
      if (!res.ok) return { telegramLink: "" };
      return res.json();
    },
  });

  // Fetch kakao link
  const { data: kakaoData } = useQuery({
    queryKey: ["/api/settings/kakao"],
    queryFn: async () => {
      const res = await fetch("/api/settings/kakao");
      if (!res.ok) return { kakaoLink: "" };
      return res.json();
    },
  });

  // Fetch deposit notice
  const { data: depositNoticeData } = useQuery({
    queryKey: ["/api/settings/deposit-notice"],
    queryFn: async () => {
      const res = await fetch("/api/settings/deposit-notice");
      if (!res.ok) return { depositNotice: "" };
      return res.json();
    },
  });

  // Fetch public announcements
  const { data: announcements = [] } = useQuery<{id: number; title: string; content: string; isPinned: boolean; displayDate: string; createdAt: string}[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await fetch("/api/announcements");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch user messages
  const { data: messages = [], refetch: refetchMessages } = useQuery<{id: number; title: string; content: string; isRead: boolean; createdAt: string}[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const handleOpenMessage = async (msg: {id: number; title: string; content: string; isRead: boolean; createdAt: string}) => {
    setSelectedMessage(msg);
    setShowMessagesModal(true);
    if (!msg.isRead) {
      await fetch(`/api/messages/${msg.id}/read`, { method: 'POST' });
      refetchMessages();
    }
  };

  // Fetch user inquiries
  const { data: myInquiries = [], refetch: refetchInquiries } = useQuery<{id: number; title: string; content: string; reply: string | null; status: string; createdAt: string; repliedAt: string | null}[]>({
    queryKey: ["/api/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/inquiries");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch user transactions (입출금 내역)
  const { data: myTransactions = [], refetch: refetchTransactions } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    staleTime: 0,
  });

  // 실시간 웹소켓: 고객센터 답변 알림 소리 + 쪽지/입출금 처리 알림
  useUserWebSocket(!!user, {
    onNewMessage: () => setShowMessagesModal(true),
    onInquiryReplied: () => setShowMyInquiriesModal(true),
    onTransactionProcessed: () => { refetchBalance(); refetchTransactions(); },
  });

  const handleTradeClick = () => {
    if (user) {
      // Redirect based on role
      if (user.role === 'admin') {
        setLocation("/admin");
      } else {
        setLocation("/trade");
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const openMyPage = () => {
    if (!user) { setShowLoginModal(true); return; }
    setMyPageNewPassword("");
    setMyPageConfirmPassword("");
    setMyPageBankName((user as any).bankName || "");
    setMyPageAccountNumber((user as any).accountNumber || "");
    setMyPageAccountHolder((user as any).accountHolder || "");
    setShowMyPageModal(true);
  };

  const handleMyPageSave = async () => {
    if (myPageNewPassword || myPageConfirmPassword) {
      if (myPageNewPassword.length < 4) {
        toast.error("비밀번호는 4자 이상이어야 합니다");
        return;
      }
      if (myPageNewPassword !== myPageConfirmPassword) {
        toast.error("비밀번호가 일치하지 않습니다");
        return;
      }
    }
    if (!myPageBankName || !myPageAccountNumber || !myPageAccountHolder) {
      toast.error("출금 계좌 정보를 모두 입력해주세요");
      return;
    }
    setMyPageSaving(true);
    try {
      if (myPageNewPassword) {
        const pwRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: myPageNewPassword, confirmPassword: myPageConfirmPassword }),
        });
        if (!pwRes.ok) {
          const err = await pwRes.json();
          toast.error(err.error || "비밀번호 변경 실패");
          setMyPageSaving(false);
          return;
        }
      }
      const bankRes = await fetch("/api/user/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: myPageBankName, accountNumber: myPageAccountNumber, accountHolder: myPageAccountHolder }),
      });
      if (!bankRes.ok) {
        const err = await bankRes.json();
        toast.error(err.error || "계좌 정보 변경 실패");
        setMyPageSaving(false);
        return;
      }
      toast.success("저장되었습니다");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowMyPageModal(false);
    } catch {
      toast.error("저장 중 오류가 발생했습니다");
    } finally {
      setMyPageSaving(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password }, {
      onSuccess: () => {
        setShowLoginModal(false);
        setUsername("");
        setPassword("");
      },
      onError: (error: Error) => {
        setLoginErrorMessage(error.message || "아이디 또는 비밀번호가 일치하지 않습니다");
      }
    });
  };

  const handleCheckUsername = async () => {
    if (regUsername.length < 3) {
      setUsernameCheckMessage("아이디는 3자 이상이어야 합니다");
      setUsernameAvailable(false);
      setUsernameChecked(true);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch("/api/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername }),
      });
      const data = await res.json();
      setUsernameAvailable(data.available);
      setUsernameCheckMessage(data.available ? data.message : data.error);
      setUsernameChecked(true);
    } catch {
      setUsernameCheckMessage("중복확인에 실패했습니다");
      setUsernameAvailable(false);
      setUsernameChecked(true);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrorMessage("");
    
    if (regUsername.length < 3) {
      setRegisterErrorMessage("아이디는 3자 이상이어야 합니다");
      return;
    }
    if (!usernameChecked || !usernameAvailable) {
      setRegisterErrorMessage("아이디 중복확인을 해주세요");
      return;
    }
    if (regPassword.length < 4) {
      setRegisterErrorMessage("비밀번호는 4자 이상이어야 합니다");
      return;
    }
    if (!name) {
      setRegisterErrorMessage("이름을 입력해주세요");
      return;
    }
    if (!phone || phone.length < 10) {
      setRegisterErrorMessage("올바른 휴대폰 번호를 입력해주세요");
      return;
    }
    if (!regBirthDate || regBirthDate.replace(/\D/g, '').length !== 6) {
      setRegisterErrorMessage("생년월일을 6자리로 입력해주세요 (예: 901231)");
      return;
    }
    if (!bankName) {
      setRegisterErrorMessage("은행을 선택해주세요");
      return;
    }
    if (!accountHolder) {
      setRegisterErrorMessage("예금주를 입력해주세요");
      return;
    }
    if (!accountNumber) {
      setRegisterErrorMessage("계좌번호를 입력해주세요");
      return;
    }
    if (!/^\d{6}$/.test(withdrawalPin)) {
      setRegisterErrorMessage("출금 비밀번호는 6자리 숫자여야 합니다");
      return;
    }
    
    register.mutate({ 
      username: regUsername, 
      password: regPassword, 
      name, 
      phone,
      birthDate: regBirthDate,
      branchCode: branchCode || undefined,
      withdrawalPassword: withdrawalPin,
      bankName, 
      accountHolder, 
      accountNumber,
    }, {
      onSuccess: () => {
        setRegisterErrorMessage("");
        setShowRegisterModal(false);
        setRegUsername("");
        setRegPassword("");
        setConfirmPassword("");
        setName("");
        setPhone("");
        setRegBirthDate("");
        setBirthDate(undefined);
        setRegion("");
        setBranchCode("");
        setWithdrawalPin("");
        setWithdrawalPinConfirm("");
        setBankName("");
        setAccountHolder("");
        setAccountNumber("");
        setUsernameChecked(false);
        setUsernameCheckMessage("");
        setUsernameAvailable(false);
      },
      onError: (error: Error) => {
        setRegisterErrorMessage(error.message);
      }
    });
  };

  if (isIpBlocked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">접근이 차단되었습니다</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            해당 IP 주소는 관리자에 의해 차단되었습니다.<br />
            문의사항이 있으시면 고객센터로 연락해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <Link href="/" data-testid="link-logo">
              <LearnInvestLogo variant="full" height={36} />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => { if (user) { setLocation("/trade"); } else { setShowLoginModal(true); } }}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap"
                data-testid="nav-options-trading"
              >옵션거래</button>
              <button 
                onClick={() => { if (user) { setShowHistoryModal(true); } else { setShowLoginModal(true); } }}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap" 
                data-testid="nav-trade-history"
              >거래내역</button>
              {user && (
                <>
                  <button
                    onClick={() => {
                      if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); return; }
                      setDepositAmount(''); setDepositSenderName(user?.name || user?.accountHolder || ''); setShowDepositPageModal(true);
                    }}
                    className="text-green-600 hover:text-green-700 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-green-50 whitespace-nowrap"
                    data-testid="nav-deposit"
                  >입금신청</button>
                  <button
                    onClick={() => {
                      if ((user as any)?.isBettingBlocked) { toast.error("거래정지 해제 이후 다시 시도해 주세요."); return; }
                      if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); return; }
                      setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-red-50 whitespace-nowrap"
                    data-testid="nav-withdraw"
                  >출금신청</button>
                </>
              )}
              <button 
                onClick={() => setShowAnnouncementsModal(true)}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap" 
                data-testid="nav-announcements"
              >공지사항</button>
              <button 
                onClick={() => setShowCustomerServiceModal(true)}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap" 
                data-testid="nav-customer-service"
              >고객센터</button>
              <button 
                onClick={() => { if (user) { setShowMessagesModal(true); } else { setShowLoginModal(true); } }}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap relative" 
                data-testid="nav-messages"
              >
                쪽지함
                {user && messages.filter(m => !m.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {messages.filter(m => !m.isRead).length}
                  </span>
                )}
              </button>
            </nav>
          </div>
          
          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Balance Display */}
                <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <Wallet className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="text-gray-900 font-bold text-sm" data-testid="text-header-balance">
                    {balanceData?.balance ? Math.floor(parseFloat(balanceData.balance)).toLocaleString() : '0'}원
                  </span>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 font-medium px-2 text-gray-700 hover:text-gray-900">
                      {user.username}님 <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-white border-gray-100 shadow-xl">
                    <DropdownMenuItem
                      data-testid="dropdown-deposit"
                      className="text-green-600 cursor-pointer"
                      onClick={() => {
                        if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); return; }
                        setDepositAmount(''); setDepositSenderName(user?.name || user?.accountHolder || ''); setShowDepositPageModal(true);
                      }}
                    >입금신청</DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="dropdown-withdraw"
                      className="text-red-500 cursor-pointer"
                      onClick={() => {
                        if ((user as any)?.isBettingBlocked) { toast.error("거래정지 해제 이후 다시 시도해 주세요."); return; }
                        if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); return; }
                        setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                      }}
                    >출금신청</DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="dropdown-mypage"
                      className="text-gray-700 cursor-pointer"
                      onClick={openMyPage}
                    >마이페이지</DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setLocation("/admin")}
                      >관리자 패널</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="dropdown-logout"
                      className="text-gray-500 cursor-pointer"
                      onClick={() => logout.mutate()}
                    >로그아웃</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {user.role === 'admin' ? (
                  <Button 
                    className="bg-gray-900 hover:bg-black text-white font-bold rounded-full px-4 text-sm" 
                    data-testid="button-header-admin"
                    onClick={() => setLocation("/admin")}
                  >관리자</Button>
                ) : (
                  <Button 
                    className="bg-gray-900 hover:bg-black text-white font-bold rounded-full px-4 text-sm" 
                    data-testid="button-header-trade"
                    onClick={() => setLocation("/trade")}
                  >거래하기</Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium" 
                  data-testid="button-header-login"
                  onClick={() => setShowLoginModal(true)}
                >
                  로그인
                </Button>
                <Button 
                  className="bg-gray-900 hover:bg-black text-white font-bold rounded-full px-5" 
                  data-testid="button-header-register"
                  onClick={() => setShowRegisterModal(true)}
                >
                  시작하기
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white border-gray-100 w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-gray-900 text-left">메뉴</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {user && (
                  <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 mb-4">
                    <Wallet className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500 text-xs">보유자산</span>
                    <span className="text-gray-900 font-bold text-sm">
                      {balanceData?.balance ? Math.floor(parseFloat(balanceData.balance)).toLocaleString() : '0'}원
                    </span>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    if (user) {
                      setLocation("/trade");
                    } else {
                      setShowLoginModal(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  옵션거래
                </button>
                <button 
                  onClick={() => {
                    if (user) {
                      setShowHistoryModal(true);
                    } else {
                      setShowLoginModal(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  거래내역
                </button>
                <button 
                  onClick={() => {
                    if (!user) { setShowLoginModal(true); setMobileMenuOpen(false); return; }
                    if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); setMobileMenuOpen(false); return; }
                    setDepositAmount(''); setDepositSenderName(user?.name || user?.accountHolder || ''); setShowDepositPageModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  입금신청
                </button>
                <button 
                  onClick={() => {
                    if (!user) { setShowLoginModal(true); setMobileMenuOpen(false); return; }
                    if ((user as any)?.isBettingBlocked) { toast.error("거래정지 해제 이후 다시 시도해 주세요."); setMobileMenuOpen(false); return; }
                    if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); setMobileMenuOpen(false); return; }
                    setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  출금신청
                </button>
                <button 
                  onClick={() => {
                    setShowAnnouncementsModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  공지사항
                </button>
                {user && (
                  <button 
                    onClick={() => {
                      openMyPage();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    data-testid="mobile-nav-mypage"
                  >
                    마이페이지
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowCustomerServiceModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  고객센터
                </button>
                <button 
                  onClick={() => {
                    if (user) {
                      setShowMessagesModal(true);
                    } else {
                      setShowLoginModal(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-gray-900 py-3 border-b border-gray-100 w-full touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  쪽지함
                </button>
                
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <p className="text-gray-500 text-sm mb-2">{user.username}님</p>
                      {user.role === 'admin' && (
                        <Button 
                          className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-full" 
                          onClick={() => { setLocation("/admin"); setMobileMenuOpen(false); }}
                        >
                          관리자
                        </Button>
                      )}
                      <Button 
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-full" 
                        onClick={() => { setLocation("/trade"); setMobileMenuOpen(false); }}
                      >
                        거래하기
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" 
                        onClick={() => { logout.mutate(); setMobileMenuOpen(false); }}
                      >
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" 
                        onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }}
                      >
                        로그인
                      </Button>
                      <Button 
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-full" 
                        onClick={() => { setShowRegisterModal(true); setMobileMenuOpen(false); }}
                      >
                        시작하기
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section - Gemini Style */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Atmospheric sky background — layered CSS + SVG clouds */}
        {/* Real photo background */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'url(/hero-bg3.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-4rem)]">
            {/* Left: Text content */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white/80 text-sm font-medium tracking-wide">실시간 모니터링 · AI 분석 기반</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6" data-testid="text-hero-title">
                더 스마트한<br />
                투자 예측.<br />
                실시간으로.
              </h1>
              <p className="text-white/70 text-lg md:text-xl mb-10 leading-relaxed max-w-lg" data-testid="text-hero-description">
                비트코인, 이더리움, 금의 방향을 예측하고<br />
                수익을 실현하세요. 2분 단위 고수익 옵션거래.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-10 py-6 text-lg rounded-full shadow-lg"
                  data-testid="button-trade"
                  onClick={handleTradeClick}
                >
                  거래 시작하기
                </Button>
                {!user && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-full"
                      data-testid="button-register"
                      onClick={() => setShowRegisterModal(true)}
                    >
                      회원가입
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="sm:hidden border-white/40 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-full"
                      data-testid="button-login-hero"
                      onClick={() => setShowLoginModal(true)}
                    >
                      로그인
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile: Compact live price strip */}
              <div className="lg:hidden mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/90 font-semibold text-sm">실시간 시세</span>
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="space-y-2">
                  {marketData.slice(0, 3).map((item) => {
                    const isPositive = item.changePercent >= 0;
                    return (
                      <div key={item.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SymbolIcon symbol={item.symbol} size={24} />
                          <span className="text-white font-medium text-sm">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-bold text-sm">
                            {item.symbol === 'GOLD' ? item.price.toFixed(2) : item.price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                          </span>
                          <span className={`ml-2 text-xs font-semibold ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
                            {isPositive ? '▲' : '▼'}{Math.abs(item.changePercent).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={handleTradeClick}
                    className="py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    매수 ▲
                  </button>
                  <button
                    onClick={handleTradeClick}
                    className="py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    매도 ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Trading Widget Card - Gemini style white card */}
            <div className="hidden lg:flex justify-end">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 font-bold text-lg">예측하기</h3>
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Market items */}
                <div className="space-y-3 mb-5">
                  {marketData.slice(0, 3).map((item) => {
                    const isPositive = item.changePercent >= 0;
                    return (
                      <div key={item.symbol} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <SymbolIcon symbol={item.symbol} size={32} />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">{item.symbol === 'GOLD' ? item.price.toFixed(2) : item.price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</p>
                          <p className={`text-xs font-medium ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
                            {isPositive ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Duration selection */}
                <div className="flex gap-2 mb-4">
                  <button className="flex-1 py-2 px-3 bg-gray-900 text-white text-sm font-semibold rounded-lg">
                    2분
                  </button>
                </div>

                {/* Trade buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={handleTradeClick}
                    className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                  >
                    매수 ▲
                  </button>
                  <button
                    onClick={handleTradeClick}
                    className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
                  >
                    매도 ▼
                  </button>
                </div>

                <button
                  onClick={user ? handleTradeClick : () => setShowLoginModal(true)}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors text-sm"
                >
                  {user ? '거래하기' : '로그인하여 거래'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <ChevronDown className="w-6 h-6 text-white/40" />
        </div>
      </section>

      {/* Gemini-style News Ticker Strip */}
      <div className="relative bg-white border-y border-gray-200 overflow-hidden" style={{ height: '88px' }}>
        {/* Left fade + app promo */}
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-4 pr-8 bg-white border-r border-gray-200" style={{ minWidth: '148px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
              <LearnInvestLogo variant="icon" size={26} dark={true} />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-tight">실시간</p>
              <p className="text-xs font-bold text-gray-900 leading-tight">시장 분석</p>
            </div>
          </div>
        </div>
        {/* Left gradient fade */}
        <div className="absolute left-[148px] top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling news cards */}
        <div className="absolute inset-0 flex items-center overflow-hidden" style={{ paddingLeft: '160px' }}>
          <div className="flex animate-[news-ticker_60s_linear_infinite] whitespace-nowrap gap-0">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex shrink-0 items-stretch">
                {[
                  { category: 'BTC', icon: '₿', time: '방금 전', headline: '비트코인 10만 달러 돌파 재도전, 기관 매수세 집중' },
                  { category: 'ETH', icon: 'Ξ', time: '2분 전', headline: '이더리움 ETF 순유입 급증, 디파이 TVL 사상 최고치 경신' },
                  { category: '금', icon: '🥇', time: '5분 전', headline: '국제 금 가격 3,200달러 돌파, 안전자산 선호 심리 확대' },
                  { category: '글로벌', icon: '🌐', time: '10분 전', headline: '아시아 암호화폐 거래량 급증, 한국·일본 시장 주도' },
                  { category: '옵션거래', icon: '⚡', time: '12분 전', headline: 'BTC 옵션 미결제약정 사상 최대, 변동성 확대 전망' },
                  { category: '원자재', icon: '🛢️', time: '18분 전', headline: '귀금속 전반 강세, 중앙은행 금 매입 가속화' },
                  { category: '이더리움', icon: '🔷', time: '25분 전', headline: 'ETH 2.0 스테이킹 수익률 상승, 장기 보유자 증가 추세' },
                  { category: '시장분석', icon: '📊', time: '31분 전', headline: '암호화폐 시총 3조 달러 돌파, 기관 자금 유입 가속' },
                ].map((item, i) => (
                  <div
                    key={`${rep}-${i}`}
                    className="flex items-center gap-4 px-6 border-r border-gray-100 shrink-0"
                    style={{ minWidth: '280px' }}
                  >
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-900">{item.category}</span>
                        <span className="text-xs text-gray-400">{item.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-snug truncate max-w-[220px]">{item.headline}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '24/7', label: '24시간 거래' },
              { value: '3종목', label: '글로벌 지수' },
              { value: '2분', label: '거래 시간' },
              { value: '즉시', label: '실시간 정산' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">{stat.value}</span>
                <span className="text-gray-500 text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20 px-4 bg-[#f5f4f0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 text-sm font-medium">LIVE</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">실시간 마켓</h2>
            <p className="text-gray-500">비트코인, 이더리움, 금 실시간 시세를 확인하세요</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {marketData.map((item, index) => {
              const isPositive = item.changePercent >= 0;
              const chartPath = generateSparklinePath(item.priceHistory);
              const priceDecimals = 2;
              const formattedPrice = item.price.toFixed(priceDecimals);
              const formattedChange = `${isPositive ? '+' : ''}${item.changePercent.toFixed(2)}%`;
              
              return (
                <div 
                  key={item.symbol}
                  className="w-full sm:w-[280px] bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer group"
                  data-testid={`card-market-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <SymbolIcon symbol={item.symbol} size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-400">{item.symbol}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {formattedChange}
                    </div>
                  </div>
                  
                  {/* Mini Chart */}
                  <div className="h-12 mb-3 overflow-hidden">
                    <svg width="100%" height="48" viewBox="0 0 120 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={isPositive ? "#ef4444" : "#3b82f6"} stopOpacity="0.15" />
                          <stop offset="100%" stopColor={isPositive ? "#ef4444" : "#3b82f6"} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${chartPath} L120,50 L0,50 Z`} fill={`url(#gradient-${index})`} />
                      <path
                        d={chartPath}
                        fill="none"
                        stroke={isPositive ? "#ef4444" : "#3b82f6"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">현재가</p>
                      <p className="text-lg font-bold text-gray-900">{formattedPrice}</p>
                    </div>
                    <Link href="/trade">
                      <Button size="sm" className="bg-gray-900 hover:bg-black text-white text-xs rounded-full px-4 transition-all font-bold" data-testid={`button-trade-${item.symbol}`}>
                        거래하기
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Announcements & Messages Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Announcements */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">공지사항</h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">등록된 공지사항이 없습니다</p>
                ) : (
                  announcements.slice(0, 5).map((ann) => (
                    <button
                      key={ann.id}
                      onClick={() => { setSelectedAnnouncement(ann); setShowAnnouncementsModal(true); }}
                      className="w-full text-left p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
                      data-testid={`landing-announcement-${ann.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {ann.isPinned && <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-medium">고정</span>}
                        <span className="text-gray-900 font-medium text-sm line-clamp-1">{ann.title}</span>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-2">{ann.content}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">쪽지함</h3>
                {user && messages.filter(m => !m.isRead).length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                    {messages.filter(m => !m.isRead).length}
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {!user ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-3">로그인 후 쪽지를 확인하세요</p>
                    <Button 
                      size="sm" 
                      className="bg-gray-900 hover:bg-black text-white rounded-full px-5 font-bold"
                      onClick={() => setShowLoginModal(true)}
                    >
                      로그인
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">받은 쪽지가 없습니다</p>
                ) : (
                  messages.slice(0, 5).map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${msg.isRead ? 'bg-gray-50 border-gray-100 hover:border-gray-300' : 'bg-blue-50 border-blue-200 hover:border-blue-300'}`}
                      data-testid={`message-item-${msg.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        <span className={`font-medium text-sm line-clamp-1 ${msg.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{msg.title}</span>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-2">{msg.content}</p>
                      <p className="text-gray-400 text-[10px] mt-1">{new Date(msg.createdAt).toLocaleDateString('ko-KR')}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-[#f5f4f0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-semibold mb-2 text-sm tracking-wide uppercase text-gray-500">월드 클래스</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900" data-testid="text-features-title">트레이딩 플랫폼</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Award,
                title: "수상 경력이 있는 플랫폼",
                description: "업계에서 가장 우수한 플랫폼, 최첨단 코어로 편리한 트레이딩 환경을 선사합니다."
              },
              {
                icon: Zap,
                title: "사용자 지정 인터페이스",
                description: "필요에 따라 인터페이스를 구성합니다. 레이아웃, 테마를 구성하고 알림을 설정하십시오."
              },
              {
                icon: Shield,
                title: "편리한 출금",
                description: "다양한 결제 시스템을 이용하여 자금을 즉시 인출합니다."
              },
              {
                icon: Headphones,
                title: "연중무휴 지원",
                description: "당사의 전문 지원팀은 항상 귀하의 언어로 지원합니다."
              },
              {
                icon: TrendingUp,
                title: "직관적인 경험",
                description: "첫날부터 새로운 사람들과 전문가들 모두를 위해 능률적인 거래 솔루션을 설계하고 구축했습니다."
              },
              {
                icon: Lock,
                title: "업계 최상위 보안 시스템",
                description: "사용자 정보와 자금의 보안이 우리의 최우선 과제입니다."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 hover:shadow-md transition-all hover:-translate-y-0.5 group"
                data-testid={`card-feature-${index}`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-gray-200 transition-colors border border-gray-200">
                  <feature.icon className="w-6 h-6 text-gray-500 group-hover:text-gray-800 transition-colors" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section - Only show for non-logged-in users */}
      {!user && (
        <section className="py-24 px-4 relative overflow-hidden bg-gray-900">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5" data-testid="text-cta-title">
              GEMINI에 가입하고<br />지금 바로 시작해보세요
            </h2>
            <p className="text-gray-400 text-lg mb-12">
              당신의 첫 투자, 믿을 수 있는 GEMINI에서 시작하세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-full"
                data-testid="button-login-cta"
                onClick={() => setShowLoginModal(true)}
              >
                로그인
              </Button>
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-10 py-6 text-lg rounded-full"
                data-testid="button-register-cta"
                onClick={() => setShowRegisterModal(true)}
              >
                무료 가입
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-950 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="mb-4">
                <LearnInvestLogo variant="full" height={28} dark={true} />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                안전하고 투명한 시스템으로<br />
                빠르고 편리한 옵션 거래를 제공합니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300 text-sm uppercase tracking-wide">거래 종목</h4>
              <ul className="space-y-2.5 text-gray-500 text-sm">
                <li><Link href="/trade" className="hover:text-white transition-colors" data-testid="link-trade-btc">BTC (비트코인)</Link></li>
                <li><Link href="/trade" className="hover:text-white transition-colors" data-testid="link-trade-eth">ETH (이더리움)</Link></li>
                <li><Link href="/trade" className="hover:text-white transition-colors" data-testid="link-trade-gold">GOLD (금)</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300 text-sm uppercase tracking-wide">입출금</h4>
              <ul className="space-y-2.5 text-gray-500 text-sm">
                <li><button onClick={() => { 
                  if (!user) { setShowLoginModal(true); return; }
                  if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); return; }
                  setDepositAmount(''); setDepositSenderName(user?.name || user?.accountHolder || ''); setShowDepositPageModal(true);
                }} className="hover:text-white transition-colors" data-testid="link-deposit">입금신청</button></li>
                <li><button onClick={() => { 
                  if (!user) { setShowLoginModal(true); return; }
                  if ((user as any)?.isBettingBlocked) { toast.error("거래정지 해제 이후 다시 시도해 주세요."); return; }
                  if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 22:00 사이에만 가능합니다"); return; }
                  setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                }} className="hover:text-white transition-colors" data-testid="link-withdraw">출금신청</button></li>
                <li><button onClick={() => { if (user) { setShowHistoryModal(true); } else { setShowLoginModal(true); } }} className="hover:text-white transition-colors" data-testid="link-transaction-history">입출금내역</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300 text-sm uppercase tracking-wide">고객센터</h4>
              <ul className="space-y-2.5 text-gray-500 text-sm">
                <li><button onClick={() => setShowAnnouncementsModal(true)} className="hover:text-white transition-colors" data-testid="link-notice">공지사항</button></li>
                <li><button onClick={() => setShowCustomerServiceModal(true)} className="hover:text-white transition-colors" data-testid="link-inquiry">고객센터</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-400 text-xs uppercase tracking-wider">입·출금 및 상담 가능시간</h4>
                <p className="text-gray-600 text-xs mb-2">(주말/공휴일 제외)</p>
                <ul className="space-y-1 text-gray-500 text-xs">
                  <li className="flex justify-between"><span>고객상담</span><span>평일 09:00 ~ 22:00</span></li>
                  <li className="flex justify-between"><span>입금시간</span><span>평일 09:00 ~ 22:00</span></li>
                  <li className="flex justify-between"><span>출금시간</span><span>평일 09:00 ~ 22:00</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-400 text-xs uppercase tracking-wider">거래 상품</h4>
                <ul className="space-y-1 text-gray-500 text-xs">
                  <li>BTC (비트코인)</li>
                  <li>ETH (이더리움)</li>
                  <li>GOLD (금)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-400 text-xs uppercase tracking-wider">지수 CFD 거래</h4>
                <p className="text-gray-500 text-xs">00:00 ~ 24:00</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-gray-600 text-sm">
            <p>© 2021 GEMINI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">로그인</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
              data-testid="button-close-login-modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <LearnInvestLogo variant="full" height={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">로그인</h2>
              <p className="text-gray-500 text-sm">계정에 접속하여 거래를 시작하세요</p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 font-medium">아이디</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 transition-all"
                  data-testid="input-modal-username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 font-medium">비밀번호</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 transition-all"
                  data-testid="input-modal-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold rounded-xl transition-all bg-gray-900 hover:bg-black text-white"
                disabled={login.isPending}
                data-testid="button-modal-login"
              >
                {login.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              계정이 없으신가요?{" "}
              <button 
                className="text-gray-900 hover:underline font-semibold transition-colors"
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
              >
                회원가입
              </button>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                실시간 거래
              </span>
              <span>|</span>
              <span>24시간 운영</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegisterModal} onOpenChange={(open) => { setShowRegisterModal(open); if (!open) { setRegisterErrorMessage(""); setUsernameChecked(false); setUsernameCheckMessage(""); setUsernameAvailable(false); } }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">회원가입</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button 
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
              data-testid="button-close-register-modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <LearnInvestLogo variant="full" height={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">회원가입</h2>
              <p className="text-gray-500 text-sm">지금 가입하고 거래를 시작하세요</p>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-medium">아이디</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={regUsername}
                    onChange={(e) => { setRegUsername(e.target.value); setUsernameChecked(false); setUsernameCheckMessage(""); setUsernameAvailable(false); }}
                    placeholder="아이디 (3자 이상)"
                    className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm flex-1"
                    data-testid="input-reg-username"
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleCheckUsername}
                    disabled={checkingUsername || regUsername.length < 3}
                    className="h-10 px-3 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 whitespace-nowrap"
                    data-testid="button-check-username"
                  >
                    {checkingUsername ? "확인중..." : "중복확인"}
                  </Button>
                </div>
                {usernameChecked && usernameCheckMessage && (
                  <p className={`text-xs mt-1 ${usernameAvailable ? 'text-green-600' : 'text-red-500'}`} data-testid="text-username-check">
                    {usernameCheckMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 font-medium">이름</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="실명"
                    className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                    data-testid="input-reg-name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 font-medium">비밀번호</label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                      data-testid="input-reg-password"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">대소문자, 숫자, 특수문자 필수 기입 8자리 이상</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 font-medium">휴대폰 번호</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                    data-testid="input-reg-phone"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 font-medium">생년월일</label>
                  <Input
                    type="text"
                    value={regBirthDate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setRegBirthDate(val);
                    }}
                    placeholder="예: 901231"
                    maxLength={6}
                    className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                    data-testid="input-reg-birthdate"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-medium">지점코드 <span className="text-gray-400">(선택)</span></label>
                <Input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="지점코드 (없으면 비워두세요)"
                  className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                  data-testid="input-reg-branch-code"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">출금 계좌 정보</p>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 font-medium">은행 선택</label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger className="h-10 bg-white border-gray-200 text-gray-900 text-sm">
                        <SelectValue placeholder="은행을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 max-h-60 overflow-y-auto">
                        {KOREAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank} className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50">
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600 font-medium">예금주</label>
                      <Input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="예금주명"
                        className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                        data-testid="input-reg-account-holder"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600 font-medium">계좌번호</label>
                      <Input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="- 없이 입력"
                        className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                        data-testid="input-reg-account-number"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">출금 비밀번호 설정</p>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 font-medium">출금 비밀번호 <span className="text-red-500">*</span></label>
                  <Input
                    type="password"
                    value={withdrawalPin}
                    onChange={(e) => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="숫자 6자리"
                    maxLength={6}
                    className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm font-mono tracking-widest"
                    data-testid="input-reg-withdrawal-pin"
                  />
                </div>
                <p className="text-gray-400 text-xs mt-1">출금 신청 시 필요한 6자리 숫자 비밀번호입니다</p>
              </div>

              {registerErrorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2" data-testid="text-register-error">
                  <p className="text-red-600 text-sm text-center font-medium">{registerErrorMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-bold rounded-xl transition-all mt-4 bg-gray-900 hover:bg-black text-white"
                disabled={register.isPending}
                data-testid="button-modal-register"
              >
                {register.isPending ? "가입 중..." : "회원가입"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
              이미 계정이 있으신가요?{" "}
              <button 
                className="text-gray-900 hover:underline font-semibold transition-colors"
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
              >
                로그인
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trade History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">거래내역</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <History className="w-8 h-8 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">거래내역</h2>
              <p className="text-gray-500 text-sm">나의 거래 기록과 보유금액을 확인하세요</p>
            </div>

            {/* Balance Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-gray-600" />
                  <span className="text-gray-600">보유금액</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원
                </span>
              </div>
            </div>

            {/* Bet History */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-500 mb-2">최근 거래 내역</h3>
              {betHistory && betHistory.length > 0 ? (
                betHistory.slice(0, 10).map((bet: any) => (
                  <div 
                    key={bet.id} 
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bet.direction === 'long' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                          {bet.direction === 'long' ? '매수' : '매도'}
                        </span>
                        <span className="text-gray-900 font-medium">{bet.symbol}</span>
                        {bet.roundNumber && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                            {bet.roundNumber}회차
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(bet.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}{' '}
                        {new Date(bet.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-medium">
                        {Number(bet.amount).toLocaleString()}원
                      </div>
                      <div className={`text-xs font-medium ${bet.outcome === 'win' ? 'text-green-600' : bet.outcome === 'lose' ? 'text-red-500' : 'text-gray-500'}`}>
                        {bet.outcome === 'win' ? '실현' : bet.outcome === 'lose' ? '실격' : '진행중'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  거래 내역이 없습니다
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl"
              onClick={() => {
                setShowHistoryModal(false);
                setLocation("/trade");
              }}
            >
              거래하러 가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 입금 신청 모달 ===== */}
      <Dialog open={showDepositPageModal} onOpenChange={(open) => { if (!open) { setShowDepositPageModal(false); setDepositAmount(''); setDepositSenderName(''); } }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">입금 신청</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => { setShowDepositPageModal(false); setDepositAmount(''); setDepositSenderName(''); }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span className="text-sm">뒤로가기</span>
              </button>
              <h2 className="text-lg font-bold text-gray-900">입금 신청</h2>
              <button onClick={() => { setShowDepositPageModal(false); setDepositAmount(''); setDepositSenderName(''); }}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 현재 보유금액 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">현재 보유금액</span>
                <span className="text-xl font-bold text-gray-900">{balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원</span>
              </div>
            </div>

            {/* 입금 진행 절차 STEP 1~4 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">입금 진행 절차</h3>
              <div className="space-y-3">
                {[
                  { step: '01', text: '인터넷뱅킹, 모바일뱅킹, 무통장 입금, ATM 등으로 송금 가능합니다. 입금 계좌는 수시로 변경될 수 있으니 이체 전 반드시 최신 계좌를 확인해 주세요.' },
                  { step: '02', text: '최소 입금 금액은 10,000원입니다. 금액을 잘못 입력하셨을 경우 정정 가능합니다.' },
                  { step: '03', text: "아래 '보내시는 분'란에 실제 송금 통장의 입금주 성함을 정확히 입력해 주세요. 닉네임 또는 다른 이름 입력 시 자동 매칭이 불가합니다." },
                  { step: '04', text: '입금 처리는 영업 시간(평일 오전 09:00 ~ 22:00) 내 순차적으로 진행됩니다. 입금신청 버튼 클릭 후 운영팀 확인을 거쳐 보유금액에 반영됩니다. 처리 완료 시 알림을 통해 안내드립니다.' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-3">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold">{step}</span>
                    <p className="text-gray-600 text-xs leading-relaxed pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 입금 계좌 정보 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 text-sm font-medium">입금 계좌 정보</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/inquiries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: '입금계좌 안내 요청',
                          content: '입금계좌 정보를 안내해 주세요.',
                        }),
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || '문의 생성에 실패했습니다');
                      }
                      refetchInquiries();
                      toast.success('입금계좌 안내 문의가 접수되었습니다.');
                      setShowDepositPageModal(false);
                      setShowMyInquiriesModal(true);
                    } catch (err: any) {
                      toast.error(err.message || '문의 생성에 실패했습니다');
                    }
                  }}
                  className="text-xs text-white bg-gray-900 hover:bg-black px-3 py-1.5 rounded-full transition-colors whitespace-nowrap font-bold"
                  data-testid="button-deposit-inquiry"
                >
                  계좌번호 문의하기
                </button>
              </div>
            </div>

            {/* 보내시는 분 */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">보내시는 분 <span className="text-red-500">*</span></label>
              <Input
                type="text"
                value={depositSenderName}
                onChange={(e) => setDepositSenderName(e.target.value)}
                placeholder="실제 송금 통장의 예금주 성함 입력"
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                data-testid="input-deposit-sender"
              />
            </div>

            {/* 입금 금액 */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">입금 금액 <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="금액을 입력하세요"
                  className="bg-white border-gray-200 text-gray-900 pr-12 placeholder:text-gray-400"
                  data-testid="input-deposit-amount"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              {depositAmount && <p className="text-gray-500 text-xs mt-1">{Number(depositAmount).toLocaleString()}원</p>}
            </div>

            {/* 빠른 금액 */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10000, 50000, 100000, 500000].map((amt) => (
                <button key={amt} onClick={() => setDepositAmount(String(Number(depositAmount || 0) + amt))}
                  className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium border border-gray-200" data-testid={`button-deposit-quick-${amt}`}>
                  +{amt / 10000}만
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button onClick={() => setDepositAmount(String(Number(depositAmount || 0) + 1000000))}
                className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium border border-gray-200" data-testid="button-deposit-quick-100">
                +100만
              </button>
              <button onClick={() => setDepositAmount('')}
                className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium border border-gray-200" data-testid="button-deposit-reset">
                초기화
              </button>
            </div>

            {/* 입금신청 버튼 */}
            <Button
              className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-xl mb-6"
              disabled={depositSubmitting || !depositAmount || Number(depositAmount) <= 0 || !depositSenderName.trim()}
              data-testid="button-deposit-submit"
              onClick={async () => {
                if (!depositSenderName.trim()) { toast.error('보내시는 분 성함을 입력해주세요'); return; }
                if (!depositAmount || Number(depositAmount) <= 0) { toast.error('금액을 입력해주세요'); return; }
                if (Number(depositAmount) < 10000) { toast.error('최소 입금금액은 10,000원입니다'); return; }
                setDepositSubmitting(true);
                try {
                  const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'deposit', amount: depositAmount, senderName: depositSenderName.trim() }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || '요청에 실패했습니다');

                  toast.success('입금 신청이 완료되었습니다.');
                  setDepositAmount('');
                  setDepositSenderName('');
                  setShowDepositPageModal(false);
                  refetchTransactions();
                } catch (err: any) {
                  toast.error(err.message || '요청에 실패했습니다');
                } finally {
                  setDepositSubmitting(false);
                }
              }}
            >
              {depositSubmitting ? '처리중...' : '입금신청'}
            </Button>

            {/* 최근 입금 내역 */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">최근 입금 내역</h3>
              {(() => {
                const depositHistory = (myTransactions || []).filter((t: any) => t.type === 'deposit').slice(0, 5);
                if (depositHistory.length === 0) {
                  return <p className="text-gray-500 text-xs text-center py-4">입금 내역이 없습니다</p>;
                }
                return (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left text-gray-500 px-3 py-2 font-medium">신청금액</th>
                          <th className="text-center text-gray-500 px-3 py-2 font-medium">상태</th>
                          <th className="text-right text-gray-500 px-3 py-2 font-medium">신청일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositHistory.map((t: any) => (
                          <tr key={t.id} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-900 font-medium">{Number(t.amount).toLocaleString()}원</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                t.status === 'approved' ? 'bg-green-100 text-green-700' :
                                t.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {t.status === 'approved' ? '승인' : t.status === 'rejected' ? '거절' : '대기'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-400">
                              {new Date(t.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 출금 신청 모달 ===== */}
      <Dialog open={showWithdrawalPageModal} onOpenChange={(open) => { if (!open) { setShowWithdrawalPageModal(false); setWithdrawalAmount(''); setWithdrawalModalPin(''); } }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">출금 신청</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => { setShowWithdrawalPageModal(false); setWithdrawalAmount(''); }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span className="text-sm">뒤로가기</span>
              </button>
              <h2 className="text-lg font-bold text-gray-900">출금 신청</h2>
              <button onClick={() => { setShowWithdrawalPageModal(false); setWithdrawalAmount(''); }}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 현재 보유금액 */}
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">현재 보유금액</span>
                <span className="text-xl font-bold text-gray-900">{balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원</span>
              </div>
            </div>

            {/* 출금 진행 절차 STEP 1~4 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <h3 className="text-sm font-bold text-blue-700 mb-3">출금 진행 절차</h3>
              <div className="space-y-3">
                {[
                  { step: '01', text: '출금 처리는 영업 시간(평일 오전 09:00 ~ 22:00) 내 순차적으로 진행됩니다. 신청 즉시 보유금액에서 우선 차감됩니다.' },
                  { step: '02', text: '24시간 이상 지연 시, 등록된 출금 계좌 정보(은행명·계좌번호·예금주 성명)가 실제 계좌와 일치하는지 확인해 주세요.' },
                  { step: '03', text: '등록되지 않은 계좌로 출금을 원하실 경우 반드시 고객센터를 통해 사전에 변경 요청을 해주시기 바랍니다.' },
                  { step: '04', text: '출금신청 버튼 클릭 후 운영팀 검수를 거쳐 은행 이체가 진행됩니다. 처리 완료 시 알림을 통해 안내드립니다.' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-3">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 text-xs font-bold">{step}</span>
                    <p className="text-gray-600 text-xs leading-relaxed pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 출금 계좌 정보 (읽기전용) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-700 mb-1">출금 계좌 정보</h3>
              {!user?.bankName && !user?.accountNumber ? (
                <div className="text-center py-2">
                  <p className="text-amber-600 text-xs mb-2">등록된 출금 계좌가 없습니다.</p>
                  <button onClick={() => { setShowWithdrawalPageModal(false); openMyPage(); }}
                    className="text-gray-900 text-xs underline hover:text-gray-700 transition-colors font-medium">
                    마이페이지에서 계좌 등록하기
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">거래은행</span>
                    <span className="text-gray-900 text-xs font-medium">{user?.bankName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">계좌번호</span>
                    <span className="text-gray-900 text-xs font-medium">{user?.accountNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">예금주</span>
                    <span className="text-gray-900 text-xs font-medium">{user?.accountHolder || '-'}</span>
                  </div>
                </>
              )}
            </div>

            {/* 출금 가능액 */}
            <div className="flex justify-between items-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <span className="text-gray-500 text-sm">출금가능액</span>
              <span className="text-gray-900 font-bold">{balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원</span>
            </div>

            {/* 출금 금액 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-2">출금 금액 <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  type="text"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="금액을 입력하세요"
                  className="bg-gray-50 border-gray-200 text-gray-900 pr-12"
                  data-testid="input-withdrawal-amount"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              {withdrawalAmount && <p className="text-gray-500 text-xs mt-1">{Number(withdrawalAmount).toLocaleString()}원</p>}
              {withdrawalAmount && Number(withdrawalAmount) > Number(balanceData?.balance || 0) && (
                <p className="text-red-500 text-xs mt-1">보유금액을 초과할 수 없습니다</p>
              )}
            </div>

            {/* 빠른 금액 */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10000, 50000, 100000, 500000].map((amt) => (
                <button key={amt} onClick={() => setWithdrawalAmount(String(Math.min(Number(withdrawalAmount || 0) + amt, Number(balanceData?.balance || 0))))}
                  className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium" data-testid={`button-withdrawal-quick-${amt}`}>
                  +{amt / 10000}만
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button onClick={() => setWithdrawalAmount(String(balanceData?.balance ? Math.floor(Number(balanceData.balance)) : 0))}
                className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium" data-testid="button-withdrawal-all">
                전액
              </button>
              <button onClick={() => setWithdrawalAmount('')}
                className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium" data-testid="button-withdrawal-reset">
                초기화
              </button>
            </div>

            {/* 출금 비밀번호 입력 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-2">출금 비밀번호 <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Input
                    key={i}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={withdrawalModalPin[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = withdrawalModalPin.split('');
                      arr[i] = val.slice(-1);
                      const next = arr.join('').slice(0, 6);
                      setWithdrawalModalPin(next);
                      if (val && i < 5) {
                        const nextInput = document.querySelector(`[data-pin-idx="${i + 1}"]`) as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !withdrawalModalPin[i] && i > 0) {
                        const prevInput = document.querySelector(`[data-pin-idx="${i - 1}"]`) as HTMLInputElement;
                        prevInput?.focus();
                        const arr = withdrawalModalPin.split('');
                        arr[i - 1] = '';
                        setWithdrawalModalPin(arr.join(''));
                      }
                    }}
                    data-pin-idx={i}
                    className="h-12 text-center text-xl font-mono bg-gray-50 border-gray-200 text-gray-900 w-full"
                    data-testid={`input-withdrawal-pin-${i}`}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-1">가입 시 설정한 6자리 출금 비밀번호를 입력하세요</p>
            </div>

            {/* 출금신청 버튼 */}
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl"
              disabled={
                withdrawalSubmitting ||
                !withdrawalAmount ||
                Number(withdrawalAmount) <= 0 ||
                Number(withdrawalAmount) > Number(balanceData?.balance || 0) ||
                (!user?.bankName && !user?.accountNumber) ||
                withdrawalModalPin.length !== 6
              }
              data-testid="button-withdrawal-submit"
              onClick={async () => {
                if (!user?.bankName && !user?.accountNumber) { toast.error('출금 계좌를 먼저 등록해주세요'); return; }
                if (!withdrawalAmount || Number(withdrawalAmount) <= 0) { toast.error('금액을 입력해주세요'); return; }
                if (Number(withdrawalAmount) < 10000) { toast.error('최소 출금금액은 10,000원입니다'); return; }
                if (Number(withdrawalAmount) > Number(balanceData?.balance || 0)) { toast.error('보유금액을 초과할 수 없습니다'); return; }
                if (withdrawalModalPin.length !== 6) { toast.error('출금 비밀번호 6자리를 입력해주세요'); return; }
                setWithdrawalSubmitting(true);
                try {
                  const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'withdrawal', amount: withdrawalAmount, withdrawalPassword: withdrawalModalPin }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || '요청에 실패했습니다');
                  setWithdrawalSuccessAmount(withdrawalAmount);
                  setShowWithdrawalPageModal(false);
                  setWithdrawalAmount('');
                  refetchBalance();
                  setShowWithdrawalSuccessModal(true);
                } catch (err: any) {
                  toast.error(err.message || '요청에 실패했습니다');
                } finally {
                  setWithdrawalSubmitting(false);
                }
              }}
            >
              {withdrawalSubmitting ? '처리중...' : '출금신청'}
            </Button>

            {/* 최근 출금 내역 */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">최근 출금 내역</h3>
              {(() => {
                const withdrawalHistory = (myTransactions || []).filter((t: any) => t.type === 'withdrawal').slice(0, 5);
                if (withdrawalHistory.length === 0) {
                  return <p className="text-gray-400 text-xs text-center py-4">출금 내역이 없습니다</p>;
                }
                return (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left text-gray-500 px-3 py-2 font-medium">신청금액</th>
                          <th className="text-center text-gray-500 px-3 py-2 font-medium">상태</th>
                          <th className="text-right text-gray-500 px-3 py-2 font-medium">신청일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawalHistory.map((t: any) => (
                          <tr key={t.id} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-900 font-medium">{Number(t.amount).toLocaleString()}원</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                t.status === 'approved' ? 'bg-green-100 text-green-700' :
                                t.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                t.status === 'hold' ? 'bg-orange-100 text-orange-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {t.status === 'approved' ? '승인' : t.status === 'rejected' ? '거절' : t.status === 'hold' ? '보류' : '대기'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-400">
                              {new Date(t.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Service Modal - 고객센터 메뉴 */}
      <Dialog open={showCustomerServiceModal} onOpenChange={setShowCustomerServiceModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">고객센터</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button 
              onClick={() => setShowCustomerServiceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Headphones className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">고객센터</h2>
              <p className="text-gray-500 text-sm">문의를 남기시면 빠르게 답변드립니다</p>
            </div>

            <div className="space-y-3">
              {/* 문의 작성하기 */}
              <button 
                className="w-full block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-400 transition-colors cursor-pointer text-left"
                onClick={() => {
                  if (!user) {
                    toast.error("로그인이 필요합니다");
                    setShowCustomerServiceModal(false);
                    setShowLoginModal(true);
                    return;
                  }
                  const hasPending = myInquiries.some(inq => inq.status === 'pending');
                  if (hasPending) {
                    toast.error("이전 문의에 답변이 완료된 후 새로운 문의를 작성할 수 있습니다.");
                    return;
                  }
                  setShowCustomerServiceModal(false);
                  setShowInquiryFormModal(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">문의 작성하기</h3>
                    <p className="text-amber-600 text-sm">새로운 문의를 작성합니다</p>
                    <p className="text-gray-400 text-xs">빠른 답변 보장</p>
                  </div>
                  <div className="text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* 내 문의 내역 */}
              <button 
                className="w-full block bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors cursor-pointer text-left"
                onClick={() => {
                  if (!user) {
                    toast.error("로그인이 필요합니다");
                    setShowCustomerServiceModal(false);
                    setShowLoginModal(true);
                    return;
                  }
                  setShowCustomerServiceModal(false);
                  setShowMyInquiriesModal(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">내 문의 내역</h3>
                    <p className="text-gray-600 text-sm">작성한 문의와 답변 확인</p>
                    <p className="text-gray-400 text-xs">{myInquiries.length}건의 문의</p>
                  </div>
                  <div className="text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* 입출금 내역 */}
              <button
                className="w-full block bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors cursor-pointer text-left"
                onClick={() => {
                  if (!user) {
                    toast.error("로그인이 필요합니다");
                    setShowCustomerServiceModal(false);
                    setShowLoginModal(true);
                    return;
                  }
                  setShowCustomerServiceModal(false);
                  refetchTransactions().then(() => setShowTransactionsModal(true));
                }}
                data-testid="button-my-transactions"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <History className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">입출금 내역</h3>
                    <p className="text-gray-600 text-sm">입금·출금 신청 및 처리 현황</p>
                    <p className="text-gray-400 text-xs">{myTransactions.length}건의 거래 내역</p>
                  </div>
                  <div className="text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* 고객센터 (텔레그램) */}
              {telegramData?.telegramLink && (
                <a 
                  href={telegramData.telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block bg-sky-50 border border-sky-200 rounded-xl p-4 hover:border-sky-400 transition-colors cursor-pointer text-left"
                  onClick={() => setShowCustomerServiceModal(false)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-medium">텔레그램 고객센터</h3>
                      <p className="text-sky-600 text-sm">텔레그램으로 바로 문의</p>
                      <p className="text-gray-400 text-xs">실시간 상담 가능</p>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </a>
              )}

              {/* 고객센터 (카카오톡) */}
              {kakaoData?.kakaoLink && (
                <a 
                  href={kakaoData.kakaoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:border-yellow-400 transition-colors cursor-pointer text-left"
                  onClick={() => setShowCustomerServiceModal(false)}
                  data-testid="link-kakao"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-medium">카카오톡 고객센터</h3>
                      <p className="text-yellow-600 text-sm">카카오톡으로 바로 문의</p>
                      <p className="text-gray-400 text-xs">실시간 상담 가능</p>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Success Modal */}
      <AlertDialog open={showWithdrawalSuccessModal} onOpenChange={setShowWithdrawalSuccessModal}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              출금 신청 완료
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 space-y-3">
              <p className="text-lg">
                <span className="text-green-600 font-bold">{Number(withdrawalSuccessAmount).toLocaleString()}원</span> 출금 신청이 완료되었습니다.
              </p>
              <p>처리까지 약 30분이 소요됩니다.</p>
              <p className="text-sm text-gray-400">가입 시 등록한 계좌로 입금됩니다.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowWithdrawalSuccessModal(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inquiry Form Modal - 문의 작성 */}
      <Dialog open={showInquiryFormModal} onOpenChange={setShowInquiryFormModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">문의 작성</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button 
              onClick={() => setShowInquiryFormModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FileText className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">문의 작성</h2>
              <p className="text-gray-500 text-sm">문의를 남기시면 빠르게 답변드립니다</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  placeholder="문의 제목을 입력해주세요"
                  value={inquiryTitle}
                  onChange={(e) => setInquiryTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                  data-testid="input-inquiry-title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">내용</label>
                <textarea
                  placeholder="문의 내용을 자세히 작성해주세요"
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 resize-none"
                  data-testid="input-inquiry-content"
                />
              </div>
              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl"
                disabled={inquirySubmitting || !inquiryTitle.trim() || !inquiryContent.trim()}
                onClick={async () => {
                  try {
                    setInquirySubmitting(true);
                    const res = await fetch('/api/inquiries', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: inquiryTitle, content: inquiryContent }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || '문의 등록에 실패했습니다');
                    }
                    toast.success('문의가 등록되었습니다. 빠른 시일 내에 답변드리겠습니다.');
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
                data-testid="button-submit-inquiry"
              >
                {inquirySubmitting ? '등록 중...' : '문의 등록하기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Inquiries Modal - 내 문의 내역 */}
      <Dialog open={showMyInquiriesModal} onOpenChange={setShowMyInquiriesModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">내 문의 내역</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setShowMyInquiriesModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MessageCircle className="w-8 h-8 text-gray-700" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">내 문의 내역</h2>
                <button
                  onClick={() => refetchInquiries()}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="새로고침"
                  data-testid="button-refresh-inquiries"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">총 {myInquiries.length}건의 문의</p>
            </div>

            <div className="space-y-3">
              {myInquiries.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">등록된 문의가 없습니다</p>
              ) : (
                myInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900 font-medium">{inquiry.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inquiry.status === 'answered' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inquiry.status === 'answered' ? '답변완료' : '대기중'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">{inquiry.content}</p>
                    <p className="text-gray-400 text-xs mb-3">
                      {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {inquiry.reply && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-900 text-sm font-semibold">고객센터</span>
                          {inquiry.repliedAt && (
                            <span className="text-gray-400 text-xs">
                              {new Date(inquiry.repliedAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 border border-gray-200 p-3 rounded-xl">{inquiry.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <Button
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl"
              onClick={() => {
                setShowMyInquiriesModal(false);
                setShowInquiryFormModal(true);
              }}
            >
              새 문의 작성하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Modal - 입출금 내역 */}
      <Dialog open={showTransactionsModal} onOpenChange={(open) => { setShowTransactionsModal(open); if (open) refetchTransactions(); }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">입출금 내역</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowTransactionsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <History className="w-8 h-8 text-gray-700" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">입출금 내역</h2>
                <button
                  onClick={() => refetchTransactions()}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">총 {myTransactions.length}건의 거래 내역</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {(['all', 'deposit', 'withdrawal'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTransactionFilter(f)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    transactionFilter === f
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                    <div className="text-center py-12 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">거래 내역이 없습니다</p>
                    </div>
                  );
                }
                const statusMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
                  pending: { label: '대기중', color: 'text-amber-700 bg-amber-100 border-amber-200', icon: <Clock className="w-3 h-3" /> },
                  approved: { label: '승인', color: 'text-green-700 bg-green-100 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
                  rejected: { label: '거절', color: 'text-red-600 bg-red-100 border-red-200', icon: <XCircle className="w-3 h-3" /> },
                  hold: { label: '보류', color: 'text-orange-700 bg-orange-100 border-orange-200', icon: <Clock className="w-3 h-3" /> },
                };
                return filtered.map((tx: any) => {
                  const isDeposit = tx.type === 'deposit';
                  const status = statusMap[tx.status] || statusMap.pending;
                  return (
                    <div key={tx.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4" data-testid={`tx-item-${tx.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isDeposit
                            ? <ArrowDownCircle className="w-5 h-5 text-blue-500" />
                            : <ArrowUpCircle className="w-5 h-5 text-red-500" />
                          }
                          <span className={`font-semibold text-base ${isDeposit ? 'text-blue-600' : 'text-red-600'}`}>
                            {isDeposit ? '입금' : '출금'}
                          </span>
                        </div>
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${status.color}`}>
                          {status.icon}{status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-bold text-lg">
                          {Number(tx.amount).toLocaleString('ko-KR')}원
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(tx.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul',
                            month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {tx.bankName && (
                        <p className="text-gray-500 text-xs mt-1">
                          {tx.bankName} · {tx.accountHolder} · {tx.accountNumber}
                        </p>
                      )}
                      {tx.adminNote && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-amber-600 text-xs font-medium mb-0.5">관리자 메모</p>
                          <p className="text-gray-700 text-xs">{tx.adminNote}</p>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages Modal - 쪽지함 */}
      <Dialog open={showMessagesModal} onOpenChange={setShowMessagesModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">쪽지함</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button 
              onClick={() => { setShowMessagesModal(false); setSelectedMessage(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Mail className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">쪽지함</h2>
              <p className="text-gray-500 text-sm">
                {selectedMessage ? '쪽지 내용' : `총 ${messages.length}건의 쪽지`}
              </p>
            </div>

            {selectedMessage ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  목록으로 돌아가기
                </button>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-gray-900 font-medium text-lg">{selectedMessage.title}</h3>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap break-words mb-3">{selectedMessage.content}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(selectedMessage.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">받은 쪽지가 없습니다</p>
                ) : (
                  messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`w-full text-left border rounded-xl p-4 hover:border-gray-400 transition-colors ${msg.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {!msg.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                          <h3 className={`font-medium ${msg.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{msg.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2">{msg.content}</p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(msg.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements Modal */}
      <Dialog open={showAnnouncementsModal} onOpenChange={(open) => { setShowAnnouncementsModal(open); if (!open) setSelectedAnnouncement(null); }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">공지사항</DialogTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => { setShowAnnouncementsModal(false); setSelectedAnnouncement(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Bell className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">공지사항</h2>
              <p className="text-gray-500 text-sm">
                {selectedAnnouncement ? '공지사항 상세' : '중요한 안내사항을 확인하세요'}
              </p>
            </div>

            {selectedAnnouncement ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  목록으로 돌아가기
                </button>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    {selectedAnnouncement.isPinned && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">고정</span>
                    )}
                    <h3 className="text-gray-900 font-medium text-lg">{selectedAnnouncement.title}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    등록일: {new Date(selectedAnnouncement.displayDate || selectedAnnouncement.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">등록된 공지사항이 없습니다</p>
                ) : (
                  announcements.map((ann) => (
                    <button
                      key={ann.id}
                      onClick={() => setSelectedAnnouncement(ann)}
                      className="w-full text-left bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors"
                      data-testid={`announcement-item-${ann.id}`}
                    >
                      <div className="flex items-start gap-3">
                        {ann.isPinned && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">고정</span>
                        )}
                        <div className="flex-1">
                          <h3 className="text-gray-900 font-medium mb-1">{ann.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2">{ann.content}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(ann.displayDate || ann.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* My Page Modal */}
      <Dialog open={showMyPageModal} onOpenChange={setShowMyPageModal}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-lg w-full max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogTitle className="text-xl font-bold text-gray-900 mb-6">마이페이지</DialogTitle>

            {/* 계정 정보 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">계정 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">아이디</label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                    data-testid="input-mypage-username"
                  />
                  <p className="text-xs text-gray-400 mt-1">로그인에 사용되는 고유 아이디입니다.</p>
                </div>
              </div>
            </div>

            {/* 본인 정보 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">본인 정보</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">이름</label>
                  <input
                    type="text"
                    value={(user as any)?.name || ""}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                    data-testid="input-mypage-name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">생년월일 (YYMMDD)</label>
                  <input
                    type="text"
                    value={(user as any)?.birthDate || ""}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                    data-testid="input-mypage-birthdate"
                  />
                  <p className="text-xs text-gray-400 mt-1">회원 가입 시 등록한 정보 기준으로 표시됩니다.</p>
                </div>
              </div>
            </div>

            {/* 출금 계좌 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">출금 계좌</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">은행명</label>
                  <input
                    type="text"
                    value={(user as any)?.bankName || ""}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                    data-testid="input-mypage-bank"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">계좌번호</label>
                  <input
                    type="text"
                    value={(user as any)?.accountNumber || ""}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                    data-testid="input-mypage-account-number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">예금주</label>
                  <input
                    type="text"
                    value={(user as any)?.accountHolder || ""}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                    data-testid="input-mypage-account-holder"
                  />
                  <p className="text-xs text-gray-400 mt-1">출금 계좌 변경은 고객센터로 문의해 주세요.</p>
                </div>
              </div>
            </div>

            {/* 보유금 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">보유금</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">보유금액</label>
                <input
                  type="text"
                  value={`₩ ${balanceData?.balance ? Math.floor(parseFloat(balanceData.balance)).toLocaleString() : '0'}`}
                  readOnly
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-bold text-sm cursor-not-allowed"
                  data-testid="input-mypage-balance"
                />
              </div>
            </div>

            {/* 확인 버튼 */}
            <Button
              onClick={() => setShowMyPageModal(false)}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold h-11"
              data-testid="button-mypage-confirm"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Error Alert Dialog */}
      <AlertDialog open={!!loginErrorMessage} onOpenChange={() => setLoginErrorMessage("")}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <X className="w-5 h-5" />
              로그인 실패
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {loginErrorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setLoginErrorMessage("")}
              className="bg-gray-900 hover:bg-black text-white"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
