import { Gift, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentActivity } from "@/hooks/useStocks";
import { formatQuantity, formatTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  activity.type === "reward"
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                )}
              >
                {activity.type === "reward" ? (
                  <Gift className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.type === "reward" ? "Reward Received" : "Credited"}: {activity.symbol}
                </p>
                <p className="text-xs text-muted-foreground">
                  +{formatQuantity(activity.quantity)} shares
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
