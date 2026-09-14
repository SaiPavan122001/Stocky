import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  /** When provided together with `formatValue`, the displayed value animates
   *  (counts up/down) between changes instead of just replacing the text. */
  numericValue?: number;
  formatValue?: (n: number) => string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  numericValue,
  formatValue,
  subtitle,
  icon: Icon,
  trend,
  className,
  isLoading,
}: StatsCardProps) {
  const animated = useCountUp(numericValue ?? 0);
  const displayValue = numericValue !== undefined && formatValue ? formatValue(animated) : value;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight">{displayValue}</h3>
                  {trend && (
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        trend.positive
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {trend.value}
                    </span>
                  )}
                </div>
              )}
              {subtitle && !isLoading && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
