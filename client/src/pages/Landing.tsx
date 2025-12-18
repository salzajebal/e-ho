import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Shield, Zap, Headphones, TrendingUp, Lock, Award, X, ChevronDown, Phone, Mail, MessageCircle, History, Wallet, Menu, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLogin, useRegister, useAuth, useLogout } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const NASDAQ_STOCKS = [
  { symbol: "NDX", name: "NASDAQ 100" },
  { symbol: "SP500", name: "S&P 500" },
];

const KOREAN_BANKS = [
  "KB국민은행", "신한은행", "우리은행", "하나은행", "SC제일은행",
  "한국씨티은행", "케이뱅크", "카카오뱅크", "토스뱅크", "NH농협은행",
  "IBK기업은행", "KDB산업은행", "수협은행", "대구은행", "부산은행",
  "광주은행", "전북은행", "경남은행", "제주은행",
];

interface LandingMarketData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  priceHistory: number[];
}

function useLandingMarketData() {
  const [markets, setMarkets] = useState<LandingMarketData[]>([
    { symbol: "NDX", name: "NASDAQ 100", price: 0, changePercent: 0, priceHistory: [] },
    { symbol: "SP500", name: "S&P 500", price: 0, changePercent: 0, priceHistory: [] },
  ]);
  
  const historyRef = useRef<Record<string, number[]>>({
    "NDX": [],
    "SP500": [],
  });
  
  const lastApiPrices = useRef<Record<string, { price: number; changePercent: number }>>({});

  useEffect(() => {
    // Fetch real prices from API
    const fetchRealPrices = async () => {
      try {
        const response = await fetch('/api/market/prices');
        const result = await response.json();
        
        if (!result.fallback && result.prices) {
          setMarkets(prev => prev.map(m => {
            const apiPrice = result.prices.find((p: any) => p.symbol === m.symbol);
            if (apiPrice) {
              // Store as authoritative price
              lastApiPrices.current[m.symbol] = {
                price: apiPrice.price,
                changePercent: apiPrice.changePercent,
              };
              
              // Initialize history if empty
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
        console.log('Using fallback prices');
      }
    };

    // Initial fetch
    fetchRealPrices();

    // Fetch from API every 15 seconds
    const apiInterval = setInterval(fetchRealPrices, 15000);

    // Micro-simulation for smooth UI (stays close to API price)
    const simInterval = setInterval(() => {
      setMarkets(prev => prev.map(m => {
        const apiData = lastApiPrices.current[m.symbol];
        if (!apiData || apiData.price === 0) return m;
        
        // Very small variation around API price (0.01% max)
        const microChange = apiData.price * 0.0001 * (Math.random() - 0.5);
        const newPrice = apiData.price + microChange;
        
        historyRef.current[m.symbol] = [...historyRef.current[m.symbol].slice(-19), newPrice];
        
        return {
          ...m,
          price: parseFloat(newPrice.toFixed(2)),
          changePercent: apiData.changePercent,
          priceHistory: [...historyRef.current[m.symbol]]
        };
      }));
    }, 1000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(simInterval);
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralName, setReferralName] = useState("");
  
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();
  const { data: user } = useAuth();
  const [, setLocation] = useLocation();
  const marketData = useLandingMarketData();

  // Fetch user balance and bet history if logged in
  const { data: balanceData } = useQuery({
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
  const { data: messages = [] } = useQuery<{id: number; title: string; content: string; isRead: boolean; createdAt: string}[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password }, {
      onSuccess: () => {
        setShowLoginModal(false);
        setUsername("");
        setPassword("");
      }
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regUsername.length < 3) {
      toast.error("아이디는 3자 이상이어야 합니다");
      return;
    }
    if (regPassword.length < 4) {
      toast.error("비밀번호는 4자 이상이어야 합니다");
      return;
    }
    if (regPassword !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    if (!name) {
      toast.error("이름을 입력해주세요");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("올바른 휴대폰 번호를 입력해주세요");
      return;
    }
    if (!bankName) {
      toast.error("은행을 선택해주세요");
      return;
    }
    if (!accountHolder) {
      toast.error("예금주를 입력해주세요");
      return;
    }
    if (!accountNumber) {
      toast.error("계좌번호를 입력해주세요");
      return;
    }

    if (referralCode && referralValid === false) {
      toast.error("올바른 가입코드를 입력해주세요");
      return;
    }
    
    register.mutate({ 
      username: regUsername, 
      password: regPassword, 
      name, 
      phone, 
      bankName, 
      accountHolder, 
      accountNumber,
      referralCode: referralCode || undefined
    }, {
      onSuccess: () => {
        setShowRegisterModal(false);
        setRegUsername("");
        setRegPassword("");
        setConfirmPassword("");
        setName("");
        setPhone("");
        setBankName("");
        setAccountHolder("");
        setAccountNumber("");
        setReferralCode("");
        setReferralValid(null);
        setReferralName("");
      }
    });
  };

  const validateReferralCode = async (code: string) => {
    if (!code) {
      setReferralValid(null);
      setReferralName("");
      return;
    }
    try {
      const res = await fetch(`/api/referral/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setReferralValid(true);
        setReferralName(data.displayName);
      } else {
        setReferralValid(false);
        setReferralName("");
      }
    } catch {
      setReferralValid(false);
      setReferralName("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" data-testid="link-logo">
              <div className="flex items-center gap-2 md:gap-3">
                <img 
                  src="/logo.png" 
                  alt="Invest Korea Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold tracking-wide">
                    <span className="text-white">INVEST</span>
                    <span className="text-orange-500 ml-1">KOREA</span>
                  </span>
                  <span className="hidden sm:block text-[10px] text-gray-400 tracking-widest uppercase">Premium Trading</span>
                </div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium flex items-center gap-1" data-testid="nav-options-trading">
                  옵션거래 <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a24] border-white/10">
                  {NASDAQ_STOCKS.map((stock) => (
                    <DropdownMenuItem 
                      key={stock.symbol}
                      className="text-gray-300 hover:text-orange-500 hover:bg-white/5 cursor-pointer"
                      onClick={() => {
                        if (user) {
                          setLocation("/trade");
                        } else {
                          setShowLoginModal(true);
                        }
                      }}
                    >
                      <span className="font-medium text-orange-500 mr-2">{stock.symbol}</span>
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
                className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" 
                data-testid="nav-trade-history"
              >
                거래내역
              </button>
              <button 
                onClick={() => {
                  if (user) {
                    setShowDepositModal(true);
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" 
                data-testid="nav-deposit-withdraw"
              >
                입출금
              </button>
              <button 
                onClick={() => setShowAnnouncementsModal(true)}
                className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" 
                data-testid="nav-announcements"
              >
                공지사항
              </button>
              <button 
                onClick={() => setShowCustomerServiceModal(true)}
                className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" 
                data-testid="nav-customer-service"
              >
                1:1문의
              </button>
            </nav>
          </div>
          
          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Balance Display */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                  <Wallet className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-400 text-xs">잔고</span>
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
                    onClick={() => { setTransactionType('deposit'); setShowDepositModal(true); }}
                  >
                    입금
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2"
                    data-testid="button-header-withdraw"
                    onClick={() => { setTransactionType('withdrawal'); setShowDepositModal(true); }}
                  >
                    출금
                  </Button>
                </div>

                <span className="text-gray-300 text-sm hidden lg:block">
                  {user.username}님
                </span>
                {user.role === 'admin' ? (
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
                    data-testid="button-header-admin"
                    onClick={() => setLocation("/admin")}
                  >
                    관리자
                  </Button>
                ) : (
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
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
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
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
            <SheetContent side="right" className="bg-[#0a0a0f] border-white/10 w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-white text-left">메뉴</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {user && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4">
                    <Wallet className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-400 text-xs">잔고</span>
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
                  className="text-left text-gray-300 hover:text-orange-500 py-3 border-b border-white/10"
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
                  className="text-left text-gray-300 hover:text-orange-500 py-3 border-b border-white/10"
                >
                  거래내역
                </button>
                <button 
                  onClick={() => {
                    if (user) {
                      setShowDepositModal(true);
                    } else {
                      setShowLoginModal(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-300 hover:text-orange-500 py-3 border-b border-white/10"
                >
                  입출금
                </button>
                <button 
                  onClick={() => {
                    setShowAnnouncementsModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-300 hover:text-orange-500 py-3 border-b border-white/10"
                >
                  공지사항
                </button>
                <button 
                  onClick={() => {
                    setShowCustomerServiceModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-300 hover:text-orange-500 py-3 border-b border-white/10"
                >
                  1:1문의
                </button>
                
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <p className="text-gray-400 text-sm mb-2">{user.username}님</p>
                      {user.role === 'admin' && (
                        <Button 
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
                          onClick={() => { setLocation("/admin"); setMobileMenuOpen(false); }}
                        >
                          관리자
                        </Button>
                      )}
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
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
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" 
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
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/70 to-[#0a0a0f]" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col items-center">
            <img 
              src="/logo.png" 
              alt="Invest Korea Logo" 
              className="w-24 h-24 rounded-2xl object-cover mb-4"
            />
            <h1 className="text-5xl md:text-7xl font-bold mb-2 tracking-wide">
              <span className="text-white">INVEST</span>
              <span className="text-orange-500 ml-3">KOREA</span>
            </h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-6" data-testid="text-hero-title">
            가장 신뢰받는 글로벌 선도 거래
          </h2>
          
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto" data-testid="text-hero-description">
            안전하게 투명한 시스템으로<br />
            빠르고 편리한 옵션 거래를 제공합니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-6 text-lg rounded-lg"
              data-testid="button-trade"
              onClick={handleTradeClick}
            >
              거래하기
            </Button>
            {!user && (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-lg"
                data-testid="button-register"
                onClick={() => setShowRegisterModal(true)}
              >
                회원가입
              </Button>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20 px-4 bg-[#0f0f15]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">LIVE</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">실시간 마켓</h2>
            <p className="text-gray-400">글로벌 시장을 실시간으로 확인하세요</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {marketData.map((item, index) => {
              const isPositive = item.changePercent >= 0;
              const chartPath = generateSparklinePath(item.priceHistory);
              const formattedPrice = item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const formattedChange = `${isPositive ? '+' : ''}${item.changePercent.toFixed(2)}%`;
              
              return (
                <div 
                  key={item.symbol}
                  className="w-full sm:w-[280px] bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-xl p-5 hover:border-orange-500/50 transition-all cursor-pointer group"
                  data-testid={`card-market-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.symbol}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {formattedChange}
                    </div>
                  </div>
                  
                  {/* Mini Chart - Real-time */}
                  <div className="h-12 mb-3 overflow-hidden">
                    <svg width="100%" height="48" viewBox="0 0 120 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${chartPath} L120,50 L0,50 Z`}
                        fill={`url(#gradient-${index})`}
                      />
                      <path
                        d={chartPath}
                        fill="none"
                        stroke={isPositive ? "#22c55e" : "#ef4444"}
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
                      <p className="text-lg font-bold text-white transition-all">${formattedPrice}</p>
                    </div>
                    <Link href="/trade">
                      <Button size="sm" className="bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white text-xs transition-all" data-testid={`button-trade-${item.symbol}`}>
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
      <section className="py-16 px-4 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Announcements */}
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <div key={ann.id} className="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-orange-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        {ann.isPinned && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">고정</span>}
                        <span className="text-white font-medium text-sm line-clamp-1">{ann.title}</span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{ann.content}</p>
                      <p className="text-gray-600 text-[10px] mt-1">{new Date(ann.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages (for logged-in users) or Login Prompt */}
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
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
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => setShowLoginModal(true)}
                    >
                      로그인
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">받은 쪽지가 없습니다</p>
                ) : (
                  messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className={`p-3 rounded-lg border transition-colors ${msg.isRead ? 'bg-black/20 border-white/5' : 'bg-blue-500/10 border-blue-500/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <span className={`font-medium text-sm line-clamp-1 ${msg.isRead ? 'text-gray-400' : 'text-white'}`}>{msg.title}</span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{msg.content}</p>
                      <p className="text-gray-600 text-[10px] mt-1">{new Date(msg.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
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
            <p className="text-yellow-500 font-medium mb-2">월드 클래스</p>
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
                className="bg-[#12121a] border border-white/5 rounded-2xl p-8 hover:border-yellow-500/30 transition-all hover:transform hover:-translate-y-1"
                data-testid={`card-feature-${index}`}
              >
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#0f0f15]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-yellow-500 font-medium mb-2">플랫폼 이용 후기</p>
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
                className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8"
                data-testid={`card-review-${index}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full" />
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
              INVEST KOREA에 가입하고<br />지금 바로 시작해보세요
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              당신의 첫 옵션 거래,<br />
              믿을 수 있는 INVEST KOREA에서 시작하세요!
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
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-6 text-lg rounded-lg"
                  data-testid="button-register-cta"
                >
                  회원가입
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#08080c] py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="Invest Korea Logo" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <h3 className="text-xl font-bold">
                  <span className="text-white">INVEST</span>
                  <span className="text-orange-500 ml-1">KOREA</span>
                </h3>
              </div>
              <p className="text-gray-500 text-sm">
                안전하고 투명한 시스템으로<br />
                빠르고 편리한 옵션 거래를 제공합니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">옵션거래</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-trade-nasdaq">NASDAQ 100</Link></li>
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-trade-sp500">S&P 500</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">입출금</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => { if (user) { setTransactionType('deposit'); setShowDepositModal(true); } else { setShowLoginModal(true); } }} className="hover:text-orange-500 transition-colors" data-testid="link-deposit">입금신청</button></li>
                <li><button onClick={() => { if (user) { setTransactionType('withdrawal'); setShowDepositModal(true); } else { setShowLoginModal(true); } }} className="hover:text-orange-500 transition-colors" data-testid="link-withdraw">출금신청</button></li>
                <li><button onClick={() => { if (user) { setShowHistoryModal(true); } else { setShowLoginModal(true); } }} className="hover:text-orange-500 transition-colors" data-testid="link-transaction-history">입출금내역</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">고객센터</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => setShowAnnouncementsModal(true)} className="hover:text-orange-500 transition-colors" data-testid="link-notice">공지사항</button></li>
                <li><button onClick={() => setShowCustomerServiceModal(true)} className="hover:text-orange-500 transition-colors" data-testid="link-inquiry">1:1문의</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 text-center text-gray-600 text-sm">
            <p>© 2024 INVEST KOREA Trade International, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                data-testid="button-close-login-modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <img 
                    src="/logo.png" 
                    alt="Invest Korea Logo" 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
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
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all"
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
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all"
                    data-testid="input-modal-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:via-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40"
                  disabled={login.isPending}
                  data-testid="button-modal-login"
                >
                  {login.isPending ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
                계정이 없으신가요?{" "}
                <button 
                  className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
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
                <span>|</span>
                <span>2.0x 배당</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                data-testid="button-close-register-modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <img 
                    src="/logo.png" 
                    alt="Invest Korea Logo" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">회원가입</h2>
                <p className="text-gray-400 text-sm">지금 가입하고 거래를 시작하세요</p>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">아이디</label>
                    <Input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="아이디 (3자 이상)"
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
                      data-testid="input-reg-username"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">이름</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="실명"
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
                      data-testid="input-reg-name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">비밀번호</label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="4자 이상"
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
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
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
                      data-testid="input-reg-confirm-password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-medium">휴대폰 번호</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
                    data-testid="input-reg-phone"
                    required
                  />
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
                        <SelectContent className="bg-gray-900 border-white/20">
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
                          className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
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
                          className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm"
                          data-testid="input-reg-account-number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">가입코드 (선택)</p>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">추천인 코드</label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase();
                          setReferralCode(code);
                          if (code.length >= 6) {
                            validateReferralCode(code);
                          } else {
                            setReferralValid(null);
                            setReferralName("");
                          }
                        }}
                        placeholder="가입코드를 입력하세요 (선택)"
                        className={`h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 text-sm uppercase ${
                          referralValid === true ? 'border-green-500' : referralValid === false ? 'border-red-500' : ''
                        }`}
                        data-testid="input-reg-referral-code"
                      />
                      {referralValid === true && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs">
                          {referralName}
                        </span>
                      )}
                      {referralValid === false && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs">
                          잘못된 코드
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:via-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 mt-4"
                  disabled={register.isPending}
                  data-testid="button-modal-register"
                >
                  {register.isPending ? "가입 중..." : "회원가입"}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
                이미 계정이 있으신가요?{" "}
                <button 
                  className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
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
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <History className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">거래내역</h2>
                <p className="text-gray-400 text-sm">나의 거래 기록과 잔고를 확인하세요</p>
              </div>

              {/* Balance Card */}
              <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-orange-500" />
                    <span className="text-gray-300">보유 잔고</span>
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
                          <span className={`text-xs px-2 py-0.5 rounded ${bet.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {bet.direction === 'long' ? 'LONG' : 'SHORT'}
                          </span>
                          <span className="text-white font-medium">{bet.symbol}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(bet.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {Number(bet.amount).toLocaleString()}원
                        </div>
                        <div className={`text-xs ${bet.outcome === 'win' ? 'text-green-400' : bet.outcome === 'lose' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {bet.outcome === 'win' ? '승리' : bet.outcome === 'lose' ? '패배' : '진행중'}
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
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
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

      {/* Deposit/Withdrawal Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">입출금 신청</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowDepositModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Wallet className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">입출금 신청</h2>
                <p className="text-gray-400 text-sm">입금 또는 출금을 신청하세요</p>
              </div>

              {/* Current Balance */}
              <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">현재 잔고</span>
                  <span className="text-2xl font-bold text-white">
                    {balanceData?.balance ? Number(balanceData.balance).toLocaleString() : '0'}원
                  </span>
                </div>
              </div>

              {/* Transaction Type Tabs */}
              <div className="flex mb-6">
                <button
                  onClick={() => setTransactionType('deposit')}
                  className={`flex-1 py-3 text-center font-bold rounded-l-lg transition-colors ${
                    transactionType === 'deposit'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                  data-testid="tab-deposit"
                >
                  입금 신청
                </button>
                <button
                  onClick={() => setTransactionType('withdrawal')}
                  className={`flex-1 py-3 text-center font-bold rounded-r-lg transition-colors ${
                    transactionType === 'withdrawal'
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                  data-testid="tab-withdrawal"
                >
                  출금 신청
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    {transactionType === 'deposit' ? '입금 금액' : '출금 금액'}
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={transactionAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setTransactionAmount(value);
                      }}
                      placeholder="금액을 입력하세요"
                      className="bg-white/10 border-white/20 text-white pr-12"
                      data-testid="input-transaction-amount"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">원</span>
                  </div>
                  {transactionAmount && (
                    <p className="text-gray-400 text-sm mt-1">
                      {Number(transactionAmount).toLocaleString()}원
                    </p>
                  )}
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 50000, 100000, 500000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTransactionAmount(String(Number(transactionAmount || 0) + amount))}
                      className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded transition-colors"
                    >
                      +{(amount / 10000)}만
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTransactionAmount(String(Number(transactionAmount || 0) + 1000000))}
                    className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded transition-colors"
                  >
                    +100만
                  </button>
                  <button
                    onClick={() => setTransactionAmount('')}
                    className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded transition-colors"
                  >
                    초기화
                  </button>
                </div>

                {transactionType === 'withdrawal' && Number(transactionAmount) > Number(balanceData?.balance || 0) && (
                  <p className="text-red-400 text-sm">잔액을 초과할 수 없습니다</p>
                )}

                {transactionType === 'deposit' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-sm">
                      입금 신청 후 고객센터에서 입금 계좌 정보를 안내해드립니다.
                    </p>
                  </div>
                )}

                {transactionType === 'withdrawal' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-400 text-sm">
                      출금은 가입 시 등록한 계좌로 처리됩니다. 처리까지 약 30분 소요됩니다.
                    </p>
                  </div>
                )}
              </div>

              <Button
                className={`w-full mt-6 text-white ${
                  transactionType === 'deposit'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                disabled={
                  transactionSubmitting ||
                  !transactionAmount ||
                  Number(transactionAmount) <= 0 ||
                  (transactionType === 'withdrawal' && Number(transactionAmount) > Number(balanceData?.balance || 0))
                }
                onClick={async () => {
                  if (!transactionAmount || Number(transactionAmount) <= 0) {
                    toast.error('금액을 입력해주세요');
                    return;
                  }
                  
                  setTransactionSubmitting(true);
                  try {
                    const response = await fetch('/api/transactions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: transactionType,
                        amount: transactionAmount,
                      }),
                    });
                    
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.error || '요청에 실패했습니다');
                    }
                    
                    toast.success(
                      transactionType === 'deposit'
                        ? '입금 신청이 완료되었습니다. 관리자 승인 후 잔고에 반영됩니다.'
                        : '출금 신청이 완료되었습니다. 처리까지 약 30분 소요됩니다.'
                    );
                    setShowDepositModal(false);
                    setTransactionAmount('');
                  } catch (error: any) {
                    toast.error(error.message || '요청에 실패했습니다');
                  } finally {
                    setTransactionSubmitting(false);
                  }
                }}
                data-testid="button-submit-transaction"
              >
                {transactionSubmitting ? '처리중...' : (transactionType === 'deposit' ? '입금 신청하기' : '출금 신청하기')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Service Modal - Telegram Only */}
      <Dialog open={showCustomerServiceModal} onOpenChange={setShowCustomerServiceModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">고객센터</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button 
                onClick={() => setShowCustomerServiceModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Headphones className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">고객센터</h2>
                <p className="text-gray-400 text-sm">24시간 전문 상담원이 도와드립니다</p>
              </div>

              <div className="space-y-3">
                {/* 1:1 입금 문의 */}
                <a 
                  href={telegramData?.telegramLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-colors cursor-pointer text-left"
                  onClick={(e) => {
                    if (!telegramData?.telegramLink) {
                      e.preventDefault();
                      toast.error("텔레그램 링크가 설정되지 않았습니다");
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">1:1 입금 문의</h3>
                      <p className="text-green-400 text-sm">입금 계좌 안내 및 입금 확인</p>
                      <p className="text-gray-400 text-xs">빠른 처리 보장</p>
                    </div>
                    <div className="text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>

                {/* 일반 텔레그램 문의 */}
                <a 
                  href={telegramData?.telegramLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    if (!telegramData?.telegramLink) {
                      e.preventDefault();
                      toast.error("텔레그램 링크가 설정되지 않았습니다");
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">일반 문의</h3>
                      <p className="text-blue-500 font-bold">@investkorea</p>
                      <p className="text-gray-400 text-xs">24시간 운영</p>
                    </div>
                    <div className="text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-center text-sm text-gray-300">
                  <span className="text-green-500 font-bold">입금 문의</span>를 클릭하여 계좌 안내를 받으세요
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements Modal */}
      <Dialog open={showAnnouncementsModal} onOpenChange={setShowAnnouncementsModal}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">공지사항</DialogTitle>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => setShowAnnouncementsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Bell className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">공지사항</h2>
                <p className="text-gray-400 text-sm">중요한 안내사항을 확인하세요</p>
              </div>

              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">등록된 공지사항이 없습니다</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        {ann.isPinned && (
                          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 rounded text-xs font-medium">고정</span>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-2">{ann.title}</h3>
                          <p className="text-gray-400 text-sm whitespace-pre-wrap">{ann.content}</p>
                          <p className="text-gray-500 text-xs mt-2">
                            {new Date(ann.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
