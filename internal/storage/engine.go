// Package storage defines the unified storage coordinator for OBLIVRA.
// It wires together three engines:
//   - BadgerDB  (badgerstore)  — raw event storage, time-ordered key-value
//   - Bluge     (blugeindex)   — full-text inverted index for sub-100ms search
//   - SQLite    (sqlitestore)  — relational metadata: alerts, cases, assets, agents, rules
package storage

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/config"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/badgerstore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/blugeindex"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Engine is the top-level storage coordinator.
// All callers import this package; the sub-packages are internal implementation.
type Engine struct {
	Badger *badgerstore.Store
	Bluge  *blugeindex.Index
	SQLite *sqlitestore.DB
}

// SearchQuery is the public search API exposed to the Wails frontend.
// It is translated to blugeindex.Query before being passed to Bluge.
type SearchQuery struct {
	Text      string // full-text search on message field
	Source    string // exact keyword filter
	Host      string // exact keyword filter
	Severity  string // exact keyword filter
	StartTime int64  // unix nano (0 = no lower bound)
	EndTime   int64  // unix nano (0 = no upper bound)
	Limit     int    // 0 → default 200
}

// Open initialises all three storage engines from config.
// All required directories are created automatically.
func Open(ctx context.Context, cfg *config.Config) (*Engine, error) {
	base := cfg.Storage.BasePath

	bstore, err := badgerstore.Open(filepath.Join(base, "badger", "hot"))
	if err != nil {
		return nil, fmt.Errorf("storage: open badger: %w", err)
	}

	bidx, err := blugeindex.Open(filepath.Join(base, "bluge"))
	if err != nil {
		_ = bstore.Close()
		return nil, fmt.Errorf("storage: open bluge: %w", err)
	}

	sdb, err := sqlitestore.Open(filepath.Join(base, "sqlite", "oblivra.db"))
	if err != nil {
		_ = bstore.Close()
		_ = bidx.Close()
		return nil, fmt.Errorf("storage: open sqlite: %w", err)
	}

	return &Engine{
		Badger: bstore,
		Bluge:  bidx,
		SQLite: sdb,
	}, nil
}

// WriteEvent writes a single event to BadgerDB (raw) and Bluge (index).
func (e *Engine) WriteEvent(ctx context.Context, ev *models.Event) error {
	if err := e.Badger.PutEvent(ev); err != nil {
		return fmt.Errorf("storage: badger write: %w", err)
	}
	if err := e.Bluge.IndexEvent(ev); err != nil {
		return fmt.Errorf("storage: bluge index: %w", err)
	}
	return nil
}

// WriteEventBatch writes a batch of events atomically to both stores.
func (e *Engine) WriteEventBatch(ctx context.Context, events []*models.Event) error {
	if err := e.Badger.PutEventBatch(events); err != nil {
		return fmt.Errorf("storage: badger batch: %w", err)
	}
	if err := e.Bluge.IndexEventBatch(events); err != nil {
		return fmt.Errorf("storage: bluge batch: %w", err)
	}
	return nil
}

// SearchEvents executes a query: Bluge returns IDs, BadgerDB returns full payloads.
func (e *Engine) SearchEvents(ctx context.Context, q *SearchQuery) ([]*models.Event, error) {
	ids, err := e.Bluge.Search(&blugeindex.Query{
		Text:      q.Text,
		Source:    q.Source,
		Host:      q.Host,
		Severity:  q.Severity,
		StartTime: q.StartTime,
		EndTime:   q.EndTime,
		Limit:     q.Limit,
	})
	if err != nil {
		return nil, fmt.Errorf("storage: bluge search: %w", err)
	}
	if len(ids) == 0 {
		return nil, nil
	}
	return e.Badger.GetEvents(ids)
}

// Close shuts down all three engines gracefully.
func (e *Engine) Close() error {
	var errs []error
	if err := e.Bluge.Close(); err != nil {
		errs = append(errs, fmt.Errorf("bluge: %w", err))
	}
	if err := e.Badger.Close(); err != nil {
		errs = append(errs, fmt.Errorf("badger: %w", err))
	}
	if err := e.SQLite.Close(); err != nil {
		errs = append(errs, fmt.Errorf("sqlite: %w", err))
	}
	if len(errs) > 0 {
		return fmt.Errorf("storage close errors: %v", errs)
	}
	return nil
}
