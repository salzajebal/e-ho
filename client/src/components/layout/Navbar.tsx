import { Link, useLocation } from "wouter";
import { Menu, LogOut, Shield, ChevronDown, Sun, Moon, Wallet, History, ArrowDownCircle, ArrowUpCircle, Bell, Headphones, MessageSquare } from "lucide-react";
import { LearnInvestLogo } from "@/components/LearnInvestLogo";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TRADING_GAMES } from "@/lib/tradingGames";
import { SymbolIcon } from "@/components/SymbolIcon";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { useUserBalance } from "@/hooks/use-bets";

interface NavbarProps {
  onSelectGame?: (gameId: string) => void;
  selectedGameId?: string;
}

export function Navbar({ onSelectGame, selectedGameId }: NavbarProps) {
  const { data: user } = useAuth();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: balanceData } = useUserBalance();
  const [, setLocation] = useLocation();

  const goTo = (tab: string) => {
    setLocation(`/?tab=${tab}`);
  };

  const goToAndClose = (tab: string) => {
    setMobileMenuOpen(false);
    setLocation(`/?tab=${tab}`);
  };
  
  const selectedGame = TRADING_GAMES.find(g => g.id === selectedGameId);
  const displayBalance = balanceData?.balance != null
    ? Math.floor(parseFloat(balanceData.balance))
    : user?.balance != null
      ? Math.floor(parseFloat(user.balance))
      : null;

  const mobileNavLinks = [
    { label: '거래내역', tab: 'history', icon: <History className="w-4 h-4" /> },
    { label: '입금신청', tab: 'deposit', icon: <ArrowDownCircle className="w-4 h-4 text-up" /> },
    { label: '출금신청', tab: 'withdraw', icon: <ArrowUpCircle className="w-4 h-4 text-down" /> },
    { label: '공지사항', tab: 'notice', icon: <Bell className="w-4 h-4" /> },
    { label: '고객센터', tab: 'cs', icon: <Headphones className="w-4 h-4" /> },
    { label: '쪽지함', tab: 'messages', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <header className="flex h-14 lg:h-16 items-center border-b border-border bg-card px-3 lg:px-6">
      <div className="flex items-center gap-2 lg:gap-6 flex-1 min-w-0">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
          <LearnInvestLogo variant="full" height={34} dark={theme === 'dark'} />
        </Link>
        
        {/* Mobile: Current game dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-1 text-xs h-8 px-2">
              {selectedGame && <SymbolIcon symbol={selectedGame.symbol} size={14} />}
              <span className="max-w-[60px] truncate">{selectedGame?.label || '종목선택'}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {TRADING_GAMES.map(game => (
              <DropdownMenuItem
                key={game.id}
                onClick={() => onSelectGame?.(game.id)}
                className={cn(
                  "cursor-pointer gap-2",
                  selectedGameId === game.id && "bg-primary/10 text-primary"
                )}
              >
                <SymbolIcon symbol={game.symbol} size={16} />
                {game.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Desktop: Game tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {TRADING_GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => onSelectGame?.(game.id)}
              data-testid={`nav-game-${game.id}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs",
                selectedGameId === game.id 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <SymbolIcon symbol={game.symbol} size={16} />
              <span className="font-medium">{game.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop: Page navigation links */}
      {user && (
        <nav className="hidden lg:flex items-center gap-1 border-l border-border pl-4 ml-2 shrink-0">
          {[
            { label: '거래내역', tab: 'history' },
            { label: '입금신청', tab: 'deposit' },
            { label: '출금신청', tab: 'withdraw' },
            { label: '공지사항', tab: 'notice' },
            { label: '고객센터', tab: 'cs' },
            { label: '쪽지함', tab: 'messages' },
          ].map(({ label, tab }) => (
            <button
              key={tab}
              onClick={() => goTo(tab)}
              className="text-muted-foreground hover:text-amber-500 transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-muted/30 whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 ml-auto">
        {/* Balance Badge */}
        {user && displayBalance !== null && (
          <div
            data-testid="text-navbar-balance"
            className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 rounded-lg bg-primary/10 border border-primary/20"
          >
            <Wallet className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-primary shrink-0" />
            <span className="hidden lg:inline text-xs text-primary/70">보유금액</span>
            <span className="text-xs lg:text-sm font-bold font-mono text-primary">
              <span className="hidden sm:inline">₩</span>{displayBalance.toLocaleString()}
              <span className="hidden lg:inline">원</span>
            </span>
          </div>
        )}

        {/* Theme Toggle — desktop only (in mobile sheet) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
          className="hidden lg:flex w-8 h-8 p-0"
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Desktop: User dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden lg:flex gap-1 lg:gap-2 font-medium px-2 lg:px-3">
                <span className="text-foreground text-xs lg:text-sm max-w-[60px] lg:max-w-none truncate">{user.username}</span>
                {user.role === 'admin' && (
                  <Shield className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  보유금액: {Math.floor(parseFloat(user.balance)).toLocaleString()}원
                </p>
                {(user as any).grade && (
                  <p className="text-xs text-primary font-medium mt-0.5">
                    등급: {(user as any).grade}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              {user.role === 'admin' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4" />
                      관리자 패널
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={() => logout.mutate()}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Mobile: Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden w-9 h-9 p-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] flex flex-col p-0">
            <SheetHeader className="px-4 pt-5 pb-4 border-b border-border">
              <SheetTitle className="text-left">
                <LearnInvestLogo variant="full" height={30} dark={theme === 'dark'} />
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* User info */}
              {user ? (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{user.username}</span>
                    {user.role === 'admin' && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Shield className="w-3 h-3" />관리자
                      </span>
                    )}
                  </div>
                  {(user as any).grade && (
                    <p className="text-xs text-primary font-medium">등급: {(user as any).grade}</p>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-primary/70">보유금액</span>
                    <span className="font-bold font-mono text-sm text-primary ml-auto">
                      ₩{displayBalance?.toLocaleString() ?? '0'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-xl"
                    onClick={() => { setMobileMenuOpen(false); setLocation('/?tab=login'); }}
                  >
                    로그인
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => { setMobileMenuOpen(false); setLocation('/?tab=register'); }}
                  >
                    회원가입
                  </Button>
                </div>
              )}

              {/* Symbol selection */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">거래 종목</p>
                <div className="flex flex-col gap-1">
                  {TRADING_GAMES.map(game => (
                    <button
                      key={game.id}
                      onClick={() => { onSelectGame?.(game.id); setMobileMenuOpen(false); }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                        selectedGameId === game.id
                          ? 'bg-primary/20 text-primary'
                          : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <SymbolIcon symbol={game.symbol} size={22} />
                      <span>{game.label}</span>
                      {selectedGameId === game.id && (
                        <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">선택중</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nav links */}
              {user && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">메뉴</p>
                  <div className="flex flex-col gap-0.5">
                    {mobileNavLinks.map(({ label, tab, icon }) => (
                      <button
                        key={tab}
                        onClick={() => goToAndClose(tab)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-colors text-left"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setMobileMenuOpen(false); setLocation('/admin'); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors text-left"
                      >
                        <Shield className="w-4 h-4" />
                        관리자 패널
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="px-4 py-4 border-t border-border space-y-2">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? '라이트 모드' : '다크 모드'}
              </button>
              {user && (
                <button
                  onClick={() => { logout.mutate(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
