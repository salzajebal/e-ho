import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-auth";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import bgImage from "@assets/generated_images/bitcoin_with_trading_chart.png";

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
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold tracking-[0.15em] text-white mb-3">
              명인<span className="text-yellow-400">FX</span>
            </h1>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-4" />
            <p className="text-gray-400 text-sm tracking-[0.3em] uppercase">Premium Binary Options Trading</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl p-8 shadow-2xl">
              
              <h2 className="text-2xl font-bold text-center mb-2 text-white">회원가입</h2>
              <p className="text-gray-400 text-center text-sm mb-6">지금 가입하고 거래를 시작하세요</p>
              
              <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
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
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">아이디</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요 (3자 이상)"
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
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
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
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
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
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

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
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
