// Package store contains all SQL data access, hand-written against
// database/sql (no ORM/codegen) to keep the dependency footprint small.
package store

import "database/sql"

type Store struct {
	DB *sql.DB
}

func New(db *sql.DB) *Store {
	return &Store{DB: db}
}
