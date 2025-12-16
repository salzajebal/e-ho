import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Headphones, TrendingUp, Lock, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" data-testid="link-logo">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">
                  <span className="text-white">명인</span>
                  <span className="text-yellow-500">FX</span>
                </span>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/trade" className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium" data-testid="nav-options-trading">
                옵션거래
              </Link>
              <Link href="/trade" className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium" data-testid="nav-trade-history">
                거래내역
              </Link>
              <Link href="/trade" className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium" data-testid="nav-deposit-withdraw">
                입출금
              </Link>
              <a href="#" className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium" data-testid="nav-customer-service">
                고객센터
              </a>
            </nav>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" data-testid="button-header-login">
                로그인
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" data-testid="button-header-register">
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
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-2">
              <span className="text-white">명인</span>
              <span className="text-yellow-500">FX</span>
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
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-6 text-lg rounded-lg"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Bitcoin", symbol: "BTC/USDT", change: "+2.34%", positive: true },
              { name: "Ethereum", symbol: "ETH/USDT", change: "+1.87%", positive: true },
              { name: "NASDAQ 100", symbol: "NDX", change: "+0.51%", positive: true },
              { name: "S&P 500", symbol: "SP500", change: "+0.57%", positive: true },
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-[#1a1a24] border border-white/10 rounded-xl p-6 hover:border-yellow-500/50 transition-colors"
                data-testid={`card-market-${index}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.symbol}</p>
                  </div>
                </div>
                <div className={`text-xl font-bold ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {item.change}
                </div>
              </div>
            ))}
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
            명인FX에 가입하고<br />지금 바로 시작해보세요
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            당신의 첫 옵션 거래,<br />
            믿을 수 있는 명인FX에서 시작하세요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-lg"
                data-testid="button-login-cta"
              >
                로그인
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-6 text-lg rounded-lg"
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
              <h3 className="text-xl font-bold mb-4">
                <span className="text-white">명인</span>
                <span className="text-yellow-500">FX</span>
              </h3>
              <p className="text-gray-500 text-sm">
                안전하고 투명한 시스템으로<br />
                빠르고 편리한 옵션 거래를 제공합니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">옵션거래</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><Link href="/trade" className="hover:text-yellow-500 transition-colors" data-testid="link-trade-btc">BTC 거래</Link></li>
                <li><Link href="/trade" className="hover:text-yellow-500 transition-colors" data-testid="link-trade-eth">ETH 거래</Link></li>
                <li><Link href="/trade" className="hover:text-yellow-500 transition-colors" data-testid="link-trade-nasdaq">NASDAQ 거래</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">입출금</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><Link href="/trade" className="hover:text-yellow-500 transition-colors" data-testid="link-deposit">입금신청</Link></li>
                <li><Link href="/trade" className="hover:text-yellow-500 transition-colors" data-testid="link-withdraw">출금신청</Link></li>
                <li><Link href="/trade" className="hover:text-yellow-500 transition-colors" data-testid="link-transaction-history">입출금내역</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">고객센터</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-yellow-500 transition-colors" data-testid="link-notice">공지사항</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition-colors" data-testid="link-inquiry">1:1문의</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition-colors" data-testid="link-terms">이용약관</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 text-center text-gray-600 text-sm">
            <p>© 2024 명인FX Trade International, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
