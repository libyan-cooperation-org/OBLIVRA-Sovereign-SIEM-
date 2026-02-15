package badgerstore_test

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/badgerstore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func tmpStore(t *testing.T) (*badgerstore.Store, func()) {
	t.Helper()
	dir, err := os.MkdirTemp("", "badger-test-*")
	if err != nil {
		t.Fatal(err)
	}
	s, err := badgerstore.Open(dir)
	if err != nil {
		os.RemoveAll(dir)
		t.Fatal(err)
	}
	return s, func() {
		s.Close()
		os.RemoveAll(dir)
	}
}

func makeEvent(ts time.Time) *models.Event {
	return &models.Event{
		ID:        uuid.NewString(),
		Timestamp: ts,
		Source:    "test-source",
		Host:      "test-host",
		Severity:  models.SeverityInfo,
		Message:   "test message",
	}
}

func TestPutAndGetEvent(t *testing.T) {
	s, cleanup := tmpStore(t)
	defer cleanup()

	ev := makeEvent(time.Now())
	if err := s.PutEvent(ev); err != nil {
		t.Fatalf("PutEvent: %v", err)
	}

	got, err := s.GetEvent(ev.ID)
	if err != nil {
		t.Fatalf("GetEvent: %v", err)
	}
	if got.ID != ev.ID {
		t.Errorf("got ID %s, want %s", got.ID, ev.ID)
	}
	if got.Message != ev.Message {
		t.Errorf("got message %q, want %q", got.Message, ev.Message)
	}
}

func TestPutEventBatch(t *testing.T) {
	s, cleanup := tmpStore(t)
	defer cleanup()

	const n = 50
	events := make([]*models.Event, n)
	for i := range events {
		events[i] = makeEvent(time.Now().Add(time.Duration(i) * time.Second))
	}

	if err := s.PutEventBatch(events); err != nil {
		t.Fatalf("PutEventBatch: %v", err)
	}

	ids := make([]string, n)
	for i, ev := range events {
		ids[i] = ev.ID
	}
	got, err := s.GetEvents(ids)
	if err != nil {
		t.Fatalf("GetEvents: %v", err)
	}
	if len(got) != n {
		t.Errorf("got %d events, want %d", len(got), n)
	}
}

func TestQueryTimeRange(t *testing.T) {
	s, cleanup := tmpStore(t)
	defer cleanup()

	base := time.Now().Truncate(time.Hour)
	// Write 10 events spread over 10 hours
	for i := 0; i < 10; i++ {
		if err := s.PutEvent(makeEvent(base.Add(time.Duration(i) * time.Hour))); err != nil {
			t.Fatal(err)
		}
	}

	// Query the middle 5 hours
	start := base.Add(2 * time.Hour)
	end := base.Add(7 * time.Hour)
	results, err := s.QueryTimeRange(start, end, 100)
	if err != nil {
		t.Fatalf("QueryTimeRange: %v", err)
	}
	if len(results) != 5 {
		t.Errorf("got %d results, want 5", len(results))
	}
}

func TestDeleteOlderThan(t *testing.T) {
	s, cleanup := tmpStore(t)
	defer cleanup()

	base := time.Now().Add(-10 * 24 * time.Hour) // 10 days ago
	for i := 0; i < 5; i++ {
		// 5 old events (8-12 days ago)
		if err := s.PutEvent(makeEvent(base.Add(-time.Duration(i)*24*time.Hour))); err != nil {
			t.Fatal(err)
		}
	}
	for i := 0; i < 5; i++ {
		// 5 recent events (within last day)
		if err := s.PutEvent(makeEvent(time.Now().Add(-time.Duration(i)*time.Hour))); err != nil {
			t.Fatal(err)
		}
	}

	cutoff := time.Now().Add(-7 * 24 * time.Hour)
	deleted, err := s.DeleteOlderThan(cutoff)
	if err != nil {
		t.Fatalf("DeleteOlderThan: %v", err)
	}
	if deleted != 5 {
		t.Errorf("deleted %d, want 5", deleted)
	}

	// Recent events should still be there
	recent, err := s.QueryTimeRange(time.Now().Add(-2*time.Hour), time.Now(), 100)
	if err != nil {
		t.Fatalf("QueryTimeRange after delete: %v", err)
	}
	if len(recent) != 2 {
		t.Errorf("got %d recent events after purge, want 2", len(recent))
	}
}

func TestStats(t *testing.T) {
	s, cleanup := tmpStore(t)
	defer cleanup()

	for i := 0; i < 10; i++ {
		_ = s.PutEvent(makeEvent(time.Now()))
	}
	stats := s.Stats()
	fmt.Printf("BadgerDB stats: LSM=%d VLog=%d\n", stats.LSMBytes, stats.VLogBytes)
	// Just assert it doesn't panic and returns something
}
