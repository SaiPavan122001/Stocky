import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { Reward } from "@/services/api";

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  processing: { label: "Processing", variant: "outline" as const },
  credited: { label: "Credited", variant: "default" as const },
};

export function RewardHistoryTable() {
  const { data: rewards = [], isLoading } = useTodayRewards();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRewards = useMemo(() => {
    if (!searchQuery.trim()) return rewards;
    
    const query = searchQuery.toLowerCase();
    return rewards.filter(
      (reward) =>
        reward.symbol.toLowerCase().includes(query) ||
        reward.name.toLowerCase().includes(query) ||
        reward.status.toLowerCase().includes(query)
    );
  }, [rewards, searchQuery]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Reward History</CardTitle>
            <CardDescription>
              View all your claimed stock rewards
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by stock or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No rewards match your search" : "No rewards claimed yet"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
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
      <TableCell className="font-mono">
        {formatQuantity(reward.quantity)}
      </TableCell>
      <TableCell>
        <Badge variant={config.variant}>{config.label}</Badge>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatDateTime(reward.timestamp)}
      </TableCell>
    </TableRow>
  );
}
