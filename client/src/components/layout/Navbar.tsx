import { Link } from "wouter";
import { Menu, LogOut, Shield, Clock } from "lucide-react";
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

interface NavbarProps {
  onSelectGame?: (gameId: string) => void;
  selectedGameId?: string;
}

export function Navbar({ onSelectGame, selectedGameId }: NavbarProps) {
  const { data: user } = useAuth();
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-90 transition-opacity">
          <img 
            src="/logo.png" 
            alt="Invest Korea Logo" 
            className="w-8 h-8 rounded-lg object-cover"
          />
          <div className="hidden sm:flex items-center tracking-tight">
            <span className="text-foreground">INVEST</span>
            <span className="text-orange-500 ml-1">KOREA</span>
          </div>
        </Link>
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

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 font-medium">
                  <span className="text-foreground">{user.username}</span>
                  {user.role === 'admin' && (
                    <Shield className="w-4 h-4 text-primary" />
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
                <Button variant="ghost" className="hidden sm:flex text-sm font-medium hover:text-primary transition-colors">
                  로그인
                </Button>
              </Link>
              <Link href="/register">
                <Button className="hidden sm:flex bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold hover:brightness-110 transition-all">
                  회원가입
                </Button>
              </Link>
            </>
          )}
          <button className="lg:hidden p-2 hover:text-foreground">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
