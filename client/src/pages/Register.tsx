import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-auth";
import { TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";

function BitcoinCoin() {
  return (
    <div className="relative w-40 h-40 md:w-56 md:h-56">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-2xl shadow-yellow-500/30 animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-inner" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
        <div className="absolute inset-0 rounded-full opacity-30" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
        }} />
        <span className="text-5xl md:text-7xl font-bold text-yellow-900/80 drop-shadow-lg" style={{ fontFamily: 'serif' }}>₿</span>
      </div>
      <div className="absolute inset-0 rounded-full" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
      }} />
      <div className="absolute -inset-4 rounded-full opacity-50 blur-xl bg-gradient-to-r from-yellow-400/50 to-amber-500/50" />
    </div>
  );
}

function NetworkMesh() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden opacity-30">
      <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="meshGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="url(#meshGradient2)" strokeWidth="0.5" fill="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <path
              key={i}
              d={`M${i * 45} 200 Q${i * 45 + 22} ${150 + Math.sin(i) * 30} ${i * 45 + 45} 200`}
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '2s' }}
            />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={180 - i * 12}
              x2="800"
              y2={180 - i * 12 + Math.sin(i) * 10}
              opacity={1 - i * 0.06}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400/30 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.length < 3) {
      toast.error("아이디는 3자 이상이어야 합니다");
      return;
    }

    if (password.length < 4) {
      toast.error("비밀번호는 4자 이상이어야 합니다");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    register.mutate({ username, password });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-transparent to-transparent" />
      
      <NetworkMesh />
      <FloatingParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6">
        <div className="flex flex-col items-center text-center lg:text-left">
          <BitcoinCoin />
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                명인FX
              </h1>
            </div>
            <p className="text-gray-400 text-lg">프리미엄 바이너리 옵션 트레이딩</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              
              <h2 className="text-2xl font-bold text-center mb-2 text-white">회원가입</h2>
              <p className="text-gray-400 text-center text-sm mb-6">지금 가입하고 거래를 시작하세요</p>
              
              <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">신규 가입 보너스</p>
                    <p className="text-emerald-300/70 text-xs">1,000만원 데모 잔고 즉시 지급</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">아이디</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요 (3자 이상)"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
                    data-testid="input-username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">비밀번호</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요 (4자 이상)"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
                    data-testid="input-password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">비밀번호 확인</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
                    data-testid="input-confirm-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 text-black shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:shadow-yellow-500/40 hover:scale-[1.02]"
                  disabled={register.isPending}
                  data-testid="button-register"
                >
                  {register.isPending ? "가입 중..." : "회원가입"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                  로그인
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              실시간 거래
            </span>
            <span>|</span>
            <span>24시간 운영</span>
            <span>|</span>
            <span>1.90x 배당</span>
          </div>
        </div>
      </div>
    </div>
  );
}
