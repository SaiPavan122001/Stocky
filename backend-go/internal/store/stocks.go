package store

import (
	"time"

	"stocky/backend-go/internal/models"
)

func (s *Store) ListStocks() ([]models.Stock, error) {
	rows, err := s.DB.Query(`
		SELECT st.symbol, st.name,
		       COALESCE(pc.current_price, 0), COALESCE(pc.change, 0), COALESCE(pc.change_percent, 0)
		FROM stocks st
		LEFT JOIN price_cache pc ON pc.symbol = st.symbol
		WHERE st.is_active = 1
		ORDER BY st.symbol
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.Stock{}
	for rows.Next() {
		var st models.Stock
		if err := rows.Scan(&st.Symbol, &st.Name, &st.CurrentPrice, &st.Change, &st.ChangePercent); err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

// UpsertPrice is called by the price poller (internal/priceclient) to record
// the latest fetched price for a symbol.
func (s *Store) UpsertPrice(symbol string, currentPrice, change, changePercent float64) error {
	_, err := s.DB.Exec(`
		INSERT INTO price_cache (symbol, current_price, change, change_percent, fetched_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(symbol) DO UPDATE SET
			current_price = excluded.current_price,
			change = excluded.change,
			change_percent = excluded.change_percent,
			fetched_at = excluded.fetched_at
	`, symbol, currentPrice, change, changePercent, time.Now().UTC().Format(time.RFC3339))
	return err
}

func (s *Store) ListActiveSymbols() ([]string, error) {
	rows, err := s.DB.Query(`SELECT symbol FROM stocks WHERE is_active = 1`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []string
	for rows.Next() {
		var sym string
		if err := rows.Scan(&sym); err != nil {
			return nil, err
		}
		out = append(out, sym)
	}
	return out, rows.Err()
}
