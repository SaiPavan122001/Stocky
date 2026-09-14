package store

import (
	"github.com/google/uuid"
	"stocky/backend-go/internal/models"
)

func (s *Store) InsertActivity(userID, activityType, symbol string, quantity float64) error {
	_, err := s.DB.Exec(
		`INSERT INTO recent_activity (id, user_id, type, symbol, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
		uuid.NewString(), userID, activityType, symbol, quantity, nowRFC3339(),
	)
	return err
}

func (s *Store) ListRecentActivity(userID string, limit int) ([]models.RecentActivity, error) {
	rows, err := s.DB.Query(`
		SELECT id, type, symbol, quantity, created_at
		FROM recent_activity
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ?
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.RecentActivity{}
	for rows.Next() {
		var a models.RecentActivity
		if err := rows.Scan(&a.ID, &a.Type, &a.Symbol, &a.Quantity, &a.Timestamp); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}
