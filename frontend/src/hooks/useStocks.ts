import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStocks,
  fetchHoldings,
  fetchTodayRewards,
  fetchPortfolioSummary,
  fetchChartData,
  fetchRecentActivity,
  claimReward,
} from "@/services/api";

export function useStocks() {
  return useQuery({
    queryKey: ["stocks"],
    queryFn: fetchStocks,
    refetchInterval: 5000, // Simulated live updates
  });
}

export function useHoldings() {
  return useQuery({
    queryKey: ["holdings"],
    queryFn: fetchHoldings,
  });
}

export function useTodayRewards() {
  return useQuery({
    queryKey: ["todayRewards"],
    queryFn: fetchTodayRewards,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ["portfolioSummary"],
    queryFn: fetchPortfolioSummary,
  });
}

export function useChartData(period: "7d" | "30d" | "all" = "30d") {
  return useQuery({
    queryKey: ["chartData", period],
    queryFn: () => fetchChartData(period),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recentActivity"],
    queryFn: fetchRecentActivity,
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ symbol, quantity }: { symbol: string; quantity: number }) =>
      claimReward(symbol, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayRewards"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioSummary"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
    },
  });
}
