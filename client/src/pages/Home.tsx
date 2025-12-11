import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/dashboard/Ticker";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { BettingForm } from "@/components/dashboard/BettingForm";
import { BetsPanel } from "@/components/dashboard/BetsPanel";
import { useMarketData } from "@/lib/marketData";
import { useBets, useCreateBet, useSettleBet, useUserBalance } from "@/hooks/use-bets";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const marketData = useMarketData();
  
  const { data: bets = [] } = useBets();
  const createBet = useCreateBet();
  const settleBet = useSettleBet();
  const { data: balanceData } = useUserBalance();

  const currentMarket = marketData.find(m => m.symbol === selectedSymbol) || marketData[0];

  const currentPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    marketData.forEach(m => {
      prices[m.symbol] = m.price;
    });
    return prices;
  }, [marketData]);

  const handleBet = (direction: 'long' | 'short', amount: number, duration: number) => {
    createBet.mutate({
      symbol: selectedSymbol,
      direction,
      amount,
      duration,
      strikePrice: currentMarket.price,
      multiplier: 1.90,
    });
  };

  const handleBetExpire = (bet: any, currentPrice: number) => {
    settleBet.mutate({
      id: bet.id,
      closePrice: currentPrice,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Navbar onSelectSymbol={setSelectedSymbol} selectedSymbol={selectedSymbol} />
      <Ticker data={marketData} />
      
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Market List */}
        <div className="hidden xl:flex flex-col border-r border-border">
           <MarketOverview 
             data={marketData} 
             onSelect={setSelectedSymbol} 
             selectedSymbol={selectedSymbol} 
           />
        </div>

        {/* Center: Chart + Bets */}
        <div className="flex-1 flex flex-col min-w-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full border-b border-border">
                <PriceChart symbol={selectedSymbol} data={currentMarket} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full">
                <BetsPanel 
                  bets={bets} 
                  currentPrices={currentPrices}
                  onBetExpire={handleBetExpire}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right: Betting Form */}
        <div className="flex flex-col border-l border-border w-[320px] shrink-0">
          <BettingForm 
            currentPrice={currentMarket.price} 
            symbol={selectedSymbol}
            onBet={handleBet}
            balance={balanceData?.balance}
          />
        </div>
      </main>
      
      {/* Footer */}
      <div className="h-6 bg-card border-t border-border flex items-center px-4 text-[10px] text-muted-foreground justify-between">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-up animate-pulse"></span> 실시간 데이터 연결됨</span>
          <span>배당률: 1.90x</span>
        </div>
        <div className="flex items-center gap-2">
          <span>잔고: {balanceData?.balance ? parseFloat(balanceData.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USDT</span>
        </div>
      </div>
    </div>
  );
}
