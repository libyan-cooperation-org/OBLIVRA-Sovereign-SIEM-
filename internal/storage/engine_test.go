package storage_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/config"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func tmpEngine(t *testing.T) (*storage.Engine, func()) {
	t.Helper()
	dir, err := os.MkdirTemp("", "engine-test-*")
	if err != nil {
		t.Fatal(err)
	}

	cfg := &config.Config{
		Storage: config.StorageConfig{
			BasePath:  dir,
			Retention: 30,
		},
	}

	eng, err := storage.Open(context.Background(), cfg)
	if err != nil {
		os.RemoveAll(dir)
		t.Fatal(err)
	}

	return eng, func() {
		eng.Close()
		os.RemoveAll(dir)
	}
}

// TestWriteAndSearch is the primary integration test: write events, search by
// full text, keyword filter, and time range.
func TestWriteAndSearch(t *testing.T) {
	eng, cleanup := tmpEngine(t)
	defer cleanup()

	ctx := context.Background()
	now := time.Now()

	events := []*models.Event{
		{ID: uuid.NewString(), Timestamp: now.Add(-10 * time.Minute),
			Source: "firewall", Host: "fw-01", Severity: models.SeverityCritical,
			Message: "Blocked inbound connection from 185.220.101.34 on port 22"},
		{ID: uuid.NewString(), Timestamp: now.Add(-5 * time.Minute),
			Source: "syslog", Host: "srv-dc-01", Severity: models.SeverityHigh,
			Message: "Failed password for root from 10.0.0.99"},
		{ID: uuid.NewString(), Timestamp: now.Add(-1 * time.Minute),
			Source: "syslog", Host: "srv-dc-01", Severity: models.SeverityInfo,
			Message: "System health check completed successfully"},
	}

	for _, ev := range events {
		if err := eng.WriteEvent(ctx, ev); err != nil {
			t.Fatalf("WriteEvent: %v", err)
		}
	}

	t.Run("full text search", func(t *testing.T) {
		results, err := eng.SearchEvents(ctx, &storage.SearchQuery{Text: "Failed password"})
		if err != nil {
			t.Fatal(err)
		}
		if len(results) != 1 {
			t.Errorf("want 1 result, got %d", len(results))
		}
	})

	t.Run("source keyword filter", func(t *testing.T) {
		results, err := eng.SearchEvents(ctx, &storage.SearchQuery{Source: "firewall"})
		if err != nil {
			t.Fatal(err)
		}
		if len(results) != 1 {
			t.Errorf("want 1 firewall event, got %d", len(results))
		}
	})

	t.Run("severity filter", func(t *testing.T) {
		results, err := eng.SearchEvents(ctx, &storage.SearchQuery{Severity: "CRITICAL"})
		if err != nil {
			t.Fatal(err)
		}
		if len(results) != 1 {
			t.Errorf("want 1 critical event, got %d", len(results))
		}
	})

	t.Run("time range", func(t *testing.T) {
		results, err := eng.SearchEvents(ctx, &storage.SearchQuery{
			StartTime: now.Add(-6 * time.Minute).UnixNano(),
			EndTime:   now.UnixNano(),
		})
		if err != nil {
			t.Fatal(err)
		}
		if len(results) != 2 {
			t.Errorf("want 2 recent events, got %d", len(results))
		}
	})

	t.Run("match all", func(t *testing.T) {
		results, err := eng.SearchEvents(ctx, &storage.SearchQuery{})
		if err != nil {
			t.Fatal(err)
		}
		if len(results) != 3 {
			t.Errorf("want 3 total events, got %d", len(results))
		}
	})
}

func TestWriteBatch(t *testing.T) {
	eng, cleanup := tmpEngine(t)
	defer cleanup()

	ctx := context.Background()
	const n = 100
	events := make([]*models.Event, n)
	for i := range events {
		events[i] = &models.Event{
			ID:        uuid.NewString(),
			Timestamp: time.Now().Add(time.Duration(i) * time.Second),
			Source:    "batch-test",
			Host:      "host-batch",
			Severity:  models.SeverityInfo,
			Message:   "batch event",
		}
	}

	if err := eng.WriteEventBatch(ctx, events); err != nil {
		t.Fatalf("WriteEventBatch: %v", err)
	}

	results, err := eng.SearchEvents(ctx, &storage.SearchQuery{Source: "batch-test", Limit: 200})
	if err != nil {
		t.Fatal(err)
	}
	if len(results) != n {
		t.Errorf("want %d results, got %d", n, len(results))
	}
}

func TestStorageStats(t *testing.T) {
	eng, cleanup := tmpEngine(t)
	defer cleanup()

	for i := 0; i < 10; i++ {
		_ = eng.WriteEvent(context.Background(), &models.Event{
			ID:        uuid.NewString(),
			Timestamp: time.Now(),
			Source:    "stats-test",
			Message:   "test",
		})
	}

	stats := eng.Stats()
	t.Logf("StorageStats: %+v", stats)
	// Just confirm it doesn't panic
}

func TestDirectoriesCreated(t *testing.T) {
	dir, err := os.MkdirTemp("", "engine-dir-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	cfg := &config.Config{
		Storage: config.StorageConfig{BasePath: dir, Retention: 30},
	}
	eng, err := storage.Open(context.Background(), cfg)
	if err != nil {
		t.Fatal(err)
	}
	eng.Close()

	for _, sub := range []string{
		filepath.Join(dir, "badger", "hot"),
		filepath.Join(dir, "bluge"),
		filepath.Join(dir, "sqlite"),
	} {
		if _, err := os.Stat(sub); os.IsNotExist(err) {
			t.Errorf("expected directory %s to exist", sub)
		}
	}
}
