import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MarketData, generateCandleData } from "@/lib/mockData";
import { useEffect, useState } from "react";

interface PriceChartProps {
  symbol: string;
  data: MarketData;
}

export function PriceChart({ symbol, data }: PriceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate fresh data when symbol changes
    setChartData(generateCandleData(data.price));
  }, [symbol]);

  // Mock live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1];
        const newClose = last.close + (Math.random() - 0.5) * (last.close * 0.002);
        const newPoint = {
          ...last,
          close: newClose,
          high: Math.max(last.high, newClose),
          low: Math.min(last.low, newClose),
        };
        // Update last point or add new one occasionally
        if (Math.random() > 0.8) {
           return [...prev.slice(1), {
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             open: newClose,
             close: newClose,
             high: newClose,
             low: newClose,
             volume: 0
           }];
        }
        return [...prev.slice(0, -1), newPoint];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = data.change >= 0;
  const color = isPositive ? "var(--up)" : "var(--down)";

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-border bg-card z-10">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{data.category}</span>
        </div>
        
        <div className="flex items-center gap-4 ml-2">
          <div className="flex flex-col">
            <span className={`text-lg font-mono font-bold ${isPositive ? 'text-up' : 'text-down'}`}>
              {data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">
              ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-muted-foreground">24h Change</span>
            <span className={`text-sm font-mono ${isPositive ? 'text-up' : 'text-down'}`}>
              {data.change.toFixed(2)} {data.changePercent.toFixed(2)}%
            </span>
          </div>
          
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-muted-foreground">24h High</span>
            <span className="text-sm font-mono text-foreground">{data.high.toLocaleString()}</span>
          </div>
          
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-muted-foreground">24h Low</span>
            <span className="text-sm font-mono text-foreground">{data.low.toLocaleString()}</span>
          </div>

           <div className="flex flex-col hidden md:flex">
            <span className="text-xs text-muted-foreground">24h Volume</span>
            <span className="text-sm font-mono text-foreground">{data.volume.toLocaleString()}</span>
          </div>
        </div>

        <div className="ml-auto hidden xl:flex gap-1 text-xs font-medium text-muted-foreground">
          <button className="px-2 py-1 hover:text-primary">15m</button>
          <button className="px-2 py-1 text-primary bg-muted/30 rounded">1H</button>
          <button className="px-2 py-1 hover:text-primary">4H</button>
          <button className="px-2 py-1 hover:text-primary">1D</button>
          <button className="px-2 py-1 hover:text-primary">1W</button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0 p-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} opacity={0.2} />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']}
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(val) => val.toLocaleString()}
              width={60}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke={color} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
