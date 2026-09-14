package store

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"stocky/backend-go/internal/models"
)

var ErrNotFound = errors.New("not found")
var ErrDuplicate = errors.New("already exists")

func (s *Store) CreateUser(email, passwordHash, displayName string) (models.User, error) {
	id := uuid.NewString()
	_, err := s.DB.Exec(
		`INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)`,
		id, email, passwordHash, displayName,
	)
	if err != nil {
		if isUniqueConstraintErr(err) {
			return models.User{}, ErrDuplicate
		}
		return models.User{}, err
	}
	return models.User{ID: id, Email: email, DisplayName: displayName}, nil
}

func (s *Store) GetUserByEmail(email string) (models.User, string, error) {
	var u models.User
	var passwordHash string
	err := s.DB.QueryRow(
		`SELECT id, email, password_hash, COALESCE(display_name, '') FROM users WHERE email = ?`,
		email,
	).Scan(&u.ID, &u.Email, &passwordHash, &u.DisplayName)
	if errors.Is(err, sql.ErrNoRows) {
		return models.User{}, "", ErrNotFound
	}
	return u, passwordHash, err
}

func (s *Store) GetUserByID(id string) (models.User, error) {
	var u models.User
	err := s.DB.QueryRow(
		`SELECT id, email, COALESCE(display_name, '') FROM users WHERE id = ?`, id,
	).Scan(&u.ID, &u.Email, &u.DisplayName)
	if errors.Is(err, sql.ErrNoRows) {
		return models.User{}, ErrNotFound
	}
	return u, err
}

func isUniqueConstraintErr(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}

func (s *Store) ListUserIDs() ([]string, error) {
	rows, err := s.DB.Query(`SELECT id FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// nowRFC3339 is a small helper used by other files in this package to format
// timestamps consistently (RFC3339, matching what the frontend expects).
func nowRFC3339() string {
	return time.Now().UTC().Format(time.RFC3339)
}
