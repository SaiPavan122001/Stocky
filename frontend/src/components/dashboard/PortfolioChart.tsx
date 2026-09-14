import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChartData } from "@/hooks/useStocks";
import { formatINR, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const periods = [
  { label: "7D", value: "7d" as const },
  { label: "30D", value: "30d" as const },
  { label: "All", value: "all" as const },
];

export function PortfolioChart() {
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const { data: chartData = [], isLoading } = useChartData(period);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Portfolio Value</CardTitle>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "h-7 px-3 text-xs",
                period === p.value && "bg-primary text-primary-foreground"
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-popover p-3 shadow-md">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payload[0].payload.date)}
                        </p>
                        <p className="text-sm font-semibold">
                          {formatINR(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
