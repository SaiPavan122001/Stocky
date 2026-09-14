import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className={cn("relative overflow-hidden", className)}>
        <div className="absolute top-6 right-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <CardHeader className="gap-1.5">
          <CardDescription>{title}</CardDescription>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <CardTitle className="text-2xl tabular-nums">{displayValue}</CardTitle>
          )}
        </CardHeader>
        {!isLoading && (trend || subtitle) && (
          <CardDescription className="flex items-center gap-2 px-6 pb-6">
            {trend && (
              <Badge
                variant="secondary"
                className={cn(trend.positive ? "text-success" : "text-destructive")}
              >
                {trend.positive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {trend.value}
              </Badge>
            )}
            {subtitle}
          </CardDescription>
        )}
      </Card>
    </motion.div>
  );
}
