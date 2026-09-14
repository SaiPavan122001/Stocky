package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"stocky/backend-go/internal/auth"
	"stocky/backend-go/internal/db"
	"stocky/backend-go/internal/httpapi"
	"stocky/backend-go/internal/rewardworker"
	"stocky/backend-go/internal/store"
)

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	dbPath := getenv("DATABASE_PATH", "stocky.db")
	jwtSecret := getenv("JWT_SECRET", "dev-secret-change-me")
	port := getenv("PORT", "8080")
	allowedOrigins := strings.Split(getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8081,http://10.0.2.2:5173"), ",")

	conn, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer conn.Close()

	s := store.New(conn)
	tokens := auth.NewTokenIssuer(jwtSecret)
	server := &httpapi.Server{Store: s, Tokens: tokens}

	stopWorker := make(chan struct{})
	go rewardworker.Run(s, stopWorker)
	defer close(stopWorker)

	go runSnapshotLoop(s)

	router := httpapi.NewRouter(server, allowedOrigins)
	log.Printf("stocky backend-go listening on :%s (db=%s)", port, dbPath)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// runSnapshotLoop periodically records each user's current portfolio value
// so the dashboard chart has a real time series to render.
func runSnapshotLoop(s *store.Store) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	snapshotAll(s)
	for range ticker.C {
		snapshotAll(s)
	}
}

func snapshotAll(s *store.Store) {
	userIDs, err := s.ListUserIDs()
	if err != nil {
		log.Printf("snapshot: list users: %v", err)
		return
	}
	for _, userID := range userIDs {
		totalValue, _, err := s.TotalPortfolioValue(userID)
		if err != nil {
			log.Printf("snapshot: portfolio value for %s: %v", userID, err)
			continue
		}
		if err := s.UpsertSnapshot(userID, time.Now(), totalValue); err != nil {
			log.Printf("snapshot: upsert for %s: %v", userID, err)
		}
	}
}
