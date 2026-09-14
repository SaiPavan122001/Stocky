// Package priceclient polls backend-price (the Flask market-data service)
// and writes results into the local price_cache table, so request handlers
// never block on an external HTTP call.
package priceclient

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"stocky/backend-go/internal/store"
)

const pollInterval = 2 * time.Minute

type pricePoint struct {
	Price         float64 `json:"price"`
	Change        float64 `json:"change"`
	ChangePercent float64 `json:"changePercent"`
	Stale         bool    `json:"stale"`
}

type Poller struct {
	Store      *store.Store
	BaseURL    string
	HTTPClient *http.Client
}

func NewPoller(s *store.Store, baseURL string) *Poller {
	return &Poller{
		Store:      s,
		BaseURL:    strings.TrimRight(baseURL, "/"),
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// Run blocks, polling on a fixed interval until stop is closed. Fetches
// once immediately on startup so price_cache is fresh before the first
// request arrives.
func (p *Poller) Run(stop <-chan struct{}) {
	p.pollOnce()

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			p.pollOnce()
		}
	}
}

func (p *Poller) pollOnce() {
	symbols, err := p.Store.ListActiveSymbols()
	if err != nil {
		log.Printf("priceclient: list symbols: %v", err)
		return
	}
	if len(symbols) == 0 {
		return
	}

	prices, err := p.fetch(symbols)
	if err != nil {
		log.Printf("priceclient: fetch from backend-price: %v", err)
		return
	}

	for symbol, point := range prices {
		if err := p.Store.UpsertPrice(symbol, point.Price, point.Change, point.ChangePercent); err != nil {
			log.Printf("priceclient: upsert price for %s: %v", symbol, err)
		}
	}
}

func (p *Poller) fetch(symbols []string) (map[string]pricePoint, error) {
	reqURL := fmt.Sprintf("%s/prices?symbols=%s", p.BaseURL, url.QueryEscape(strings.Join(symbols, ",")))

	resp, err := p.HTTPClient.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("backend-price returned status %d", resp.StatusCode)
	}

	var out map[string]pricePoint
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	return out, nil
}
