import { useState, useMemo } from "react";
import { Search, Download, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useHoldings } from "@/hooks/useStocks";
import { formatQuantity, formatCurrency, formatPercent, formatCompactCurrency } from "@/utils/formatters";
import { exportToCsv } from "@/utils/exportCsv";
import { toast } from "@/hooks/use-toast";
import type { Holding } from "@/services/api";
import { cn } from "@/lib/utils";

type SortField = "symbol" | "quantity" | "value" | "pnl";
type SortOrder = "asc" | "desc";

export function HoldingsTable() {
  const { data: holdings = [], isLoading } = useHoldings();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredAndSorted = useMemo(() => {
    let filtered = holdings;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (holding) =>
          holding.symbol.toLowerCase().includes(query) ||
          holding.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "value":
          comparison = a.totalValue - b.totalValue;
          break;
        case "pnl":
          comparison = a.pnlPercent - b.pnlPercent;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [holdings, searchQuery, sortField, sortOrder]);

  const totalValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.totalValue, 0),
    [holdings]
  );

  const totalPnl = useMemo(
    () => holdings.reduce((sum, h) => sum + h.pnl, 0),
    [holdings]
  );

  const handleExport = () => {
    if (filteredAndSorted.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no holdings matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    exportToCsv(
      filteredAndSorted.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        quantity: formatQuantity(h.quantity),
        avgPrice: formatCurrency(h.avgPrice),
        currentPrice: formatCurrency(h.currentPrice),
        totalValue: formatCurrency(h.totalValue),
        pnl: formatCurrency(h.pnl),
        pnlPercent: formatPercent(h.pnlPercent),
      })),
      `portfolio-${new Date().toISOString().split("T")[0]}`,
      [
        { key: "symbol", header: "Symbol" },
        { key: "name", header: "Stock Name" },
        { key: "quantity", header: "Quantity" },
        { key: "avgPrice", header: "Avg Price" },
        { key: "currentPrice", header: "Current Price" },
        { key: "totalValue", header: "Total Value" },
        { key: "pnl", header: "P&L" },
        { key: "pnlPercent", header: "P&L %" },
      ]
    );

    toast({
      title: "Export Successful",
      description: `Exported ${filteredAndSorted.length} holdings to CSV.`,
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>
                Total Value: {formatCurrency(totalValue)} · P&L:{" "}
                <span className={cn(totalPnl >= 0 ? "text-green-600" : "text-red-600")}>
                  {totalPnl >= 0 ? "+" : ""}
                  {formatCurrency(totalPnl)}
                </span>
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Portfolio
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by stock name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-") as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value-desc">Value (High to Low)</SelectItem>
                <SelectItem value="value-asc">Value (Low to High)</SelectItem>
                <SelectItem value="pnl-desc">P&L % (High to Low)</SelectItem>
                <SelectItem value="pnl-asc">P&L % (Low to High)</SelectItem>
                <SelectItem value="quantity-desc">Quantity (High to Low)</SelectItem>
                <SelectItem value="quantity-asc">Quantity (Low to High)</SelectItem>
                <SelectItem value="symbol-asc">Symbol (A-Z)</SelectItem>
                <SelectItem value="symbol-desc">Symbol (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? "No holdings match your search" : "No holdings yet"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("symbol")}
                  >
                    Stock
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("quantity")}
                  >
                    Quantity
                  </TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("value")}
                  >
                    Value
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("pnl")}
                  >
                    P&L
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((holding) => (
                  <HoldingRow key={holding.symbol} holding={holding} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HoldingRow({ holding }: { holding: Holding }) {
  const isPositive = holding.pnl >= 0;

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{holding.symbol}</div>
          <div className="text-sm text-muted-foreground">{holding.name}</div>
        </div>
      </TableCell>
      <TableCell className="font-mono">
        {formatQuantity(holding.quantity)}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{formatCurrency(holding.currentPrice)}</div>
          <div className="text-sm text-muted-foreground">
            Avg: {formatCurrency(holding.avgPrice)}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(holding.totalValue)}
      </TableCell>
      <TableCell className="text-right">
        <div className={cn("flex items-center justify-end gap-1", isPositive ? "text-green-600" : "text-red-600")}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <div>
            <div className="font-medium">
              {isPositive ? "+" : ""}
              {formatCurrency(holding.pnl)}
            </div>
            <div className="text-sm">
              {isPositive ? "+" : ""}
              {formatPercent(holding.pnlPercent)}
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
