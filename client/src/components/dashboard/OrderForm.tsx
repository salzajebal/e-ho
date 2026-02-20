import { useState, useEffect } from "react";
import { MarketData } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface OrderFormProps {
  currentPrice: number;
  symbol: string;
  balance?: string;
  onOrder: (type: 'long' | 'short', amount: number, leverage: number) => void;
}

export function OrderForm({ currentPrice, symbol, balance, onOrder }: OrderFormProps) {
  const [leverage, setLeverage] = useState([20]);
  const [amount, setAmount] = useState<string>("1000");
  const [orderType, setOrderType] = useState<"limit" | "market">("market");

  const availableBalance = balance ? parseFloat(balance) : 100000;

  const handleOrder = (side: 'long' | 'short') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("유효한 수량을 입력해주세요.");
      return;
    }

    if (numAmount > availableBalance) {
      toast.error("잔고가 부족합니다.");
      return;
    }
    
    onOrder(side, numAmount, leverage[0]);
    toast.success(`${side === 'long' ? 'LONG' : 'SHORT'} 주문이 접수되었습니다.`, {
      description: `${symbol} ${leverage[0]}x 격리`,
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border w-full lg:w-[320px] shrink-0">
      <div className="flex items-center px-4 h-10 border-b border-border bg-muted/20 shrink-0">
        <h2 className="text-sm font-semibold text-muted-foreground">주문</h2>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <Tabs defaultValue="market" className="w-full" onValueChange={(v) => setOrderType(v as any)}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/20">
            <TabsTrigger value="limit">지정가</TabsTrigger>
            <TabsTrigger value="market">시장가</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>가용 자산</span>
              <span className="text-foreground font-mono">
                {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">레버리지</label>
            <div className="flex items-center gap-4">
               <Slider 
                value={leverage} 
                onValueChange={setLeverage} 
                max={125} 
                step={1} 
                className="flex-1"
              />
              <div className="w-12 h-8 flex items-center justify-center bg-input rounded text-sm font-mono border border-border">
                {leverage[0]}x
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              {orderType === 'limit' ? '가격 (USDT)' : '시장 평균가'}
            </label>
            <div className="relative">
              <Input 
                type="number" 
                value={orderType === 'limit' ? currentPrice : '시장가'}
                disabled={orderType === 'market'}
                className="font-mono text-right pr-12 bg-input border-border focus-visible:ring-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">USDT</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">수량 (USDT)</label>
            <div className="relative">
              <Input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-right pr-12 bg-input border-border focus-visible:ring-primary"
                data-testid="input-order-amount"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">USDT</span>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-3">
            <Button 
              className="w-full bg-up hover:bg-up/90 text-white font-semibold"
              onClick={() => handleOrder('long')}
              data-testid="button-long"
            >
              LONG
            </Button>
            <Button 
              className="w-full bg-down hover:bg-down/90 text-white font-semibold"
              onClick={() => handleOrder('short')}
              data-testid="button-short"
            >
              SHORT
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
            <span>자산 비용</span>
            <span className="text-right text-foreground font-mono">
              {(parseFloat(amount || "0") / leverage[0]).toFixed(2)} USDT
            </span>
            <span>최대 주문</span>
            <span className="text-right text-foreground font-mono">
              {(availableBalance * leverage[0]).toLocaleString()} USDT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
