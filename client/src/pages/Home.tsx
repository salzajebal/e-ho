import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/dashboard/Ticker";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { OrderBook } from "@/components/dashboard/OrderBook";
import { TradeHistory } from "@/components/dashboard/TradeHistory";
import { OrderForm } from "@/components/dashboard/OrderForm";
import { PositionsPanel, Position } from "@/components/dashboard/PositionsPanel";
import { INITIAL_MARKET_DATA, MarketData } from "@/lib/mockData";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [marketData, setMarketData] = useState<MarketData[]>(INITIAL_MARKET_DATA);
  const [positions, setPositions] = useState<Position[]>([]);

  // Real-time price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => {
        const volatility = 0.0003; // increased volatility
        const change = item.price * volatility * (Math.random() - 0.5);
        const newPrice = item.price + change;
        return {
          ...item,
          price: newPrice,
          change: item.change + change,
          changePercent: ((item.change + change) / (item.price - item.change)) * 100
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update positions PnL
  useEffect(() => {
    setPositions(prev => prev.map(pos => {
      const currentMarket = marketData.find(m => m.symbol === pos.symbol);
      if (!currentMarket) return pos;

      const priceDiff = currentMarket.price - pos.entryPrice;
      const pnlRaw = pos.side === 'long' ? priceDiff : -priceDiff;
      const sizeInUnits = pos.size / pos.entryPrice; // approximate
      const pnl = sizeInUnits * pnlRaw;
      const pnlPercent = (pnl / pos.margin) * 100;

      return {
        ...pos,
        markPrice: currentMarket.price,
        pnl,
        pnlPercent
      };
    }));
  }, [marketData]);

  const currentMarket = marketData.find(m => m.symbol === selectedSymbol) || marketData[0];

  const handleOrder = (type: 'long' | 'short', amount: number, leverage: number) => {
    const newPosition: Position = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      side: type,
      size: amount * leverage,
      leverage,
      entryPrice: currentMarket.price,
      markPrice: currentMarket.price,
      liquidationPrice: type === 'long' 
        ? currentMarket.price * (1 - 1/leverage) 
        : currentMarket.price * (1 + 1/leverage),
      margin: amount,
      pnl: 0,
      pnlPercent: 0
    };
    setPositions(prev => [newPosition, ...prev]);
  };

  const handleClosePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Navbar />
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

        {/* Center: Chart + Positions */}
        <div className="flex-1 flex flex-col min-w-0">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="h-full border-b border-border">
                <PriceChart symbol={selectedSymbol} data={currentMarket} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={35} minSize={20}>
              <div className="h-full">
                <PositionsPanel positions={positions} onClosePosition={handleClosePosition} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right: Order Book + Trades + Order Form */}
        <div className="flex flex-col border-l border-border w-[320px] shrink-0">
          <ResizablePanelGroup direction="vertical">
             <ResizablePanel defaultSize={50} minSize={30} className="hidden lg:block">
               <OrderBook currentPrice={currentMarket.price} />
             </ResizablePanel>
             
             <ResizableHandle className="hidden lg:flex" />
             
             <ResizablePanel defaultSize={50} minSize={40}>
               <OrderForm 
                 currentPrice={currentMarket.price} 
                 symbol={selectedSymbol}
                 onOrder={handleOrder}
               />
             </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
      
      {/* Footer */}
      <div className="h-6 bg-card border-t border-border flex items-center px-4 text-[10px] text-muted-foreground justify-between">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-up"></span> 실시간 연결됨</span>
          <span>지연시간: 14ms</span>
        </div>
        <div>
          모의 거래 환경
        </div>
      </div>
    </div>
  );
}
