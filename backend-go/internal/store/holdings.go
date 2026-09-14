package store

import (
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"stocky/backend-go/internal/models"
)

func (s *Store) ListHoldings(userID string) ([]models.Holding, error) {
	rows, err := s.DB.Query(`
		SELECT h.symbol, st.name, h.quantity, h.avg_price, COALESCE(pc.current_price, h.avg_price)
		FROM holdings h
		JOIN stocks st ON st.symbol = h.symbol
		LEFT JOIN price_cache pc ON pc.symbol = h.symbol
		WHERE h.user_id = ?
		ORDER BY h.symbol
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.Holding{}
	for rows.Next() {
		var h models.Holding
		if err := rows.Scan(&h.Symbol, &h.Name, &h.Quantity, &h.AvgPrice, &h.CurrentPrice); err != nil {
			return nil, err
		}
		h.TotalValue = h.Quantity * h.CurrentPrice
		costBasis := h.Quantity * h.AvgPrice
		h.Pnl = h.TotalValue - costBasis
		if costBasis > 0 {
			h.PnlPercent = (h.Pnl / costBasis) * 100
		}
		out = append(out, h)
	}
	return out, rows.Err()
}

// TotalPortfolioValue sums quantity*currentPrice across all of a user's holdings.
func (s *Store) TotalPortfolioValue(userID string) (float64, float64, error) {
	var totalValue, totalShares float64
	err := s.DB.QueryRow(`
		SELECT COALESCE(SUM(h.quantity * COALESCE(pc.current_price, h.avg_price)), 0),
		       COALESCE(SUM(h.quantity), 0)
		FROM holdings h
		LEFT JOIN price_cache pc ON pc.symbol = h.symbol
		WHERE h.user_id = ?
	`, userID).Scan(&totalValue, &totalShares)
	return totalValue, totalShares, err
}

// AddToHolding upserts a holding, weighting the average price by quantity —
// used when a claimed reward is credited into the user's holdings.
func (s *Store) AddToHolding(userID, symbol string, quantity, price float64) error {
	var existingQty, existingAvg float64
	err := s.DB.QueryRow(
		`SELECT quantity, avg_price FROM holdings WHERE user_id = ? AND symbol = ?`,
		userID, symbol,
	).Scan(&existingQty, &existingAvg)

	if err == nil {
		newQty := existingQty + quantity
		newAvg := ((existingQty * existingAvg) + (quantity * price)) / newQty
		_, err = s.DB.Exec(
			`UPDATE holdings SET quantity = ?, avg_price = ?, updated_at = ? WHERE user_id = ? AND symbol = ?`,
			newQty, newAvg, nowRFC3339(), userID, symbol,
		)
		return err
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	_, err = s.DB.Exec(
		`INSERT INTO holdings (id, user_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?, ?)`,
		uuid.NewString(), userID, symbol, quantity, price,
	)
	return err
}
