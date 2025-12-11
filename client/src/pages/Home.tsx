import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Ticker } from "@/components/dashboard/Ticker";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { OrderBook } from "@/components/dashboard/OrderBook";
import { TradeHistory } from "@/components/dashboard/TradeHistory";
import { INITIAL_MARKET_DATA, MarketData } from "@/lib/mockData";

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [marketData, setMarketData] = useState<MarketData[]>(INITIAL_MARKET_DATA);

  // Mock global market updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => {
        const volatility = 0.0002;
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

  const currentMarket = marketData.find(m => m.symbol === selectedSymbol) || marketData[0];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <Navbar />
      <Ticker data={marketData} />
      
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Market List */}
        <div className="hidden xl:flex flex-col border-r border-border">
           <MarketOverview 
             data={marketData} 
             onSelect={setSelectedSymbol} 
             selectedSymbol={selectedSymbol} 
           />
        </div>

        {/* Center Column: Chart */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 border-b border-border">
            <PriceChart symbol={selectedSymbol} data={currentMarket} />
          </div>
          <div className="h-[300px] flex border-b border-border xl:hidden">
             {/* Show Trades/OrderBook on bottom for smaller screens */}
             <TradeHistory currentPrice={currentMarket.price} />
             <div className="w-px bg-border"></div>
             <OrderBook currentPrice={currentMarket.price} />
          </div>
        </div>

        {/* Right Column: Order Book & Trades */}
        <div className="hidden lg:flex flex-col border-l border-border w-[320px]">
          <div className="flex-1 min-h-0 border-b border-border">
            <OrderBook currentPrice={currentMarket.price} />
          </div>
          <div className="h-[40%] min-h-0">
            <TradeHistory currentPrice={currentMarket.price} />
          </div>
        </div>
      </main>
      
      {/* Footer / Status Bar */}
      <div className="h-6 bg-card border-t border-border flex items-center px-4 text-[10px] text-muted-foreground justify-between">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-up"></span> 정상 작동</span>
          <span>지연시간: 14ms</span>
        </div>
        <div>
          모의 거래 환경
        </div>
      </div>
    </div>
  );
}
