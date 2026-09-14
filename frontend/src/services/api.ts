import { apiFetch, setAccessToken } from "./http";
import { tokenStorage } from "@/lib/tokenStorage";

// Types (unchanged from the original mock API so existing components and
// hooks didn't need to change their consuming code).
export interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface Reward {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  status: "pending" | "processing" | "credited";
  timestamp: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalShares: number;
  todayRewards: number;
  growthPercent: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface RecentActivity {
  id: string;
  type: "reward" | "credit";
  symbol: string;
  quantity: number;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// --- Data endpoints ---

export function fetchStocks(): Promise<Stock[]> {
  return apiFetch<Stock[]>("/stocks");
}

export function fetchHoldings(): Promise<Holding[]> {
  return apiFetch<Holding[]>("/holdings");
}

export function fetchTodayRewards(): Promise<Reward[]> {
  return apiFetch<Reward[]>("/rewards/today");
}

export function fetchAllRewards(): Promise<Reward[]> {
  return apiFetch<Reward[]>("/rewards");
}

export function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>("/portfolio/summary");
}

export function fetchChartData(period: "7d" | "30d" | "all" = "30d"): Promise<ChartDataPoint[]> {
  return apiFetch<ChartDataPoint[]>(`/portfolio/chart?period=${period}`);
}

export function fetchRecentActivity(): Promise<RecentActivity[]> {
  return apiFetch<RecentActivity[]>("/activity");
}

export function claimReward(symbol: string, quantity: number): Promise<Reward> {
  return apiFetch<Reward>("/rewards/claim", {
    method: "POST",
    body: JSON.stringify({ symbol, quantity }),
  });
}

// --- Auth endpoints ---

function applyAuthResponse(data: AuthResponse): User {
  setAccessToken(data.accessToken);
  tokenStorage.setRefreshToken(data.refreshToken);
  return data.user;
}

export async function signup(email: string, password: string, displayName?: string): Promise<User> {
  const data = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName }),
    skipAuthRetry: true,
  });
  return applyAuthResponse(data);
}

export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuthRetry: true,
  });
  return applyAuthResponse(data);
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStorage.getRefreshToken();
  setAccessToken(null);
  tokenStorage.clearRefreshToken();
  if (refreshToken) {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      skipAuthRetry: true,
    }).catch(() => {
      // best-effort server-side revocation; local tokens are already cleared
    });
  }
}

export function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>("/me");
}

/** Attempts to restore a session from a stored refresh token on app launch. */
export async function restoreSession(): Promise<User | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const data = await apiFetch<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      skipAuthRetry: true,
    });
    return applyAuthResponse(data);
  } catch {
    tokenStorage.clearRefreshToken();
    return null;
  }
}
