import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  margin: number;
  pnl: number;
  pnlPercent: number;
}

interface PositionsPanelProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
}

export function PositionsPanel({ positions, onClosePosition }: PositionsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center px-4 h-10 border-b border-border gap-6">
        <button className="text-sm font-semibold text-primary border-b-2 border-primary h-full px-2">
          포지션 ({positions.length})
        </button>
        <button className="text-sm font-medium text-muted-foreground h-full px-2 hover:text-foreground">
          대기 주문 (0)
        </button>
        <button className="text-sm font-medium text-muted-foreground h-full px-2 hover:text-foreground">
          주문 내역
        </button>
        <button className="text-sm font-medium text-muted-foreground h-full px-2 hover:text-foreground">
          거래 내역
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <span>보유 중인 포지션이 없습니다.</span>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-muted-foreground bg-muted/20 font-medium">
              <tr>
                <th className="px-4 py-2">종목</th>
                <th className="px-2 py-2">사이즈</th>
                <th className="px-2 py-2">진입가</th>
                <th className="px-2 py-2">현재가</th>
                <th className="px-2 py-2">청산가</th>
                <th className="px-2 py-2">증거금 비율</th>
                <th className="px-2 py-2">증거금</th>
                <th className="px-2 py-2 text-right">PNL (ROE %)</th>
                <th className="px-4 py-2 text-right">종료</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-1 h-4 rounded-sm",
                        pos.side === 'long' ? "bg-up" : "bg-down"
                      )}></span>
                      <span className="text-foreground text-sm font-bold">{pos.symbol}</span>
                      <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                        {pos.leverage}x
                      </span>
                    </div>
                  </td>
                  <td className={cn("px-2 font-mono", pos.side === 'long' ? "text-up" : "text-down")}>
                    {pos.size.toLocaleString()} USDT
                  </td>
                  <td className="px-2 font-mono text-muted-foreground">{pos.entryPrice.toLocaleString()}</td>
                  <td className="px-2 font-mono text-foreground">{pos.markPrice.toLocaleString()}</td>
                  <td className="px-2 font-mono text-orange-500">{pos.liquidationPrice.toLocaleString()}</td>
                  <td className="px-2 font-mono text-foreground">{(1.5).toFixed(2)}%</td>
                  <td className="px-2 font-mono text-foreground">{pos.margin.toLocaleString()}</td>
                  <td className="px-2 text-right">
                    <div className={cn("font-mono font-medium", pos.pnl >= 0 ? "text-up" : "text-down")}>
                      {pos.pnl.toFixed(2)} USDT
                    </div>
                    <div className={cn("font-mono text-[10px]", pos.pnlPercent >= 0 ? "text-up" : "text-down")}>
                      ({pos.pnlPercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="px-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs hover:bg-muted/50"
                      onClick={() => onClosePosition(pos.id)}
                    >
                      시장가 종료
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
