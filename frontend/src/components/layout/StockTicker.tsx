import { TrendingUp, TrendingDown } from "lucide-react";
import { useStocks } from "@/hooks/useStocks";
import { formatINR, formatPercentage } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function StockTicker() {
  const { data: stocks = [] } = useStocks();

  // Duplicate stocks for seamless infinite scroll
  const tickerItems = [...stocks, ...stocks];

  return (
    <div className="w-full overflow-hidden bg-ticker-bg border-b">
      <div className="animate-ticker flex whitespace-nowrap py-2">
        {tickerItems.map((stock, index) => (
          <div
            key={`${stock.symbol}-${index}`}
            className="inline-flex items-center gap-2 px-6 border-r border-border/50"
          >
            <span className="font-semibold text-sm">{stock.symbol}</span>
            <span className="text-sm text-muted-foreground">
              {formatINR(stock.currentPrice)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                stock.change >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {stock.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercentage(stock.changePercent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
