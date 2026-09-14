package store

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"stocky/backend-go/internal/models"
)

// UpsertSnapshot records today's total portfolio value for a user — called
// by a periodic background job so the dashboard chart has a real time series.
func (s *Store) UpsertSnapshot(userID string, date time.Time, totalValue float64) error {
	day := date.UTC().Format("2006-01-02")
	_, err := s.DB.Exec(`
		INSERT INTO portfolio_snapshots (id, user_id, snapshot_date, total_value)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(user_id, snapshot_date) DO UPDATE SET total_value = excluded.total_value
	`, uuid.NewString(), userID, day, totalValue)
	return err
}

func (s *Store) ChartData(userID string, days int) ([]models.ChartDataPoint, error) {
	rows, err := s.DB.Query(`
		SELECT snapshot_date, total_value
		FROM portfolio_snapshots
		WHERE user_id = ?
		ORDER BY snapshot_date DESC
		LIMIT ?
	`, userID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.ChartDataPoint{}
	for rows.Next() {
		var p models.ChartDataPoint
		if err := rows.Scan(&p.Date, &p.Value); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	// reverse to ascending date order (frontend expects oldest -> newest)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out, nil
}

// YesterdaySnapshotValue returns the most recent snapshot strictly before
// today, used to compute the dashboard's growth percentage.
func (s *Store) YesterdaySnapshotValue(userID string) (float64, error) {
	var v float64
	err := s.DB.QueryRow(`
		SELECT total_value FROM portfolio_snapshots
		WHERE user_id = ? AND snapshot_date < date('now')
		ORDER BY snapshot_date DESC LIMIT 1
	`, userID).Scan(&v)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	return v, err
}
