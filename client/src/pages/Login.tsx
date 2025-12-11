import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-auth";
import { TrendingUp } from "lucide-react";
import bgImage from "@assets/stock_images/bitcoin_cryptocurren_a6d34b3a.jpg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <TrendingUp className="w-10 h-10 text-yellow-500" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                명인FX
              </h1>
            </div>
            <p className="text-gray-300 text-lg">프리미엄 바이너리 옵션 트레이딩</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl p-8 shadow-2xl">
              
              <h2 className="text-2xl font-bold text-center mb-2 text-white">로그인</h2>
              <p className="text-gray-400 text-center text-sm mb-8">계정에 접속하여 거래를 시작하세요</p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">아이디</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
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
                    placeholder="비밀번호를 입력하세요"
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all"
                    data-testid="input-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 text-black shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:shadow-yellow-500/40 hover:scale-[1.02]"
                  disabled={login.isPending}
                  data-testid="button-login"
                >
                  {login.isPending ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
                계정이 없으신가요?{" "}
                <Link href="/register" className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                  회원가입
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
