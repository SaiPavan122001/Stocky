package db

import (
	"database/sql"
	_ "embed"
	"fmt"

	_ "modernc.org/sqlite"
)

//go:embed migrations/0001_init.sql
var initSchema string

// Open opens the SQLite database at path, enables foreign keys, and applies
// the embedded schema (idempotent: uses CREATE TABLE IF NOT EXISTS / INSERT
// OR IGNORE, safe to run on every startup).
func Open(path string) (*sql.DB, error) {
	conn, err := sql.Open("sqlite", path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	// SQLite only allows one writer at a time; keep a single connection to
	// avoid "database is locked" errors under concurrent requests.
	conn.SetMaxOpenConns(1)

	if _, err := conn.Exec(initSchema); err != nil {
		conn.Close()
		return nil, fmt.Errorf("apply schema: %w", err)
	}

	return conn, nil
}
