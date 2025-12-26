import { Link } from "wouter";
import { Menu, LogOut, Shield, Clock, ChevronDown } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface NavbarProps {
  onSelectGame?: (gameId: string) => void;
  selectedGameId?: string;
}

export function Navbar({ onSelectGame, selectedGameId }: NavbarProps) {
  const { data: user } = useAuth();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const selectedGame = TRADING_GAMES.find(g => g.id === selectedGameId);

  return (
    <header className="flex h-14 lg:h-16 items-center border-b border-border bg-card px-3 lg:px-6">
      <div className="flex items-center gap-2 lg:gap-6 flex-1 min-w-0">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg lg:text-xl hover:opacity-90 transition-opacity shrink-0">
          <img 
            src="/logo.png?v=3" 
            alt="Coinone Logo" 
            className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg object-cover"
          />
          <div className="hidden sm:flex items-center tracking-tight">
            <span className="text-primary font-bold">COINONE</span>
          </div>
        </Link>
        
        {/* Mobile: Current game dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-1 text-xs h-8 px-2">
              <span className="max-w-[80px] truncate">{selectedGame?.label || '종목선택'}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {TRADING_GAMES.map(game => (
              <DropdownMenuItem
                key={game.id}
                onClick={() => onSelectGame?.(game.id)}
                className={cn(
                  "cursor-pointer",
                  selectedGameId === game.id && "bg-primary/10 text-primary"
                )}
              >
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
              <span className="font-medium">{game.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 lg:gap-2 font-medium px-2 lg:px-3">
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
                  잔고: {Math.floor(parseFloat(user.balance)).toLocaleString()}원
                </p>
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
                className="text-down cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs lg:text-sm font-medium hover:text-primary transition-colors px-2 lg:px-3">
                로그인
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary text-primary-foreground px-2 lg:px-4 py-1 lg:py-1.5 rounded-md text-xs lg:text-sm font-semibold hover:brightness-110 transition-all">
                회원가입
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
