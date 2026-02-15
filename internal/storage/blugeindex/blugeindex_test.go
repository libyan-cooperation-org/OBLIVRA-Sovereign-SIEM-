package blugeindex_test

import (
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/blugeindex"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func tmpIndex(t *testing.T) (*blugeindex.Index, func()) {
	t.Helper()
	dir, err := os.MkdirTemp("", "bluge-test-*")
	if err != nil {
		t.Fatal(err)
	}
	idx, err := blugeindex.Open(dir)
	if err != nil {
		os.RemoveAll(dir)
		t.Fatal(err)
	}
	return idx, func() {
		idx.Close()
		os.RemoveAll(dir)
	}
}

func makeEvent(id, source, host, severity, message string, ts time.Time) *models.Event {
	return &models.Event{
		ID:        id,
		Source:    source,
		Host:      host,
		Severity:  models.Severity(severity),
		Message:   message,
		Timestamp: ts,
	}
}

func TestIndexAndSearch_FullText(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	id := uuid.NewString()
	ev := makeEvent(id, "firewall", "srv-dc-01", "HIGH",
		"Failed password for root from 185.220.101.34", time.Now())

	if err := idx.IndexEvent(ev); err != nil {
		t.Fatalf("IndexEvent: %v", err)
	}

	ids, err := idx.Search(&blugeindex.Query{Text: "Failed password"})
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(ids) != 1 || ids[0] != id {
		t.Errorf("expected [%s], got %v", id, ids)
	}
}

func TestSearch_KeywordFilter_Source(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	id1 := uuid.NewString()
	id2 := uuid.NewString()
	_ = idx.IndexEvent(makeEvent(id1, "firewall", "host-a", "INFO", "packet dropped", time.Now()))
	_ = idx.IndexEvent(makeEvent(id2, "syslog", "host-b", "WARN", "disk usage high", time.Now()))

	ids, err := idx.Search(&blugeindex.Query{Source: "firewall"})
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(ids) != 1 || ids[0] != id1 {
		t.Errorf("expected [%s], got %v", id1, ids)
	}
}

func TestSearch_SeverityFilter(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	ids := []string{uuid.NewString(), uuid.NewString(), uuid.NewString()}
	_ = idx.IndexEvent(makeEvent(ids[0], "src", "h1", "CRITICAL", "ransomware enc", time.Now()))
	_ = idx.IndexEvent(makeEvent(ids[1], "src", "h2", "INFO", "heartbeat", time.Now()))
	_ = idx.IndexEvent(makeEvent(ids[2], "src", "h3", "CRITICAL", "lateral move", time.Now()))

	got, err := idx.Search(&blugeindex.Query{Severity: "CRITICAL"})
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("expected 2 CRITICAL results, got %d", len(got))
	}
}

func TestSearch_TimeRange(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	base := time.Now().Truncate(time.Minute)
	old := uuid.NewString()
	recent := uuid.NewString()

	_ = idx.IndexEvent(makeEvent(old, "src", "h1", "INFO", "old event", base.Add(-2*time.Hour)))
	_ = idx.IndexEvent(makeEvent(recent, "src", "h2", "INFO", "recent event", base.Add(-5*time.Minute)))

	q := &blugeindex.Query{
		StartTime: base.Add(-30 * time.Minute).UnixNano(),
		EndTime:   base.UnixNano(),
	}
	got, err := idx.Search(q)
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(got) != 1 || got[0] != recent {
		t.Errorf("expected [%s], got %v", recent, got)
	}
}

func TestSearch_MatchAll(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	for i := 0; i < 5; i++ {
		_ = idx.IndexEvent(makeEvent(uuid.NewString(), "src", "host", "INFO",
			"event message", time.Now()))
	}

	got, err := idx.Search(&blugeindex.Query{})
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(got) != 5 {
		t.Errorf("expected 5 results, got %d", len(got))
	}
}

func TestDeleteEvent(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	id := uuid.NewString()
	_ = idx.IndexEvent(makeEvent(id, "src", "host", "INFO", "to be deleted", time.Now()))

	// Confirm it exists
	got, err := idx.Search(&blugeindex.Query{})
	if err != nil || len(got) != 1 {
		t.Fatalf("pre-delete search failed: %v %v", err, got)
	}

	if err := idx.DeleteEvent(id); err != nil {
		t.Fatalf("DeleteEvent: %v", err)
	}

	got, err = idx.Search(&blugeindex.Query{})
	if err != nil {
		t.Fatalf("post-delete search: %v", err)
	}
	if len(got) != 0 {
		t.Errorf("expected 0 results after delete, got %d", len(got))
	}
}

func TestBatchIndex(t *testing.T) {
	idx, cleanup := tmpIndex(t)
	defer cleanup()

	const n = 20
	events := make([]*models.Event, n)
	for i := range events {
		events[i] = makeEvent(uuid.NewString(), "batch-src", "host", "INFO",
			"batch event", time.Now())
	}
	if err := idx.IndexEventBatch(events); err != nil {
		t.Fatalf("IndexEventBatch: %v", err)
	}

	got, err := idx.Search(&blugeindex.Query{Source: "batch-src", Limit: 100})
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(got) != n {
		t.Errorf("expected %d results, got %d", n, len(got))
	}
}
