// Package models mirrors the TypeScript types in frontend/src/services/api.ts
// so JSON field names line up exactly with what the frontend already expects.
package models

type User struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
}

type Stock struct {
	Symbol        string  `json:"symbol"`
	Name          string  `json:"name"`
	CurrentPrice  float64 `json:"currentPrice"`
	Change        float64 `json:"change"`
	ChangePercent float64 `json:"changePercent"`
}

type Holding struct {
	Symbol       string  `json:"symbol"`
	Name         string  `json:"name"`
	Quantity     float64 `json:"quantity"`
	AvgPrice     float64 `json:"avgPrice"`
	CurrentPrice float64 `json:"currentPrice"`
	TotalValue   float64 `json:"totalValue"`
	Pnl          float64 `json:"pnl"`
	PnlPercent   float64 `json:"pnlPercent"`
}

type Reward struct {
	ID        string  `json:"id"`
	Symbol    string  `json:"symbol"`
	Name      string  `json:"name"`
	Quantity  float64 `json:"quantity"`
	Status    string  `json:"status"` // pending | processing | credited
	Timestamp string  `json:"timestamp"`
}

type PortfolioSummary struct {
	TotalValue    float64 `json:"totalValue"`
	TotalShares   float64 `json:"totalShares"`
	TodayRewards  int     `json:"todayRewards"`
	GrowthPercent float64 `json:"growthPercent"`
}

type ChartDataPoint struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
}

type RecentActivity struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"` // reward | credit
	Symbol    string  `json:"symbol"`
	Quantity  float64 `json:"quantity"`
	Timestamp string  `json:"timestamp"`
}
