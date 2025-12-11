import { Search, Globe, Bell, Menu, DollarSign, Droplets, Coins, TrendingUp } from "lucide-react";

interface NavbarProps {
  onSelectSymbol?: (symbol: string) => void;
  selectedSymbol?: string;
}

export function Navbar({ onSelectSymbol, selectedSymbol }: NavbarProps) {
  const quickAssets = [
    { symbol: 'USD/KRW', label: '달러', icon: DollarSign },
    { symbol: 'WTI', label: '오일', icon: Droplets },
    { symbol: 'XAU/USD', label: '금', icon: Coins },
    { symbol: 'HSI', label: '항생', icon: TrendingUp },
  ];

  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-6">
        <a href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-90 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary fill-current">
            <path d="M12 0L3 9L12 18L21 9L12 0ZM12 24L21 15L12 6L3 15L12 24Z" />
          </svg>
          <span className="hidden sm:inline-block tracking-tight text-foreground">BINANCE</span>
        </a>
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {quickAssets.map(asset => (
            <button
              key={asset.symbol}
              onClick={() => onSelectSymbol?.(asset.symbol)}
              data-testid={`nav-asset-${asset.symbol}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                selectedSymbol === asset.symbol 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <asset.icon className="h-4 w-4" />
              <span>{asset.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden lg:flex items-center relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="코인, 페어 검색" 
            className="h-9 w-64 rounded-full bg-background pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50 border border-transparent focus:border-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-3 text-muted-foreground">
          <button className="p-2 hover:text-foreground hover:bg-muted/20 rounded-md transition-colors">
            <Globe className="h-5 w-5" />
          </button>
          <button className="p-2 hover:text-foreground hover:bg-muted/20 rounded-md transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-4 w-[1px] bg-border mx-1"></div>
          <button className="hidden sm:flex text-sm font-medium hover:text-primary transition-colors">로그인</button>
          <button className="hidden sm:flex bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold hover:brightness-110 transition-all">회원가입</button>
          <button className="md:hidden p-2 hover:text-foreground">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
