package store

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"stocky/backend-go/internal/models"
)

func (s *Store) CreateReward(userID, symbol string, quantity float64) (models.Reward, error) {
	var name string
	if err := s.DB.QueryRow(`SELECT name FROM stocks WHERE symbol = ?`, symbol).Scan(&name); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Reward{}, ErrNotFound
		}
		return models.Reward{}, err
	}

	id := uuid.NewString()
	now := nowRFC3339()
	_, err := s.DB.Exec(
		`INSERT INTO rewards (id, user_id, symbol, quantity, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`,
		id, userID, symbol, quantity, now,
	)
	if err != nil {
		return models.Reward{}, err
	}
	return models.Reward{ID: id, Symbol: symbol, Name: name, Quantity: quantity, Status: "pending", Timestamp: now}, nil
}

func (s *Store) listRewards(userID, extraWhere string) ([]models.Reward, error) {
	rows, err := s.DB.Query(`
		SELECT r.id, r.symbol, st.name, r.quantity, r.status, r.created_at
		FROM rewards r
		JOIN stocks st ON st.symbol = r.symbol
		WHERE r.user_id = ? `+extraWhere+`
		ORDER BY r.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.Reward{}
	for rows.Next() {
		var r models.Reward
		if err := rows.Scan(&r.ID, &r.Symbol, &r.Name, &r.Quantity, &r.Status, &r.Timestamp); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) ListTodayRewards(userID string) ([]models.Reward, error) {
	return s.listRewards(userID, "AND date(r.created_at) = date('now')")
}

func (s *Store) ListAllRewards(userID string) ([]models.Reward, error) {
	return s.listRewards(userID, "")
}

func (s *Store) CountTodayRewards(userID string) (int, error) {
	var n int
	err := s.DB.QueryRow(
		`SELECT COUNT(*) FROM rewards WHERE user_id = ? AND date(created_at) = date('now')`,
		userID,
	).Scan(&n)
	return n, err
}

func (s *Store) UpdateRewardStatus(rewardID, status string) error {
	_, err := s.DB.Exec(`UPDATE rewards SET status = ? WHERE id = ?`, status, rewardID)
	return err
}

// InFlightReward is a reward not yet in its terminal "credited" state,
// as seen by the background reward-settlement worker.
type InFlightReward struct {
	ID        string
	UserID    string
	Symbol    string
	Quantity  float64
	Status    string
	CreatedAt time.Time
}

// ListInFlightRewards returns every pending/processing reward, for the
// background worker to advance through pending -> processing -> credited.
func (s *Store) ListInFlightRewards() ([]InFlightReward, error) {
	rows, err := s.DB.Query(`
		SELECT id, user_id, symbol, quantity, status, created_at
		FROM rewards WHERE status IN ('pending', 'processing')
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []InFlightReward{}
	for rows.Next() {
		var rw InFlightReward
		var createdAt string
		if err := rows.Scan(&rw.ID, &rw.UserID, &rw.Symbol, &rw.Quantity, &rw.Status, &createdAt); err != nil {
			return nil, err
		}
		rw.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		out = append(out, rw)
	}
	return out, rows.Err()
}

// CurrentPrice returns the latest cached price for a symbol, falling back
// to 0 if none has been fetched yet.
func (s *Store) CurrentPrice(symbol string) (float64, error) {
	var price float64
	err := s.DB.QueryRow(`SELECT current_price FROM price_cache WHERE symbol = ?`, symbol).Scan(&price)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	return price, err
}
