import { Wallet, TrendingUp, Gift, PieChart } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { usePortfolioSummary } from "@/hooks/useStocks";
import { formatCompactINR, formatQuantity, formatPercentage } from "@/utils/formatters";

export default function Dashboard() {
  const { data: summary, isLoading } = usePortfolioSummary();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your stock rewards and portfolio performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Portfolio Value"
          value={formatCompactINR(summary?.totalValue || 0)}
          numericValue={summary?.totalValue || 0}
          formatValue={formatCompactINR}
          icon={Wallet}
          isLoading={isLoading}
          trend={
            summary?.growthPercent
              ? {
                  value: formatPercentage(summary.growthPercent),
                  positive: summary.growthPercent >= 0,
                }
              : undefined
          }
        />
        <StatsCard
          title="Total Shares"
          value={formatQuantity(summary?.totalShares || 0)}
          numericValue={summary?.totalShares || 0}
          formatValue={formatQuantity}
          subtitle="Across all stocks"
          icon={PieChart}
          isLoading={isLoading}
        />
        <StatsCard
          title="Today's Rewards"
          value={String(summary?.todayRewards || 0)}
          numericValue={summary?.todayRewards || 0}
          formatValue={(n) => String(Math.round(n))}
          subtitle="Rewards received today"
          icon={Gift}
          isLoading={isLoading}
        />
        <StatsCard
          title="Growth"
          value={formatPercentage(summary?.growthPercent || 0)}
          numericValue={summary?.growthPercent || 0}
          formatValue={formatPercentage}
          subtitle="Since last month"
          icon={TrendingUp}
          isLoading={isLoading}
          trend={
            summary?.growthPercent
              ? {
                  value: summary.growthPercent >= 0 ? "Positive" : "Negative",
                  positive: summary.growthPercent >= 0,
                }
              : undefined
          }
        />
      </div>

      {/* Chart and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PortfolioChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
