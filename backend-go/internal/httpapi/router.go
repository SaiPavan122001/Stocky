package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"stocky/backend-go/internal/auth"
	"stocky/backend-go/internal/store"
)

type Server struct {
	Store  *store.Store
	Tokens *auth.TokenIssuer
}

func NewRouter(s *Server, allowedOrigins []string) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/signup", s.handleSignup)
		r.Post("/auth/login", s.handleLogin)
		r.Post("/auth/refresh", s.handleRefresh)
		r.Post("/auth/logout", s.handleLogout)

		r.Group(func(r chi.Router) {
			r.Use(s.RequireAuth)

			r.Get("/me", s.handleMe)
			r.Get("/stocks", s.handleListStocks)
			r.Get("/holdings", s.handleListHoldings)
			r.Get("/rewards/today", s.handleTodayRewards)
			r.Get("/rewards", s.handleAllRewards)
			r.Post("/rewards/claim", s.handleClaimReward)
			r.Get("/portfolio/summary", s.handlePortfolioSummary)
			r.Get("/portfolio/chart", s.handleChartData)
			r.Get("/activity", s.handleRecentActivity)
		})
	})

	return r
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
