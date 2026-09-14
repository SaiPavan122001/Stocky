import { useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useChartData } from "@/hooks/useStocks";
import { formatINR, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const periods = [
  { label: "7D", value: "7d" as const },
  { label: "30D", value: "30d" as const },
  { label: "All", value: "all" as const },
];

const chartConfig: ChartConfig = {
  value: {
    label: "Portfolio Value",
    color: "hsl(var(--primary))",
  },
};

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
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <LineChart className="h-8 w-8" />
            <p className="text-sm">Not enough history yet — check back after your first day of activity</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} accessibilityLayer>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
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
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => formatDate(payload?.[0]?.payload?.date)}
                    formatter={(value) => (
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <span className="text-muted-foreground">Portfolio Value</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatINR(value as number)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="url(#colorValue)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
