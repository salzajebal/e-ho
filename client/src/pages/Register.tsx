import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-auth";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import bgImage from "@assets/generated_images/bitcoin_with_trading_chart.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KOREAN_BANKS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "SC제일은행",
  "한국씨티은행",
  "케이뱅크",
  "카카오뱅크",
  "토스뱅크",
  "NH농협은행",
  "IBK기업은행",
  "KDB산업은행",
  "수협은행",
  "대구은행",
  "부산은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "제주은행",
];

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
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

    register.mutate({ username, password, name, phone, bankName, accountHolder, accountNumber });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-[0.15em] text-white mb-3">
              명인<span className="text-yellow-400">FX</span>
            </h1>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-4" />
            <p className="text-gray-400 text-sm tracking-[0.3em] uppercase">Premium Binary Options Trading</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 shadow-2xl">
              
              <h2 className="text-xl font-bold text-center mb-2 text-white">회원가입</h2>
              <p className="text-gray-400 text-center text-sm mb-4">지금 가입하고 거래를 시작하세요</p>
              
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">신규 가입 보너스</p>
                    <p className="text-emerald-300/70 text-xs">1,000만원 데모 잔고 즉시 지급</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">아이디</label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="아이디 (3자 이상)"
                      className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                      data-testid="input-username"
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
                      className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                      data-testid="input-name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">비밀번호</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="4자 이상"
                      className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                      data-testid="input-password"
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
                      className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                      data-testid="input-confirm-password"
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
                    className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                    data-testid="input-phone"
                    required
                  />
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">출금 계좌 정보</p>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-medium">은행 선택</label>
                      <Select value={bankName} onValueChange={setBankName}>
                        <SelectTrigger className="h-10 bg-white/10 border-white/20 text-white text-sm">
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
                          className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                          data-testid="input-account-holder"
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
                          className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-yellow-500/50 text-sm"
                          data-testid="input-account-number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 text-black shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:shadow-yellow-500/40 hover:scale-[1.02] mt-4"
                  disabled={register.isPending}
                  data-testid="button-register"
                >
                  {register.isPending ? "가입 중..." : "회원가입"}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                  로그인
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
