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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  { symbol: "SP500", name: "S&P500" },
  { symbol: "DOW", name: "다우존스" },
  { symbol: "DXY", name: "달러" },
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
    { symbol: "SP500", name: "S&P500", price: 5320.0, changePercent: 0, priceHistory: [] },
    { symbol: "DOW", name: "다우존스", price: 39500.0, changePercent: 0, priceHistory: [] },
    { symbol: "DXY", name: "달러", price: 104.5, changePercent: 0, priceHistory: [] },
  ]);
  
  const historyRef = useRef<Record<string, number[]>>({
    SP500: [],
    DOW: [],
    DXY: [],
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<{id: number; title: string; content: string; isPinned: boolean; createdAt: string} | null>(null);
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
  const { data: announcements = [] } = useQuery<{id: number; title: string; content: string; isPinned: boolean; createdAt: string}[]>({
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
    if (regPassword !== confirmPassword) {
      setRegisterErrorMessage("비밀번호가 일치하지 않습니다");
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
    
    register.mutate({ 
      username: regUsername, 
      password: regPassword, 
      name, 
      phone,
      birthDate: regBirthDate,
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
      <div className="min-h-screen bg-[#100805] flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">접근이 차단되었습니다</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            해당 IP 주소는 관리자에 의해 차단되었습니다.<br />
            문의사항이 있으시면 고객센터로 연락해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100805] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#100805]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <Link href="/" data-testid="link-logo">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold tracking-wide text-primary">
                    MIB
                  </span>
                </div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap" data-testid="nav-options-trading">
                  옵션거래 <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1C1008] border-white/10">
                  {CRYPTO_ASSETS.map((stock) => (
                    <DropdownMenuItem 
                      key={stock.symbol}
                      className="text-gray-300 hover:text-amber-500 hover:bg-white/5 cursor-pointer"
                      onClick={() => {
                        if (user) {
                          setLocation("/trade");
                        } else {
                          setShowLoginModal(true);
                        }
                      }}
                    >
                      <span className="font-medium text-amber-500 mr-2">{stock.symbol}</span>
                      {stock.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button 
                onClick={() => {
                  if (user) {
                    setShowHistoryModal(true);
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap" 
                data-testid="nav-trade-history"
              >
                거래내역
              </button>
              <button 
                onClick={() => {
                  if (!user) { setShowLoginModal(true); return; }
                  if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); return; }
                  setDepositAmount(''); setDepositSenderName(''); setShowDepositPageModal(true);
                }}
                className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap" 
                data-testid="nav-deposit"
              >
                입금신청
              </button>
              <button 
                onClick={() => {
                  if (!user) { setShowLoginModal(true); return; }
                  if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); return; }
                  setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                }}
                className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap" 
                data-testid="nav-withdrawal"
              >
                출금신청
              </button>
              <button 
                onClick={() => setShowAnnouncementsModal(true)}
                className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap" 
                data-testid="nav-announcements"
              >
                공지사항
              </button>
              {user && (
                <button 
                  onClick={openMyPage}
                  className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap" 
                  data-testid="nav-mypage"
                >
                  마이페이지
                </button>
              )}
              <button 
                onClick={() => setShowCustomerServiceModal(true)}
                className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap" 
                data-testid="nav-customer-service"
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
                }}
                className="text-gray-300 hover:text-amber-500 transition-colors text-xs font-medium whitespace-nowrap relative" 
                data-testid="nav-messages"
              >
                쪽지함
                {user && messages.filter(m => !m.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
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
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-400 text-xs">보유금액</span>
                  <span className="text-white font-bold text-sm" data-testid="text-header-balance">
                    {balanceData?.balance ? Math.floor(parseFloat(balanceData.balance)).toLocaleString() : '0'}원
                  </span>
                </div>
                
                {/* Deposit/Withdraw Buttons */}
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs px-2"
                    data-testid="button-header-deposit"
                    onClick={() => { 
                      if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); return; }
                      setDepositAmount(''); setDepositSenderName(''); setShowDepositPageModal(true);
                    }}
                  >
                    입금
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2"
                    data-testid="button-header-withdraw"
                    onClick={() => { 
                      if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); return; }
                      setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                    }}
                  >
                    출금
                  </Button>
                </div>

                <span className="text-gray-300 text-sm hidden lg:block">
                  {user.username}님
                </span>
                {user.role === 'admin' ? (
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
                    data-testid="button-header-admin"
                    onClick={() => setLocation("/admin")}
                  >
                    관리자
                  </Button>
                ) : (
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
                    data-testid="button-header-trade"
                    onClick={() => setLocation("/trade")}
                  >
                    거래하기
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  className="text-gray-300 hover:text-white hover:bg-white/10" 
                  data-testid="button-header-logout"
                  onClick={() => logout.mutate()}
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-gray-300 hover:text-white hover:bg-white/10" 
                  data-testid="button-header-login"
                  onClick={() => setShowLoginModal(true)}
                >
                  로그인
                </Button>
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
                  data-testid="button-header-register"
                  onClick={() => setShowRegisterModal(true)}
                >
                  회원가입
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 text-gray-300 hover:text-white">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#100805] border-white/10 w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-white text-left">메뉴</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {user && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4">
                    <Wallet className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-400 text-xs">보유금액</span>
                    <span className="text-white font-bold text-sm">
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
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
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
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  거래내역
                </button>
                <button 
                  onClick={() => {
                    if (!user) { setShowLoginModal(true); setMobileMenuOpen(false); return; }
                    if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); setMobileMenuOpen(false); return; }
                    setDepositAmount(''); setDepositSenderName(''); setShowDepositPageModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  입금신청
                </button>
                <button 
                  onClick={() => {
                    if (!user) { setShowLoginModal(true); setMobileMenuOpen(false); return; }
                    if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); setMobileMenuOpen(false); return; }
                    setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  출금신청
                </button>
                <button 
                  onClick={() => {
                    setShowAnnouncementsModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
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
                    className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
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
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
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
                  className="text-left text-gray-300 hover:text-amber-500 py-3 border-b border-white/10 w-full touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  쪽지함
                </button>
                
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <p className="text-gray-400 text-sm mb-2">{user.username}님</p>
                      {user.role === 'admin' && (
                        <Button 
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
                          onClick={() => { setLocation("/admin"); setMobileMenuOpen(false); }}
                        >
                          관리자
                        </Button>
                      )}
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
                        onClick={() => { setLocation("/trade"); setMobileMenuOpen(false); }}
                      >
                        거래하기
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-white/20 text-gray-300 hover:text-white" 
                        onClick={() => { logout.mutate(); setMobileMenuOpen(false); }}
                      >
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full border-white/20 text-gray-300 hover:text-white" 
                        onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }}
                      >
                        로그인
                      </Button>
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
                        onClick={() => { setShowRegisterModal(true); setMobileMenuOpen(false); }}
                      >
                        회원가입
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* === BASE: Deep dark navy === */}
        <div className="absolute inset-0 bg-[#0D0805]" />

        {/* === CENTER RADIAL GLOW === */}
        <div
          className="absolute inset-0 hero-center-glow"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 38%, rgba(180,100,20,0.16) 0%, rgba(160,80,15,0.06) 45%, transparent 75%)' }}
        />

        {/* === ALL CHART LAYERS + PARTICLE NETWORK IN ONE SVG === */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Blur filters for depth layers */}
            <filter id="blur-deep"><feGaussianBlur stdDeviation="14"/></filter>
            <filter id="blur-mid"><feGaussianBlur stdDeviation="5"/></filter>
            <filter id="glow-line">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-dot">
              <feGaussianBlur stdDeviation="2" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>

            {/* SP500 foreground gradient */}
            <linearGradient id="sp500F" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7A4E12" stopOpacity="0"/>
              <stop offset="12%" stopColor="#D4A045" stopOpacity="0.95"/>
              <stop offset="88%" stopColor="#E8C060" stopOpacity="0.95"/>
              <stop offset="100%" stopColor="#F7E08A" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="sp500Fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C9892A" stopOpacity="0.14"/>
              <stop offset="100%" stopColor="#C9892A" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="dowF" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5A3010" stopOpacity="0"/>
              <stop offset="18%" stopColor="#9B6B1A" stopOpacity="0.55"/>
              <stop offset="82%" stopColor="#C9892A" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="#D4A045" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="dxyF" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5A18" stopOpacity="0"/>
              <stop offset="22%" stopColor="#B87C30" stopOpacity="0.35"/>
              <stop offset="78%" stopColor="#C9892A" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#D4A045" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="netLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9892A" stopOpacity="0"/>
              <stop offset="50%" stopColor="#D4A045" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#C9892A" stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* ── LAYER 1: Deep background (heavy blur, low opacity) ── */}
          <g filter="url(#blur-deep)" opacity="0.18" className="chart-float">
            <path d="M-100,580 L120,520 L280,545 L440,490 L600,460 L760,430 L920,400 L1080,370 L1240,340 L1440,305"
              stroke="#8B5A20" strokeWidth="4" fill="none"/>
            <path d="M-100,680 L150,640 L320,660 L500,620 L680,590 L860,560 L1040,530 L1220,500 L1440,465"
              stroke="#6B4018" strokeWidth="3" fill="none"/>
            <path d="M-100,750 L200,720 L400,735 L620,700 L840,670 L1060,640 L1280,610 L1440,585"
              stroke="#4A2A10" strokeWidth="3" fill="none"/>
          </g>

          {/* ── LAYER 2: Mid distance (medium blur) ── */}
          <g filter="url(#blur-mid)" opacity="0.28">
            <path d="M-50,650 L100,620 L200,635 L320,600 L460,575 L600,555 L740,530 L880,505 L1020,478 L1160,452 L1300,425 L1440,400"
              stroke="#A87828" strokeWidth="2.5" fill="none"/>
            <path d="M-50,730 L150,700 L280,715 L420,682 L570,655 L720,635 L870,608 L1030,580 L1190,555 L1350,528 L1440,510"
              stroke="#8B5A20" strokeWidth="2" fill="none"/>
          </g>

          {/* ── CHART GRID (fine dashed) ── */}
          {[120,240,360,480,600,720].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="1440" y2={y} stroke="#5A3015" strokeOpacity="0.18" strokeWidth="0.5" strokeDasharray="3 9"/>
          ))}
          {[0,160,320,480,640,800,960,1120,1280,1440].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="900" stroke="#5A3015" strokeOpacity="0.1" strokeWidth="0.5" strokeDasharray="3 9"/>
          ))}

          {/* ── LAYER 3: Sharp foreground charts ── */}
          {/* SP500 fill */}
          <path
            d="M-20,720 L60,700 L110,712 L170,692 L230,668 L290,682 L360,648 L430,625 L490,640 L550,614 L620,592 L680,608 L750,578 L820,552 L880,568 L950,538 L1020,510 L1090,526 L1160,494 L1240,465 L1310,480 L1390,448 L1440,430 L1440,900 L-20,900 Z"
            fill="url(#sp500Fill)"
          />
          {/* SP500 main line */}
          <path
            d="M-20,720 L60,700 L110,712 L170,692 L230,668 L290,682 L360,648 L430,625 L490,640 L550,614 L620,592 L680,608 L750,578 L820,552 L880,568 L950,538 L1020,510 L1090,526 L1160,494 L1240,465 L1310,480 L1390,448 L1440,430"
            stroke="url(#sp500F)" strokeWidth="2.4" fill="none" filter="url(#glow-line)"
          />
          {/* DOW line */}
          <path
            d="M-20,790 L90,762 L160,778 L240,748 L320,725 L400,742 L480,710 L560,688 L640,705 L720,672 L800,648 L880,665 L960,633 L1040,608 L1120,625 L1200,595 L1280,568 L1360,584 L1440,555"
            stroke="url(#dowF)" strokeWidth="1.7" fill="none"
          />
          {/* DXY line */}
          <path
            d="M-20,848 L110,832 L200,842 L310,825 L410,835 L520,818 L620,808 L720,820 L830,802 L930,790 L1040,803 L1150,785 L1260,773 L1370,785 L1440,770"
            stroke="url(#dxyF)" strokeWidth="1.2" fill="none"
          />

          {/* ── PARTICLE NETWORK ── */}
          {/* Network connection lines */}
          {([
            [[72,180],[210,140]],[[210,140],[355,170]],[[355,170],[510,120]],[[510,120],[660,155]],
            [[660,155],[820,110]],[[820,110],[975,145]],[[975,145],[1130,100]],[[1130,100],[1290,130]],
            [[1290,130],[1420,90]],[[72,180],[140,310]],[[210,140],[290,270]],[[355,170],[430,295]],
            [[510,120],[570,255]],[[660,155],[720,280]],[[820,110],[870,250]],[[975,145],[1020,270]],
            [[1130,100],[1170,230]],[[1290,130],[1330,260]],[[140,310],[290,270]],[[290,270],[430,295]],
            [[430,295],[570,255]],[[570,255],[720,280]],[[720,280],[870,250]],[[870,250],[1020,270]],
            [[1020,270],[1170,230]],[[1170,230],[1330,260]],[[140,310],[200,430]],[[430,295],[500,415]],
            [[720,280],[780,400]],[[1020,270],[1080,390]],[[1330,260],[1380,380]],
          ] as [number,number][][]).map(([[x1,y1],[x2,y2]], i) => (
            <line
              key={`nl${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#C9892A" strokeOpacity="0.22" strokeWidth="0.8"
              strokeDasharray="8 6"
              className="network-line"
              style={{ animationDelay: `${(i * 0.18) % 5}s` }}
            />
          ))}

          {/* Network nodes */}
          {([
            [72,180],[210,140],[355,170],[510,120],[660,155],[820,110],[975,145],[1130,100],[1290,130],[1420,90],
            [140,310],[290,270],[430,295],[570,255],[720,280],[870,250],[1020,270],[1170,230],[1330,260],
            [200,430],[500,415],[780,400],[1080,390],[1380,380],
          ] as [number,number][]).map(([x,y], i) => (
            <g key={`nn${i}`}>
              <circle cx={x} cy={y} r="7" fill="#D4A045" opacity="0.08"
                className="node-ring"
                style={{ animationDelay: `${(i * 0.22) % 3.5}s`, transformOrigin: `${x}px ${y}px` }}
              />
              <circle cx={x} cy={y} r="2.8" fill="#F7E08A" opacity="0.55"
                className="node-dot" filter="url(#glow-dot)"
                style={{ animationDelay: `${(i * 0.22) % 3}s` }}
              />
            </g>
          ))}

          {/* ── GLOWING DATA POINTS on SP500 ── */}
          {([[230,668],[360,648],[550,614],[680,608],[820,552],[950,538],[1090,526],[1240,465],[1390,448]] as [number,number][]).map(([x,y],i) => (
            <g key={`dp${i}`}>
              <circle cx={x} cy={y} r="8" fill="#D4A045" opacity="0.1" className="node-ring" style={{ animationDelay: `${i*0.4}s`, transformOrigin: `${x}px ${y}px` }}/>
              <circle cx={x} cy={y} r="3" fill="#F7E08A" opacity="0.85" filter="url(#glow-dot)" className="node-dot" style={{ animationDelay: `${i*0.4}s` }}/>
            </g>
          ))}

          {/* ── VOLUME BARS ── */}
          {([[80,856,868,0.28],[200,848,862,0.42],[320,852,865,0.35],[440,845,860,0.52],[560,849,863,0.3],[680,843,858,0.48],[800,846,860,0.36],[920,841,857,0.55],[1040,838,854,0.4],[1160,834,851,0.62],[1280,830,847,0.44],[1400,827,843,0.5]] as [number,number,number,number][]).map(([x,y1,y2,op],i) => (
            <rect key={`vb${i}`} x={x-14} y={y1} width="28" height={y2-y1} rx="1.5" fill="#A87828" opacity={op*0.35}/>
          ))}

          {/* ── TICKER LABELS ── */}
          <g filter="url(#glow-line)">
            <rect x="1345" y="418" width="82" height="22" rx="4" fill="#2C1A08" opacity="0.9"/>
            <rect x="1345" y="418" width="82" height="22" rx="4" fill="none" stroke="#D4A045" strokeWidth="0.5" strokeOpacity="0.6"/>
            <text x="1386" y="433" textAnchor="middle" fill="#F7E08A" fontSize="10.5" fontWeight="700" fontFamily="monospace">SP500 ▲</text>
          </g>
          <g opacity="0.5">
            <rect x="1345" y="542" width="82" height="22" rx="4" fill="#1E1008" opacity="0.9"/>
            <rect x="1345" y="542" width="82" height="22" rx="4" fill="none" stroke="#C9892A" strokeWidth="0.5" strokeOpacity="0.5"/>
            <text x="1386" y="557" textAnchor="middle" fill="#D4A045" fontSize="10.5" fontWeight="700" fontFamily="monospace">DOW ▲</text>
          </g>
          <g opacity="0.35">
            <rect x="1345" y="758" width="66" height="22" rx="4" fill="#180D06" opacity="0.9"/>
            <text x="1378" y="773" textAnchor="middle" fill="#C9892A" fontSize="10" fontWeight="600" fontFamily="monospace">DXY →</text>
          </g>
        </svg>

        {/* === GRADIENT OVERLAYS for text readability === */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0805]/20 via-[#0D0805]/50 to-[#0D0805]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0805]/50 via-transparent to-[#0D0805]/50" />
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0D0805] to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
              <LearnInvestLogo variant="icon" size={96} className="relative rounded-2xl" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-2 tracking-wide">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">MIB</span>
            </h1>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">글로벌 투자 거래소</span>
            </div>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-6" data-testid="text-hero-title">
            가장 신뢰받는 글로벌 옵션거래
          </h2>
          
          <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
            안전하고 투명한 시스템으로<br />
            빠르고 편리한 외환 옵션 거래를 제공합니다.
          </p>

          <div className="flex items-center justify-center gap-6 mb-10 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <SymbolIcon symbol="SP500" size={22} />
              <span>S&amp;P500</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <SymbolIcon symbol="DOW" size={22} />
              <span>다우존스</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <SymbolIcon symbol="DXY" size={22} />
              <span>달러 인덱스</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white font-bold px-10 py-6 text-lg rounded-lg shadow-lg shadow-amber-500/25"
              data-testid="button-trade"
              onClick={handleTradeClick}
            >
              거래 시작하기
            </Button>
            {!user && (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-10 py-6 text-lg rounded-lg"
                data-testid="button-register"
                onClick={() => setShowRegisterModal(true)}
              >
                회원가입
              </Button>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-amber-500/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-amber-500/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Index Ticker Strip */}
      <div className="relative overflow-hidden bg-[#120906] border-y border-amber-500/10 py-3">
        <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
          {[0, 1].map((repeatIdx) => (
            <div key={repeatIdx} className="flex shrink-0 items-center">
              {[
                { pair: 'S&P500', name: 'SP500' },
                { pair: '다우존스', name: 'DOW' },
                { pair: '달러', name: 'DXY' },
                { pair: 'S&P500', name: 'SP500-300' },
                { pair: '다우존스', name: 'DOW-300' },
                { pair: '달러', name: 'DXY-300' },
              ].map((item, i) => (
                <div key={`${repeatIdx}-${i}`} className="flex items-center gap-2 text-sm px-6 border-r border-white/5 last:border-0">
                  <SymbolIcon symbol={item.name} size={20} />
                  <span className="text-gray-400">{item.pair}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Market Overview */}
      <section className="py-20 px-4 bg-[#130A06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">LIVE</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">실시간 마켓</h2>
            <p className="text-gray-400">글로벌 주요 지수를 실시간으로 확인하세요</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {marketData.map((item, index) => {
              const isPositive = item.changePercent >= 0;
              const chartPath = generateSparklinePath(item.priceHistory);
              const priceDecimals = item.symbol === 'DXY' ? 4 : 2;
              const formattedPrice = item.price.toFixed(priceDecimals);
              const formattedChange = `${isPositive ? '+' : ''}${item.changePercent.toFixed(2)}%`;
              
              return (
                <div 
                  key={item.symbol}
                  className="w-full sm:w-[280px] bg-gradient-to-br from-[#201208] to-[#180D06] border border-white/10 rounded-xl p-5 hover:border-amber-500/50 transition-all cursor-pointer group"
                  data-testid={`card-market-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500/25 to-amber-600/10 rounded-full flex items-center justify-center group-hover:from-amber-500/35 group-hover:to-amber-600/20 transition-colors border border-amber-500/20">
                        <span className="text-lg font-bold text-amber-400">{item.symbol === 'SP500' ? '📈' : item.symbol === 'DOW' ? '🏛️' : '$'}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.symbol}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded ${isPositive ? 'bg-red-500/20 text-red-400' : 'bg-red-500/20 text-red-400'}`}>
                      {formattedChange}
                    </div>
                  </div>
                  
                  {/* Mini Chart - Real-time */}
                  <div className="h-12 mb-3 overflow-hidden">
                    <svg width="100%" height="48" viewBox="0 0 120 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={isPositive ? "#ef4444" : "#ef4444"} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={isPositive ? "#ef4444" : "#ef4444"} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${chartPath} L120,50 L0,50 Z`}
                        fill={`url(#gradient-${index})`}
                      />
                      <path
                        d={chartPath}
                        fill="none"
                        stroke={isPositive ? "#ef4444" : "#ef4444"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">현재가</p>
                      <p className="text-lg font-bold text-white transition-all">{formattedPrice}</p>
                    </div>
                    <Link href="/trade">
                      <Button size="sm" className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white text-xs transition-all" data-testid={`button-trade-${item.symbol}`}>
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
      <section className="py-16 px-4 bg-[#100805]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Announcements */}
            <div className="bg-gradient-to-br from-[#201208] to-[#180D06] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">공지사항</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">등록된 공지사항이 없습니다</p>
                ) : (
                  announcements.slice(0, 5).map((ann) => (
                    <button
                      key={ann.id}
                      onClick={() => { setSelectedAnnouncement(ann); setShowAnnouncementsModal(true); }}
                      className="w-full text-left p-3 bg-black/30 rounded-lg border border-white/5 hover:border-amber-500/30 transition-colors cursor-pointer"
                      data-testid={`landing-announcement-${ann.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {ann.isPinned && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">고정</span>}
                        <span className="text-white font-medium text-sm line-clamp-1">{ann.title}</span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{ann.content}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages (for logged-in users) or Login Prompt */}
            <div className="bg-gradient-to-br from-[#201208] to-[#180D06] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-white">쪽지함</h3>
                {user && messages.filter(m => !m.isRead).length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {messages.filter(m => !m.isRead).length}
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {!user ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-3">로그인 후 쪽지를 확인하세요</p>
                    <Button 
                      size="sm" 
                      className="bg-amber-500 hover:bg-amber-600 text-white"
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
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer hover:border-amber-500/50 ${msg.isRead ? 'bg-black/20 border-white/5' : 'bg-amber-500/10 border-amber-500/30'}`}
                      data-testid={`message-item-${msg.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isRead && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
                        <span className={`font-medium text-sm line-clamp-1 ${msg.isRead ? 'text-gray-400' : 'text-white'}`}>{msg.title}</span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{msg.content}</p>
                      <p className="text-gray-600 text-[10px] mt-1">{new Date(msg.createdAt).toLocaleDateString('ko-KR')}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-medium mb-2">월드 클래스</p>
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-features-title">트레이딩 플랫폼</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                className="bg-[#130A06] border border-white/5 rounded-2xl p-8 hover:border-amber-500/30 transition-all hover:transform hover:-translate-y-1"
                data-testid={`card-feature-${index}`}
              >
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#130A06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-medium mb-2">플랫폼 이용 후기</p>
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-reviews-title">고객리뷰</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              "처음 보자마자 거래 플랫폼과 사랑에 빠졌습니다. 깔끔하고 간편한 디자인이 정말 마음에 들었거든요.",
              "이 플랫폼을 통해 옵션 거래에 대해 많은 것을 배웠어요. 이제 투자를 통해 수익을 올릴 수 있게 되었죠.",
              "지원팀 문의가 간단하고 쉽더라고요. 빠르게 문의 사항에 답변해 주시는 것에 놀랐습니다."
            ].map((review, index) => (
              <div 
                key={index}
                className="bg-[#1C1008] border border-white/10 rounded-2xl p-8"
                data-testid={`card-review-${index}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-500 rounded-full" />
                  <div>
                    <p className="font-semibold">투자자 {index + 1}</p>
                    <p className="text-sm text-gray-500">Premium 회원</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">"{review}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Only show for non-logged-in users */}
      {!user && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
              MIB에 가입하고<br />지금 바로 시작해보세요
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              당신의 첫 투자,<br />
              믿을 수 있는 MIB에서 시작하세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-lg"
                data-testid="button-login-cta"
                onClick={() => setShowLoginModal(true)}
              >
                로그인
              </Button>
              <Button 
                size="lg" 
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-10 py-6 text-lg rounded-lg"
                data-testid="button-register-cta"
                onClick={() => setShowRegisterModal(true)}
              >
                회원가입
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#0C0705] py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-amber-400">
                  MIB
                </h3>
              </div>
              <p className="text-gray-500 text-sm">
                안전하고 투명한 시스템으로<br />
                빠르고 편리한 옵션 거래를 제공합니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">지수 거래</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><Link href="/trade" className="hover:text-amber-400 transition-colors" data-testid="link-trade-sp500">SP500 (S&amp;P500)</Link></li>
                <li><Link href="/trade" className="hover:text-amber-400 transition-colors" data-testid="link-trade-dow">DOW (다우존스)</Link></li>
                <li><Link href="/trade" className="hover:text-amber-400 transition-colors" data-testid="link-trade-dxy">DXY (달러)</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">입출금</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => { 
                  if (!user) { setShowLoginModal(true); return; }
                  if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); return; }
                  setDepositAmount(''); setDepositSenderName(''); setShowDepositPageModal(true);
                }} className="hover:text-amber-500 transition-colors" data-testid="link-deposit">입금신청</button></li>
                <li><button onClick={() => { 
                  if (!user) { setShowLoginModal(true); return; }
                  if (!isWithinOperatingHours()) { toast.error("입출금 신청은 오전 09:00 ~ 18:00 사이에만 가능합니다"); return; }
                  setWithdrawalAmount(''); setShowWithdrawalPageModal(true);
                }} className="hover:text-amber-500 transition-colors" data-testid="link-withdraw">출금신청</button></li>
                <li><button onClick={() => { if (user) { setShowHistoryModal(true); } else { setShowLoginModal(true); } }} className="hover:text-amber-500 transition-colors" data-testid="link-transaction-history">입출금내역</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">고객센터</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => setShowAnnouncementsModal(true)} className="hover:text-amber-500 transition-colors" data-testid="link-notice">공지사항</button></li>
                <li><button onClick={() => setShowCustomerServiceModal(true)} className="hover:text-amber-500 transition-colors" data-testid="link-inquiry">고객센터</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-300 text-sm">입·출금 및 상담 가능시간</h4>
                <p className="text-gray-600 text-xs mb-2">(주말/공휴일 제외)</p>
                <ul className="space-y-1 text-gray-500 text-xs">
                  <li className="flex justify-between"><span>고객상담</span><span>평일 09:00 ~ 18:00</span></li>
                  <li className="flex justify-between"><span>입금시간</span><span>평일 09:00 ~ 18:00</span></li>
                  <li className="flex justify-between"><span>출금시간</span><span>평일 09:00 ~ 18:00</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-300 text-sm">거래 상품</h4>
                <ul className="space-y-1 text-gray-500 text-xs">
                  <li className="flex justify-between"><span>S&amp;P500</span><span></span></li>
                  <li className="flex justify-between"><span>다우존스</span><span></span></li>
                  <li className="flex justify-between"><span>US Dollar</span><span></span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-300 text-sm">지수 CFD 거래</h4>
                <p className="text-gray-500 text-xs">00:00 ~ 24:00</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 text-center text-gray-600 text-sm space-y-2">
            <p>© 2024 MIB. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">로그인</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                data-testid="button-close-login-modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <LearnInvestLogo variant="icon" size={48} className="rounded-lg" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">로그인</h2>
                <p className="text-gray-400 text-sm">계정에 접속하여 거래를 시작하세요</p>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">아이디</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all"
                    data-testid="input-modal-username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">비밀번호</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all"
                    data-testid="input-modal-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:via-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40"
                  disabled={login.isPending}
                  data-testid="button-modal-login"
                >
                  {login.isPending ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
                계정이 없으신가요?{" "}
                <button 
                  className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                >
                  회원가입
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  실시간 거래
                </span>
                <span>|</span>
                <span>24시간 운영</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegisterModal} onOpenChange={(open) => { setShowRegisterModal(open); if (!open) { setRegisterErrorMessage(""); setUsernameChecked(false); setUsernameCheckMessage(""); setUsernameAvailable(false); } }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">회원가입</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                data-testid="button-close-register-modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <LearnInvestLogo variant="icon" size={40} className="rounded-lg" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">회원가입</h2>
                <p className="text-gray-400 text-sm">지금 가입하고 거래를 시작하세요</p>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-medium">아이디</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={regUsername}
                      onChange={(e) => { setRegUsername(e.target.value); setUsernameChecked(false); setUsernameCheckMessage(""); setUsernameAvailable(false); }}
                      placeholder="아이디 (3자 이상)"
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm flex-1"
                      data-testid="input-reg-username"
                      required
                    />
                    <Button
                      type="button"
                      onClick={handleCheckUsername}
                      disabled={checkingUsername || regUsername.length < 3}
                      className="h-10 px-3 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 whitespace-nowrap"
                      data-testid="button-check-username"
                    >
                      {checkingUsername ? "확인중..." : "중복확인"}
                    </Button>
                  </div>
                  {usernameChecked && usernameCheckMessage && (
                    <p className={`text-xs mt-1 ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`} data-testid="text-username-check">
                      {usernameCheckMessage}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">이름</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="실명"
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                      data-testid="input-reg-name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-medium">비밀번호</label>
                      <Input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="비밀번호 입력"
                        className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                        data-testid="input-reg-password"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-medium">비밀번호 확인</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호 재입력"
                        className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                        data-testid="input-reg-confirm-password"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">대소문자, 숫자, 특수문자 필수 기입 8자리 이상</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">휴대폰 번호</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                      data-testid="input-reg-phone"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">생년월일</label>
                    <Input
                      type="text"
                      value={regBirthDate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setRegBirthDate(val);
                      }}
                      placeholder="예: 901231"
                      maxLength={6}
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                      data-testid="input-reg-birthdate"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">출금 계좌 정보</p>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-medium">은행 선택</label>
                      <Select value={bankName} onValueChange={setBankName}>
                        <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white text-sm">
                          <SelectValue placeholder="은행을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1008] border-white/20 max-h-60 overflow-y-auto">
                          {KOREAN_BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank} className="text-white hover:bg-white/10">
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-300 font-medium">예금주</label>
                        <Input
                          type="text"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="예금주명"
                          className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                          data-testid="input-reg-account-holder"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-300 font-medium">계좌번호</label>
                        <Input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="- 없이 입력"
                          className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 text-sm"
                          data-testid="input-reg-account-number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {registerErrorMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2" data-testid="text-register-error">
                    <p className="text-red-400 text-sm text-center font-medium">{registerErrorMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:via-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 mt-4"
                  disabled={register.isPending}
                  data-testid="button-modal-register"
                >
                  {register.isPending ? "가입 중..." : "회원가입"}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
                이미 계정이 있으신가요?{" "}
                <button 
                  className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                >
                  로그인
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trade History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">거래내역</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <History className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">거래내역</h2>
                <p className="text-gray-400 text-sm">나의 거래 기록과 보유금액을 확인하세요</p>
              </div>

              {/* Balance Card */}
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-amber-500" />
                    <span className="text-gray-300">보유금액</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원
                  </span>
                </div>
              </div>

              {/* Bet History */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-400 mb-2">최근 거래 내역</h3>
                {betHistory && betHistory.length > 0 ? (
                  betHistory.slice(0, 10).map((bet: any) => (
                    <div 
                      key={bet.id} 
                      className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${bet.direction === 'long' ? 'bg-red-500/20 text-red-400' : 'bg-red-500/20 text-red-400'}`}>
                            {bet.direction === 'long' ? '매수' : '매도'}
                          </span>
                          <span className="text-white font-medium">{bet.symbol}</span>
                          {bet.roundNumber && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
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
                        <div className="text-white font-medium">
                          {Number(bet.amount).toLocaleString()}원
                        </div>
                        <div className={`text-xs ${bet.outcome === 'win' ? 'text-green-400' : bet.outcome === 'lose' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {bet.outcome === 'win' ? '실현' : bet.outcome === 'lose' ? '실격' : '진행중'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    거래 내역이 없습니다
                  </div>
                )}
              </div>

              <Button
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => {
                  setShowHistoryModal(false);
                  setLocation("/trade");
                }}
              >
                거래하러 가기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 입금 신청 모달 ===== */}
      <Dialog open={showDepositPageModal} onOpenChange={(open) => { if (!open) { setShowDepositPageModal(false); setDepositAmount(''); setDepositSenderName(''); } }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">입금 신청</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 via-green-500/10 to-green-500/10 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => { setShowDepositPageModal(false); setDepositAmount(''); setDepositSenderName(''); }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  <span className="text-sm">뒤로가기</span>
                </button>
                <h2 className="text-lg font-bold text-white">입금 신청</h2>
                <button onClick={() => { setShowDepositPageModal(false); setDepositAmount(''); setDepositSenderName(''); }}
                  className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 현재 보유금액 */}
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">현재 보유금액</span>
                  <span className="text-xl font-bold text-white">{balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원</span>
                </div>
              </div>

              {/* 입금 진행 절차 STEP 1~4 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-bold text-amber-400 mb-3">입금 진행 절차</h3>
                <div className="space-y-3">
                  {[
                    { step: '01', text: '인터넷뱅킹, 모바일뱅킹, 무통장 입금, ATM 등으로 송금 가능합니다. 입금 계좌는 수시로 변경될 수 있으니 이체 전 반드시 최신 계좌를 확인해 주세요.' },
                    { step: '02', text: '최소 입금 금액은 10,000원입니다. 금액을 잘못 입력하셨을 경우 정정 가능합니다.' },
                    { step: '03', text: "아래 '보내시는 분'란에 실제 송금 통장의 입금주 성함을 정확히 입력해 주세요. 닉네임 또는 다른 이름 입력 시 자동 매칭이 불가합니다." },
                    { step: '04', text: '입금 처리는 영업 시간(평일 오전 09:00 ~ 18:00) 내 순차적으로 진행됩니다. 입금신청 버튼 클릭 후 운영팀 확인을 거쳐 보유금액에 반영됩니다. 처리 완료 시 알림을 통해 안내드립니다.' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex gap-3">
                      <span className="shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs font-bold">{step}</span>
                      <p className="text-gray-400 text-xs leading-relaxed pt-1">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 입금 계좌 정보 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">입금 계좌 정보</p>
                    <p className="text-gray-500 text-xs">입금 계좌 정보는 고객센터를 통해 개별 안내드립니다.</p>
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
                    className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-full hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                    data-testid="button-deposit-inquiry"
                  >
                    계좌번호 문의하기
                  </button>
                </div>
              </div>

              {/* 보내시는 분 */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">보내시는 분 <span className="text-red-400">*</span></label>
                <Input
                  type="text"
                  value={depositSenderName}
                  onChange={(e) => setDepositSenderName(e.target.value)}
                  placeholder="실제 송금 통장의 예금주 성함 입력"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  data-testid="input-deposit-sender"
                />
              </div>

              {/* 입금 금액 */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">입금 금액 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="금액을 입력하세요"
                    className="bg-white/10 border-white/20 text-white pr-12"
                    data-testid="input-deposit-amount"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">원</span>
                </div>
                {depositAmount && <p className="text-gray-400 text-xs mt-1">{Number(depositAmount).toLocaleString()}원</p>}
              </div>

              {/* 빠른 금액 */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[10000, 50000, 100000, 500000].map((amt) => (
                  <button key={amt} onClick={() => setDepositAmount(String(Number(depositAmount || 0) + amt))}
                    className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors" data-testid={`button-deposit-quick-${amt}`}>
                    +{amt / 10000}만
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button onClick={() => setDepositAmount(String(Number(depositAmount || 0) + 1000000))}
                  className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors" data-testid="button-deposit-quick-100">
                  +100만
                </button>
                <button onClick={() => setDepositAmount('')}
                  className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors" data-testid="button-deposit-reset">
                  초기화
                </button>
              </div>

              {/* 입금신청 버튼 */}
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold mb-6"
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
                <h3 className="text-sm font-bold text-gray-300 mb-3">최근 입금 내역</h3>
                {(() => {
                  const depositHistory = (myTransactions || []).filter((t: any) => t.type === 'deposit').slice(0, 5);
                  if (depositHistory.length === 0) {
                    return <p className="text-gray-500 text-xs text-center py-4">입금 내역이 없습니다</p>;
                  }
                  return (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="text-left text-gray-400 px-3 py-2">신청금액</th>
                            <th className="text-center text-gray-400 px-3 py-2">상태</th>
                            <th className="text-right text-gray-400 px-3 py-2">신청일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depositHistory.map((t: any) => (
                            <tr key={t.id} className="border-t border-white/5">
                              <td className="px-3 py-2 text-white font-medium">{Number(t.amount).toLocaleString()}원</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  t.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                  t.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
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
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 출금 신청 모달 ===== */}
      <Dialog open={showWithdrawalPageModal} onOpenChange={(open) => { if (!open) { setShowWithdrawalPageModal(false); setWithdrawalAmount(''); } }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">출금 신청</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-blue-500/10 to-blue-500/10 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => { setShowWithdrawalPageModal(false); setWithdrawalAmount(''); }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  <span className="text-sm">뒤로가기</span>
                </button>
                <h2 className="text-lg font-bold text-white">출금 신청</h2>
                <button onClick={() => { setShowWithdrawalPageModal(false); setWithdrawalAmount(''); }}
                  className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 현재 보유금액 */}
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">현재 보유금액</span>
                  <span className="text-xl font-bold text-white">{balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원</span>
                </div>
              </div>

              {/* 출금 진행 절차 STEP 1~4 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-bold text-blue-400 mb-3">출금 진행 절차</h3>
                <div className="space-y-3">
                  {[
                    { step: '01', text: '출금 처리는 영업 시간(평일 오전 09:00 ~ 18:00) 내 순차적으로 진행됩니다. 신청 즉시 보유금액에서 우선 차감됩니다.' },
                    { step: '02', text: '24시간 이상 지연 시, 등록된 출금 계좌 정보(은행명·계좌번호·예금주 성명)가 실제 계좌와 일치하는지 확인해 주세요.' },
                    { step: '03', text: '등록되지 않은 계좌로 출금을 원하실 경우 반드시 고객센터를 통해 사전에 변경 요청을 해주시기 바랍니다.' },
                    { step: '04', text: '출금신청 버튼 클릭 후 운영팀 검수를 거쳐 은행 이체가 진행됩니다. 처리 완료 시 알림을 통해 안내드립니다.' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex gap-3">
                      <span className="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold">{step}</span>
                      <p className="text-gray-400 text-xs leading-relaxed pt-1">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 출금 계좌 정보 (읽기전용) */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-300 mb-1">출금 계좌 정보</h3>
                {!user?.bankName && !user?.accountNumber ? (
                  <div className="text-center py-2">
                    <p className="text-yellow-400 text-xs mb-2">등록된 출금 계좌가 없습니다.</p>
                    <button onClick={() => { setShowWithdrawalPageModal(false); openMyPage(); }}
                      className="text-amber-400 text-xs underline hover:text-amber-300 transition-colors">
                      마이페이지에서 계좌 등록하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">거래은행</span>
                      <span className="text-white text-xs font-medium">{user?.bankName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">계좌번호</span>
                      <span className="text-white text-xs font-medium">{user?.accountNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">예금주</span>
                      <span className="text-white text-xs font-medium">{user?.accountHolder || '-'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* 출금 가능액 */}
              <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                <span className="text-gray-400 text-sm">출금가능액</span>
                <span className="text-white font-bold">{balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원</span>
              </div>

              {/* 출금 금액 */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">출금 금액 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Input
                    type="text"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="금액을 입력하세요"
                    className="bg-white/10 border-white/20 text-white pr-12"
                    data-testid="input-withdrawal-amount"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">원</span>
                </div>
                {withdrawalAmount && <p className="text-gray-400 text-xs mt-1">{Number(withdrawalAmount).toLocaleString()}원</p>}
                {withdrawalAmount && Number(withdrawalAmount) > Number(balanceData?.balance || 0) && (
                  <p className="text-red-400 text-xs mt-1">보유금액을 초과할 수 없습니다</p>
                )}
              </div>

              {/* 빠른 금액 */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[10000, 50000, 100000, 500000].map((amt) => (
                  <button key={amt} onClick={() => setWithdrawalAmount(String(Math.min(Number(withdrawalAmount || 0) + amt, Number(balanceData?.balance || 0))))}
                    className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors" data-testid={`button-withdrawal-quick-${amt}`}>
                    +{amt / 10000}만
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button onClick={() => setWithdrawalAmount(String(balanceData?.balance ? Math.floor(Number(balanceData.balance)) : 0))}
                  className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors" data-testid="button-withdrawal-all">
                  전액
                </button>
                <button onClick={() => setWithdrawalAmount('')}
                  className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded transition-colors" data-testid="button-withdrawal-reset">
                  초기화
                </button>
              </div>

              {/* 출금신청 버튼 */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={
                  withdrawalSubmitting ||
                  !withdrawalAmount ||
                  Number(withdrawalAmount) <= 0 ||
                  Number(withdrawalAmount) > Number(balanceData?.balance || 0) ||
                  (!user?.bankName && !user?.accountNumber)
                }
                data-testid="button-withdrawal-submit"
                onClick={async () => {
                  if (!user?.bankName && !user?.accountNumber) { toast.error('출금 계좌를 먼저 등록해주세요'); return; }
                  if (!withdrawalAmount || Number(withdrawalAmount) <= 0) { toast.error('금액을 입력해주세요'); return; }
                  if (Number(withdrawalAmount) < 10000) { toast.error('최소 출금금액은 10,000원입니다'); return; }
                  if (Number(withdrawalAmount) > Number(balanceData?.balance || 0)) { toast.error('보유금액을 초과할 수 없습니다'); return; }
                  setWithdrawalSubmitting(true);
                  try {
                    const res = await fetch('/api/transactions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'withdrawal', amount: withdrawalAmount }),
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Service Modal - 고객센터 메뉴 */}
      <Dialog open={showCustomerServiceModal} onOpenChange={setShowCustomerServiceModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">고객센터</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowCustomerServiceModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Headphones className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">고객센터</h2>
                <p className="text-gray-400 text-sm">문의를 남기시면 빠르게 답변드립니다</p>
              </div>

              <div className="space-y-3">
                {/* 문의 작성하기 */}
                <button 
                  className="w-full block bg-gradient-to-r from-amber-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-4 hover:border-amber-500/50 transition-colors cursor-pointer text-left"
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
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">문의 작성하기</h3>
                      <p className="text-amber-400 text-sm">새로운 문의를 작성합니다</p>
                      <p className="text-gray-400 text-xs">빠른 답변 보장</p>
                    </div>
                    <div className="text-amber-500">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>

                {/* 내 문의 내역 */}
                <button 
                  className="w-full block bg-white/5 border border-white/10 rounded-xl p-4 hover:border-amber-500/50 transition-colors cursor-pointer text-left"
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
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">내 문의 내역</h3>
                      <p className="text-amber-400 text-sm">작성한 문의와 답변 확인</p>
                      <p className="text-gray-400 text-xs">{myInquiries.length}건의 문의</p>
                    </div>
                    <div className="text-amber-500">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>

                {/* 입출금 내역 */}
                <button
                  className="w-full block bg-white/5 border border-white/10 rounded-xl p-4 hover:border-amber-500/50 transition-colors cursor-pointer text-left"
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
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <History className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">입출금 내역</h3>
                      <p className="text-amber-400 text-sm">입금·출금 신청 및 처리 현황</p>
                      <p className="text-gray-400 text-xs">{myTransactions.length}건의 거래 내역</p>
                    </div>
                    <div className="text-amber-400">
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
                    className="w-full block bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/30 rounded-xl p-4 hover:border-sky-500/50 transition-colors cursor-pointer text-left"
                    onClick={() => setShowCustomerServiceModal(false)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-sky-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">텔레그램 고객센터</h3>
                        <p className="text-sky-400 text-sm">텔레그램으로 바로 문의</p>
                        <p className="text-gray-400 text-xs">실시간 상담 가능</p>
                      </div>
                      <div className="text-sky-500">
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
                    className="w-full block bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition-colors cursor-pointer text-left"
                    onClick={() => setShowCustomerServiceModal(false)}
                    data-testid="link-kakao"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">카카오톡 고객센터</h3>
                        <p className="text-yellow-400 text-sm">카카오톡으로 바로 문의</p>
                        <p className="text-gray-400 text-xs">실시간 상담 가능</p>
                      </div>
                      <div className="text-yellow-500">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Success Modal */}
      <AlertDialog open={showWithdrawalSuccessModal} onOpenChange={setShowWithdrawalSuccessModal}>
        <AlertDialogContent className="bg-[#1C1008] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              출금 신청 완료
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 space-y-3">
              <p className="text-lg">
                <span className="text-green-400 font-bold">{Number(withdrawalSuccessAmount).toLocaleString()}원</span> 출금 신청이 완료되었습니다.
              </p>
              <p>처리까지 약 30분이 소요됩니다.</p>
              <p className="text-sm text-gray-500">가입 시 등록한 계좌로 입금됩니다.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowWithdrawalSuccessModal(false)}
              className="bg-gradient-to-r from-amber-500 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-white"
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
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowInquiryFormModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FileText className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">문의 작성</h2>
                <p className="text-gray-400 text-sm">문의를 남기시면 빠르게 답변드립니다</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">제목</label>
                  <input
                    type="text"
                    placeholder="문의 제목을 입력해주세요"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    data-testid="input-inquiry-title"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">내용</label>
                  <textarea
                    placeholder="문의 내용을 자세히 작성해주세요"
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                    data-testid="input-inquiry-content"
                  />
                </div>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* My Inquiries Modal - 내 문의 내역 */}
      <Dialog open={showMyInquiriesModal} onOpenChange={setShowMyInquiriesModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">내 문의 내역</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => setShowMyInquiriesModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MessageCircle className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">내 문의 내역</h2>
                  <button
                    onClick={() => refetchInquiries()}
                    className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="새로고침"
                    data-testid="button-refresh-inquiries"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">총 {myInquiries.length}건의 문의</p>
              </div>

              <div className="space-y-3">
                {myInquiries.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">등록된 문의가 없습니다</p>
                ) : (
                  myInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">{inquiry.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          inquiry.status === 'answered' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-amber-500/20 text-yellow-400'
                        }`}>
                          {inquiry.status === 'answered' ? '답변완료' : '대기중'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2 whitespace-pre-wrap">{inquiry.content}</p>
                      <p className="text-gray-500 text-xs mb-3">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      
                      {inquiry.reply && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber-500 text-sm font-medium">고객센터</span>
                            {inquiry.repliedAt && (
                              <span className="text-gray-500 text-xs">
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
                          <p className="text-gray-300 text-sm whitespace-pre-wrap bg-amber-500/10 p-3 rounded-lg">{inquiry.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <Button
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                onClick={() => {
                  setShowMyInquiriesModal(false);
                  setShowInquiryFormModal(true);
                }}
              >
                새 문의 작성하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Modal - 입출금 내역 */}
      <Dialog open={showTransactionsModal} onOpenChange={(open) => { setShowTransactionsModal(open); if (open) refetchTransactions(); }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">입출금 내역</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <History className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">입출금 내역</h2>
                  <button
                    onClick={() => refetchTransactions()}
                    className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="새로고침"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">총 {myTransactions.length}건의 거래 내역</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4">
                {(['all', 'deposit', 'withdrawal'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTransactionFilter(f)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      transactionFilter === f
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                      <div className="text-center py-12 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">거래 내역이 없습니다</p>
                      </div>
                    );
                  }
                  const statusMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
                    pending: { label: '대기중', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
                    approved: { label: '승인', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
                    rejected: { label: '거절', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
                    hold: { label: '보류', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: <Clock className="w-3 h-3" /> },
                  };
                  return filtered.map((tx: any) => {
                    const isDeposit = tx.type === 'deposit';
                    const status = statusMap[tx.status] || statusMap.pending;
                    return (
                      <div key={tx.id} className="bg-white/5 border border-white/10 rounded-xl p-4" data-testid={`tx-item-${tx.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isDeposit
                              ? <ArrowDownCircle className="w-5 h-5 text-blue-400" />
                              : <ArrowUpCircle className="w-5 h-5 text-red-400" />
                            }
                            <span className={`font-semibold text-base ${isDeposit ? 'text-blue-400' : 'text-red-400'}`}>
                              {isDeposit ? '입금' : '출금'}
                            </span>
                          </div>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${status.color}`}>
                            {status.icon}{status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-lg">
                            {Number(tx.amount).toLocaleString('ko-KR')}원
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(tx.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul',
                              month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {tx.bankName && (
                          <p className="text-gray-400 text-xs mt-1">
                            {tx.bankName} · {tx.accountHolder} · {tx.accountNumber}
                          </p>
                        )}
                        {tx.adminNote && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-amber-400 text-xs font-medium mb-0.5">관리자 메모</p>
                            <p className="text-gray-300 text-xs">{tx.adminNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages Modal - 쪽지함 */}
      <Dialog open={showMessagesModal} onOpenChange={setShowMessagesModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">쪽지함</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => { setShowMessagesModal(false); setSelectedMessage(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Mail className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">쪽지함</h2>
                <p className="text-gray-400 text-sm">
                  {selectedMessage ? '쪽지 내용' : `총 ${messages.length}건의 쪽지`}
                </p>
              </div>

              {selectedMessage ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    목록으로 돌아가기
                  </button>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-medium text-lg">{selectedMessage.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">{selectedMessage.content}</p>
                    <p className="text-gray-500 text-xs">
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
                    <p className="text-gray-500 text-sm py-8 text-center">받은 쪽지가 없습니다</p>
                  ) : (
                    messages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className={`w-full text-left bg-white/5 border rounded-xl p-4 hover:border-amber-500/50 transition-colors ${msg.isRead ? 'border-white/10' : 'border-amber-500/30 bg-amber-500/10'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {!msg.isRead && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
                            <h3 className={`font-medium ${msg.isRead ? 'text-gray-400' : 'text-white'}`}>{msg.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{msg.content}</p>
                        <p className="text-gray-500 text-xs mt-2">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements Modal */}
      <Dialog open={showAnnouncementsModal} onOpenChange={(open) => { setShowAnnouncementsModal(open); if (!open) setSelectedAnnouncement(null); }}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">공지사항</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/20 to-amber-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1C1008]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => { setShowAnnouncementsModal(false); setSelectedAnnouncement(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Bell className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">공지사항</h2>
                <p className="text-gray-400 text-sm">
                  {selectedAnnouncement ? '공지사항 상세' : '중요한 안내사항을 확인하세요'}
                </p>
              </div>

              {selectedAnnouncement ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    목록으로 돌아가기
                  </button>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {selectedAnnouncement.isPinned && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-xs font-medium">고정</span>
                      )}
                      <h3 className="text-white font-medium text-lg">{selectedAnnouncement.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <p className="text-gray-500 text-sm py-8 text-center">등록된 공지사항이 없습니다</p>
                  ) : (
                    announcements.map((ann) => (
                      <button
                        key={ann.id}
                        onClick={() => setSelectedAnnouncement(ann)}
                        className="w-full text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:border-amber-500/50 transition-colors"
                        data-testid={`announcement-item-${ann.id}`}
                      >
                        <div className="flex items-start gap-3">
                          {ann.isPinned && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-xs font-medium">고정</span>
                          )}
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{ann.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-2">{ann.content}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Page Modal */}
      <Dialog open={showMyPageModal} onOpenChange={setShowMyPageModal}>
        <DialogContent className="bg-[#0f1117] border border-white/10 text-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogTitle className="text-xl font-bold text-white mb-6">마이페이지</DialogTitle>

            {/* 계정 정보 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-white mb-4 pb-2 border-b border-white/10">계정 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">아이디</label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm cursor-not-allowed"
                    data-testid="input-mypage-username"
                  />
                  <p className="text-xs text-gray-500 mt-1">로그인에 사용되는 고유 아이디입니다.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">새 비밀번호</label>
                    <Input
                      type="password"
                      placeholder="새 비밀번호"
                      value={myPageNewPassword}
                      onChange={e => setMyPageNewPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
                      data-testid="input-mypage-new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">비밀번호 확인</label>
                    <Input
                      type="password"
                      placeholder="새 비밀번호 확인"
                      value={myPageConfirmPassword}
                      onChange={e => setMyPageConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
                      data-testid="input-mypage-confirm-password"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">영문, 숫자, 기호를 조합하여 안전한 비밀번호를 설정해 주세요. (비워두면 변경 안됨)</p>
              </div>
            </div>

            {/* 본인 정보 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-white mb-4 pb-2 border-b border-white/10">본인 정보</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">이름</label>
                  <input
                    type="text"
                    value={(user as any)?.name || ""}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm cursor-not-allowed"
                    data-testid="input-mypage-name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">생년월일 (YYMMDD)</label>
                  <input
                    type="text"
                    value={(user as any)?.birthDate || ""}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm cursor-not-allowed"
                    data-testid="input-mypage-birthdate"
                  />
                  <p className="text-xs text-gray-500 mt-1">회원 가입 시 등록한 정보 기준으로 표시됩니다.</p>
                </div>
              </div>
            </div>

            {/* 출금 계좌 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-white mb-4 pb-2 border-b border-white/10">출금 계좌</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">은행명</label>
                  <Select value={myPageBankName} onValueChange={setMyPageBankName}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm" data-testid="select-mypage-bank">
                      <SelectValue placeholder="은행 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1008] border-white/10 max-h-60">
                      {KOREAN_BANKS.map(bank => (
                        <SelectItem key={bank} value={bank} className="text-gray-300 focus:bg-white/10 focus:text-white">{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">정산 및 출금 시 사용될 계좌 정보를 정확히 입력해 주세요.</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">계좌번호</label>
                  <Input
                    type="text"
                    placeholder="계좌번호 (숫자만)"
                    value={myPageAccountNumber}
                    onChange={e => setMyPageAccountNumber(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
                    data-testid="input-mypage-account-number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">예금주</label>
                  <Input
                    type="text"
                    placeholder="예금주명"
                    value={myPageAccountHolder}
                    onChange={e => setMyPageAccountHolder(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
                    data-testid="input-mypage-account-holder"
                  />
                  <p className="text-xs text-gray-500 mt-1">회원 실명과 동일해야 정상 출금이 가능합니다.</p>
                </div>
              </div>
            </div>

            {/* 보유금 */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-white mb-4 pb-2 border-b border-white/10">보유금</h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1">보유금액</label>
                <input
                  type="text"
                  value={`₩ ${balanceData?.balance ? Math.floor(parseFloat(balanceData.balance)).toLocaleString() : '0'}`}
                  readOnly
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400 font-bold text-sm cursor-not-allowed"
                  data-testid="input-mypage-balance"
                />
              </div>
            </div>

            {/* 저장 버튼 */}
            <Button
              onClick={handleMyPageSave}
              disabled={myPageSaving}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-11"
              data-testid="button-mypage-save"
            >
              {myPageSaving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Error Alert Dialog */}
      <AlertDialog open={!!loginErrorMessage} onOpenChange={() => setLoginErrorMessage("")}>
        <AlertDialogContent className="bg-[#1C1008] border border-red-500/30">
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
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
