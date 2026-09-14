package store

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"stocky/backend-go/internal/auth"
)

func (s *Store) SaveRefreshToken(userID, tokenHash string, expiresAt time.Time) error {
	_, err := s.DB.Exec(
		`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
		uuid.NewString(), userID, tokenHash, expiresAt.UTC().Format(time.RFC3339),
	)
	return err
}

// ConsumeRefreshToken validates a presented refresh token (by its hash),
// revokes it (rotation), and returns the owning user id.
func (s *Store) ConsumeRefreshToken(plainToken string) (string, error) {
	hash := auth.HashRefreshToken(plainToken)

	var id, userID, expiresAt string
	var revokedAt sql.NullString
	err := s.DB.QueryRow(
		`SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?`,
		hash,
	).Scan(&id, &userID, &expiresAt, &revokedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	if revokedAt.Valid {
		return "", errors.New("token already used")
	}
	exp, err := time.Parse(time.RFC3339, expiresAt)
	if err != nil || time.Now().After(exp) {
		return "", errors.New("token expired")
	}

	if _, err := s.DB.Exec(
		`UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?`,
		time.Now().UTC().Format(time.RFC3339), id,
	); err != nil {
		return "", err
	}
	return userID, nil
}

func (s *Store) RevokeRefreshToken(plainToken string) error {
	hash := auth.HashRefreshToken(plainToken)
	_, err := s.DB.Exec(
		`UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`,
		time.Now().UTC().Format(time.RFC3339), hash,
	)
	return err
}
