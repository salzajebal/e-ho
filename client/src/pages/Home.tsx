import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/dashboard/Ticker";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { OrderBook } from "@/components/dashboard/OrderBook";
import { OrderForm } from "@/components/dashboard/OrderForm";
import { PositionsPanel } from "@/components/dashboard/PositionsPanel";
import { useMarketData, INITIAL_MARKET_DATA } from "@/lib/marketData";
import { usePositions, useCreatePosition, useClosePosition, useUserBalance } from "@/hooks/use-positions";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const marketData = useMarketData();
  
  // Fetch real positions from backend
  const { data: positions = [] } = usePositions();
  const createPosition = useCreatePosition();
  const closePosition = useClosePosition();
  const { data: balanceData } = useUserBalance();

  // Update positions PnL based on live market data
  const updatedPositions = positions.map(pos => {
    const currentMarket = marketData.find(m => m.symbol === pos.symbol);
    const entryPrice = parseFloat(pos.entryPrice);
    const currentPrice = currentMarket?.price || entryPrice;
    const priceDiff = currentPrice - entryPrice;
    const pnlRaw = pos.side === 'long' ? priceDiff : -priceDiff;
    const sizeInUnits = parseFloat(pos.size) / entryPrice;
    const pnl = sizeInUnits * pnlRaw;
    const pnlPercent = (pnl / parseFloat(pos.margin)) * 100;

    return {
      id: pos.id.toString(),
      symbol: pos.symbol,
      side: pos.side as 'long' | 'short',
      size: parseFloat(pos.size),
      leverage: pos.leverage,
      entryPrice,
      markPrice: currentPrice,
      liquidationPrice: parseFloat(pos.liquidationPrice),
      margin: parseFloat(pos.margin),
      pnl,
      pnlPercent,
    };
  });

  const currentMarket = marketData.find(m => m.symbol === selectedSymbol) || marketData[0];

  const handleOrder = (type: 'long' | 'short', amount: number, leverage: number) => {
    const entryPrice = currentMarket.price;
    const size = amount * leverage;
    const liquidationPrice = type === 'long' 
      ? entryPrice * (1 - 1/leverage) 
      : entryPrice * (1 + 1/leverage);

    createPosition.mutate({
      symbol: selectedSymbol,
      side: type,
      size: size.toString(),
      leverage,
      entryPrice: entryPrice.toString(),
      markPrice: entryPrice.toString(),
      liquidationPrice: liquidationPrice.toString(),
      margin: amount.toString(),
      pnl: "0",
      pnlPercent: "0",
      isOpen: true,
    });
  };

  const handleClosePosition = (id: string) => {
    const position = updatedPositions.find(p => p.id === id);
    if (!position) return;

    closePosition.mutate({
      id: parseInt(id),
      closePrice: position.markPrice.toString(),
      pnl: position.pnl.toString(),
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
                <PositionsPanel positions={updatedPositions} onClosePosition={handleClosePosition} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right: Order Book + Order Form */}
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
                 balance={balanceData?.balance}
               />
             </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
      
      {/* Footer */}
      <div className="h-6 bg-card border-t border-border flex items-center px-4 text-[10px] text-muted-foreground justify-between">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-up animate-pulse"></span> 실시간 데이터 연결됨 (WebSocket)</span>
          <span>지연시간: 45ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span>잔고: {balanceData?.balance ? parseFloat(balanceData.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USDT</span>
        </div>
      </div>
    </div>
  );
}
