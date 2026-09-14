// API Configuration - Change this to your backend URL
const API_BASE = ""; // Change to "http://localhost:8080" for Golang backend

// Types
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

// Mock Data
const MOCK_STOCKS: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", currentPrice: 2456.75, change: 23.45, changePercent: 0.96 },
  { symbol: "TCS", name: "Tata Consultancy Services", currentPrice: 3789.20, change: -15.30, changePercent: -0.40 },
  { symbol: "INFY", name: "Infosys Limited", currentPrice: 1567.85, change: 8.90, changePercent: 0.57 },
  { symbol: "HDFC", name: "HDFC Bank", currentPrice: 1678.50, change: 12.35, changePercent: 0.74 },
  { symbol: "ICICI", name: "ICICI Bank", currentPrice: 1023.40, change: -5.20, changePercent: -0.51 },
  { symbol: "WIPRO", name: "Wipro Limited", currentPrice: 456.30, change: 3.15, changePercent: 0.70 },
];

const MOCK_HOLDINGS: Holding[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", quantity: 2.567834, avgPrice: 2400.00, currentPrice: 2456.75, totalValue: 6308.89, pnl: 145.73, pnlPercent: 2.37 },
  { symbol: "TCS", name: "Tata Consultancy Services", quantity: 1.234567, avgPrice: 3650.00, currentPrice: 3789.20, totalValue: 4677.28, pnl: 171.78, pnlPercent: 3.81 },
  { symbol: "INFY", name: "Infosys Limited", quantity: 5.891234, avgPrice: 1520.00, currentPrice: 1567.85, totalValue: 9237.69, pnl: 281.99, pnlPercent: 3.15 },
  { symbol: "HDFC", name: "HDFC Bank", quantity: 3.456789, avgPrice: 1650.00, currentPrice: 1678.50, totalValue: 5802.04, pnl: 98.44, pnlPercent: 1.73 },
];

const MOCK_REWARDS: Reward[] = [
  { id: "1", symbol: "RELIANCE", name: "Reliance Industries", quantity: 0.123456, status: "credited", timestamp: new Date().toISOString() },
  { id: "2", symbol: "TCS", name: "Tata Consultancy Services", quantity: 0.045678, status: "processing", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", symbol: "INFY", name: "Infosys Limited", quantity: 0.234567, status: "pending", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "4", symbol: "HDFC", name: "HDFC Bank", quantity: 0.089012, status: "credited", timestamp: new Date(Date.now() - 10800000).toISOString() },
];

const MOCK_CHART_DATA: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    value: 20000 + Math.random() * 8000 + i * 200,
  };
});

const MOCK_PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalValue: 26025.90,
  totalShares: 13.150424,
  todayRewards: 4,
  growthPercent: 12.45,
};

const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
  { id: "1", type: "reward", symbol: "RELIANCE", quantity: 0.123456, timestamp: new Date().toISOString() },
  { id: "2", type: "credit", symbol: "TCS", quantity: 0.045678, timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: "3", type: "reward", symbol: "INFY", quantity: 0.234567, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "4", type: "credit", symbol: "HDFC", quantity: 0.089012, timestamp: new Date(Date.now() - 5400000).toISOString() },
  { id: "5", type: "reward", symbol: "ICICI", quantity: 0.156789, timestamp: new Date(Date.now() - 7200000).toISOString() },
];

// Simulated delay for realistic API behavior
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// API Functions - Replace mock implementations with real fetch calls
export async function fetchStocks(): Promise<Stock[]> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/stocks`);
    return response.json();
  }
  await delay(300);
  return MOCK_STOCKS;
}

export async function fetchHoldings(): Promise<Holding[]> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/holdings`);
    return response.json();
  }
  await delay(300);
  return MOCK_HOLDINGS;
}

export async function fetchTodayRewards(): Promise<Reward[]> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/rewards/today`);
    return response.json();
  }
  await delay(300);
  return MOCK_REWARDS;
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/portfolio/summary`);
    return response.json();
  }
  await delay(300);
  return MOCK_PORTFOLIO_SUMMARY;
}

export async function fetchChartData(period: "7d" | "30d" | "all" = "30d"): Promise<ChartDataPoint[]> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/portfolio/chart?period=${period}`);
    return response.json();
  }
  await delay(300);
  const days = period === "7d" ? 7 : period === "30d" ? 30 : MOCK_CHART_DATA.length;
  return MOCK_CHART_DATA.slice(-days);
}

export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/activity/recent`);
    return response.json();
  }
  await delay(300);
  return MOCK_RECENT_ACTIVITY;
}

export async function claimReward(symbol: string, quantity: number): Promise<Reward> {
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/rewards/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, quantity }),
    });
    return response.json();
  }
  await delay(500);
  const stock = MOCK_STOCKS.find((s) => s.symbol === symbol);
  return {
    id: Date.now().toString(),
    symbol,
    name: stock?.name || symbol,
    quantity,
    status: "pending",
    timestamp: new Date().toISOString(),
  };
}
