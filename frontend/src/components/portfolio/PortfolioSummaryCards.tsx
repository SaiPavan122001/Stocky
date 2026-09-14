import { Wallet, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHoldings } from "@/hooks/useStocks";
import { formatCurrency, formatQuantity, formatPercent } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function PortfolioSummaryCards() {
  const { data: holdings = [], isLoading } = useHoldings();

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.avgPrice * h.quantity, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalShares = holdings.reduce((sum, h) => sum + h.quantity, 0);

  const isPositive = totalPnl >= 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Wallet className="h-4 w-4" />
            Portfolio Value
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <PieChart className="h-4 w-4" />
            Total Invested
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            Total P&L
          </div>
          <div className={cn("text-2xl font-bold", isPositive ? "text-green-600" : "text-red-600")}>
            {isPositive ? "+" : ""}{formatCurrency(totalPnl)}
            <span className="text-sm font-normal ml-2">
              ({isPositive ? "+" : ""}{formatPercent(totalPnlPercent)})
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <PieChart className="h-4 w-4" />
            Total Shares
          </div>
          <div className="text-2xl font-bold">{formatQuantity(totalShares)}</div>
          <div className="text-sm text-muted-foreground">{holdings.length} stocks</div>
        </CardContent>
      </Card>
    </div>
  );
}
