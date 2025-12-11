import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MarketData, useChartData } from "@/lib/marketData";
import { useMemo } from "react";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
}

export function PriceChart({ symbol, data }: PriceChartProps) {
  const chartData = useChartData(symbol, data.price);

  const isPositive = data.change >= 0;
  const strokeColor = isPositive ? "#0ECB81" : "#F6465D";
  const gradientId = `gradient-${symbol.replace(/[^a-zA-Z]/g, '')}`;

  // Calculate Y-axis domain with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const prices = chartData.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || max * 0.01;
    return [min - padding, max + padding];
  }, [chartData]);

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{data.category}</span>
        </div>
        
        <div className="flex items-center gap-4 ml-2">
          <div className="flex flex-col">
            <span className={`text-xl font-mono font-bold ${isPositive ? 'text-up' : 'text-down'}`}>
              {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">
              {data.symbol.includes('KRW') ? '₩' : '$'}{data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-muted-foreground">24시간 변동</span>
            <span className={`text-sm font-mono ${isPositive ? 'text-up' : 'text-down'}`}>
              {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
          
          <div className="flex flex-col hidden md:flex">
            <span className="text-xs text-muted-foreground">24시간 고가</span>
            <span className="text-sm font-mono text-foreground">{data.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div className="flex flex-col hidden md:flex">
            <span className="text-xs text-muted-foreground">24시간 저가</span>
            <span className="text-sm font-mono text-foreground">{data.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col hidden lg:flex">
            <span className="text-xs text-muted-foreground">24시간 거래량</span>
            <span className="text-sm font-mono text-foreground">{data.volume.toLocaleString()}</span>
          </div>
        </div>

        <div className="ml-auto hidden xl:flex gap-1 text-xs font-medium text-muted-foreground">
          <button className="px-2 py-1 hover:text-primary transition-colors">1분</button>
          <button className="px-2 py-1 text-primary bg-muted/30 rounded">5분</button>
          <button className="px-2 py-1 hover:text-primary transition-colors">15분</button>
          <button className="px-2 py-1 hover:text-primary transition-colors">1시간</button>
          <button className="px-2 py-1 hover:text-primary transition-colors">1일</button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0 p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3}/>
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(132, 142, 156, 0.1)" 
                vertical={false} 
              />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#848e9c', fontSize: 11 }}
                minTickGap={50}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={yDomain as [number, number]}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#848e9c', fontSize: 11 }}
                tickFormatter={(val) => val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                width={70}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e2329', 
                  borderColor: '#2b3139', 
                  borderRadius: '4px',
                  color: '#eaecef' 
                }}
                labelStyle={{ color: '#848e9c' }}
                itemStyle={{ color: '#eaecef' }}
                formatter={(value: number) => [value.toLocaleString(undefined, { minimumFractionDigits: 2 }), '가격']}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            차트 데이터 로딩중...
          </div>
        )}
      </div>
    </div>
  );
}
