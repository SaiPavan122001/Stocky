import { useState, useMemo } from "react";
import { Search, Download, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useTodayRewards } from "@/hooks/useStocks";
import { formatQuantity, formatDateTime } from "@/utils/formatters";
import { exportToCsv } from "@/utils/exportCsv";
import { toast } from "@/hooks/use-toast";
import type { Reward } from "@/services/api";

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  processing: { label: "Processing", variant: "outline" as const, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  credited: { label: "Credited", variant: "default" as const, className: "bg-green-500/10 text-green-600 border-green-500/20" },
};

type StatusFilter = "all" | "pending" | "processing" | "credited";

export function TodaysRewardsTable() {
  const { data: rewards = [], isLoading } = useTodayRewards();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredRewards = useMemo(() => {
    let filtered = rewards;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((reward) => reward.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reward) =>
          reward.symbol.toLowerCase().includes(query) ||
          reward.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rewards, searchQuery, statusFilter]);

  const handleExport = () => {
    if (filteredRewards.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no rewards matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    exportToCsv(
      filteredRewards.map((r) => ({
        symbol: r.symbol,
        name: r.name,
        quantity: formatQuantity(r.quantity),
        status: r.status,
        timestamp: formatDateTime(r.timestamp),
      })),
      `todays-rewards-${new Date().toISOString().split("T")[0]}`,
      [
        { key: "symbol", header: "Symbol" },
        { key: "name", header: "Stock Name" },
        { key: "quantity", header: "Quantity" },
        { key: "status", header: "Status" },
        { key: "timestamp", header: "Timestamp" },
      ]
    );

    toast({
      title: "Export Successful",
      description: `Exported ${filteredRewards.length} rewards to CSV.`,
    });
  };

  const statusCounts = useMemo(() => {
    return {
      all: rewards.length,
      pending: rewards.filter((r) => r.status === "pending").length,
      processing: rewards.filter((r) => r.status === "processing").length,
      credited: rewards.filter((r) => r.status === "credited").length,
    };
  }, [rewards]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Today's Rewards</CardTitle>
              <CardDescription>
                {filteredRewards.length} of {rewards.length} rewards shown
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
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
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                <SelectItem value="processing">Processing ({statusCounts.processing})</SelectItem>
                <SelectItem value="credited">Credited ({statusCounts.credited})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "No rewards match your filters"
              : "No rewards received today"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards.map((reward) => (
                  <RewardRow key={reward.id} reward={reward} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RewardRow({ reward }: { reward: Reward }) {
  const config = statusConfig[reward.status];

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{reward.symbol}</div>
          <div className="text-sm text-muted-foreground">{reward.name}</div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-base">
        {formatQuantity(reward.quantity)}
      </TableCell>
      <TableCell>
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatDateTime(reward.timestamp)}
      </TableCell>
    </TableRow>
  );
}
