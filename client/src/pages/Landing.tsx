import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Shield, Zap, Headphones, TrendingUp, Lock, Award, X } from "lucide-react";
import { useLogin } from "@/hooks/use-auth";

interface LandingMarketData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  priceHistory: number[];
}

function useLandingMarketData() {
  const [markets, setMarkets] = useState<LandingMarketData[]>([
    { symbol: "NDX", name: "NASDAQ 100", price: 21453.20, changePercent: 0.51, priceHistory: [] },
    { symbol: "SP500", name: "S&P 500", price: 6051.09, changePercent: 0.57, priceHistory: [] },
  ]);
  
  const historyRef = useRef<Record<string, number[]>>({
    "NDX": [],
    "SP500": [],
  });

  useEffect(() => {
    // Initialize price history with some variation
    ["NDX", "SP500"].forEach(symbol => {
      const basePrice = markets.find(m => m.symbol === symbol)?.price || 100;
      const history: number[] = [];
      let price = basePrice * 0.995;
      for (let i = 0; i < 20; i++) {
        price = price + (Math.random() - 0.45) * price * 0.002;
        history.push(price);
      }
      historyRef.current[symbol] = history;
    });
    
    setMarkets(prev => prev.map(m => ({
      ...m,
      priceHistory: [...historyRef.current[m.symbol]]
    })));

    // Simulate NASDAQ and S&P 500 updates
    const simInterval = setInterval(() => {
      setMarkets(prev => prev.map(m => {
        if (m.symbol === 'NDX' || m.symbol === 'SP500') {
          const volatility = 0.0003;
          const change = m.price * volatility * (Math.random() - 0.48);
          const newPrice = m.price + change;
          
          historyRef.current[m.symbol] = [...historyRef.current[m.symbol].slice(-19), newPrice];
          
          return {
            ...m,
            price: newPrice,
            changePercent: m.changePercent + (Math.random() - 0.5) * 0.01,
            priceHistory: [...historyRef.current[m.symbol]]
          };
        }
        return m;
      }));
    }, 1000);

    return () => {
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const marketData = useLandingMarketData();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" data-testid="link-logo">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Invest Korea Logo" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-wide">
                    <span className="text-white">INVEST</span>
                    <span className="text-orange-500 ml-1">KOREA</span>
                  </span>
                  <span className="text-[10px] text-gray-400 tracking-widest uppercase">Premium Trading</span>
                </div>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/trade" className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" data-testid="nav-options-trading">
                옵션거래
              </Link>
              <Link href="/trade" className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" data-testid="nav-trade-history">
                거래내역
              </Link>
              <Link href="/trade" className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" data-testid="nav-deposit-withdraw">
                입출금
              </Link>
              <a href="#" className="text-gray-300 hover:text-orange-500 transition-colors text-sm font-medium" data-testid="nav-customer-service">
                고객센터
              </a>
            </nav>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white hover:bg-white/10" 
              data-testid="button-header-login"
              onClick={() => setShowLoginModal(true)}
            >
              로그인
            </Button>
            <Link href="/register">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold" data-testid="button-header-register">
                회원가입
              </Button>
            </Link>
          </div>
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
            <Link href="/trade">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-6 text-lg rounded-lg"
                data-testid="button-trade"
              >
                거래하기
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-lg"
                data-testid="button-register"
              >
                회원가입
              </Button>
            </Link>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.map((item, index) => {
              const isPositive = item.changePercent >= 0;
              const chartPath = generateSparklinePath(item.priceHistory);
              const formattedPrice = item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const formattedChange = `${isPositive ? '+' : ''}${item.changePercent.toFixed(2)}%`;
              
              return (
                <div 
                  key={item.symbol}
                  className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-xl p-5 hover:border-orange-500/50 transition-all cursor-pointer group"
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

      {/* CTA Section */}
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
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-trade-btc">BTC 거래</Link></li>
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-trade-eth">ETH 거래</Link></li>
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-trade-nasdaq">NASDAQ 거래</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">입출금</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-deposit">입금신청</Link></li>
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-withdraw">출금신청</Link></li>
                <li><Link href="/trade" className="hover:text-orange-500 transition-colors" data-testid="link-transaction-history">입출금내역</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">고객센터</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors" data-testid="link-notice">공지사항</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors" data-testid="link-inquiry">1:1문의</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors" data-testid="link-terms">이용약관</a></li>
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
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-[#1a1a24]/95 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
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
                <Link 
                  href="/register" 
                  className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
                  onClick={() => setShowLoginModal(false)}
                >
                  회원가입
                </Link>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  실시간 거래
                </span>
                <span>|</span>
                <span>24시간 운영</span>
                <span>|</span>
                <span>1.90x 배당</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
