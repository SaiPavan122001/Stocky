package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"

	"stocky/backend-go/internal/store"
)

func (s *Server) handleListStocks(w http.ResponseWriter, r *http.Request) {
	stocks, err := s.Store.ListStocks()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load stocks")
		return
	}
	writeJSON(w, http.StatusOK, stocks)
}

func (s *Server) handleListHoldings(w http.ResponseWriter, r *http.Request) {
	holdings, err := s.Store.ListHoldings(userIDFromContext(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load holdings")
		return
	}
	writeJSON(w, http.StatusOK, holdings)
}

func (s *Server) handleTodayRewards(w http.ResponseWriter, r *http.Request) {
	rewards, err := s.Store.ListTodayRewards(userIDFromContext(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load today's rewards")
		return
	}
	writeJSON(w, http.StatusOK, rewards)
}

func (s *Server) handleAllRewards(w http.ResponseWriter, r *http.Request) {
	rewards, err := s.Store.ListAllRewards(userIDFromContext(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load rewards")
		return
	}
	writeJSON(w, http.StatusOK, rewards)
}

type claimRewardRequest struct {
	Symbol   string  `json:"symbol"`
	Quantity float64 `json:"quantity"`
}

func (s *Server) handleClaimReward(w http.ResponseWriter, r *http.Request) {
	var req claimRewardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Symbol == "" || req.Quantity <= 0 || req.Quantity > 1_000_000 {
		writeError(w, http.StatusBadRequest, "symbol is required and quantity must be between 0 and 1,000,000")
		return
	}

	reward, err := s.Store.CreateReward(userIDFromContext(r), req.Symbol, req.Quantity)
	if err == store.ErrNotFound {
		writeError(w, http.StatusBadRequest, "unknown stock symbol")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create reward")
		return
	}

	writeJSON(w, http.StatusCreated, reward)
}

func (s *Server) handlePortfolioSummary(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromContext(r)

	totalValue, totalShares, err := s.Store.TotalPortfolioValue(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to compute portfolio value")
		return
	}
	todayRewards, err := s.Store.CountTodayRewards(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to count today's rewards")
		return
	}
	yesterday, err := s.Store.YesterdaySnapshotValue(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load prior snapshot")
		return
	}

	var growthPercent float64
	if yesterday > 0 {
		growthPercent = ((totalValue - yesterday) / yesterday) * 100
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"totalValue":    totalValue,
		"totalShares":   totalShares,
		"todayRewards":  todayRewards,
		"growthPercent": growthPercent,
	})
}

func (s *Server) handleChartData(w http.ResponseWriter, r *http.Request) {
	days := 30
	switch r.URL.Query().Get("period") {
	case "7d":
		days = 7
	case "all":
		days = 3650
	}

	points, err := s.Store.ChartData(userIDFromContext(r), days)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load chart data")
		return
	}
	writeJSON(w, http.StatusOK, points)
}

func (s *Server) handleRecentActivity(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}

	activity, err := s.Store.ListRecentActivity(userIDFromContext(r), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load recent activity")
		return
	}
	writeJSON(w, http.StatusOK, activity)
}
