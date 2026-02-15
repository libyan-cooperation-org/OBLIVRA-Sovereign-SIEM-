// Package badgerstore wraps BadgerDB for high-throughput raw event storage.
// Events are serialised to JSON and keyed as "evt:{unix-nano-15-digits}:{id}"
// so lexicographic order equals chronological order — time-range scans are O(log n).
package badgerstore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	badger "github.com/dgraph-io/badger/v4"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

const (
	evtPrefix  = "evt:"
	gcInterval = 5 * time.Minute
)

// Store wraps BadgerDB with OBLIVRA event helpers.
type Store struct {
	db *badger.DB
}

// Open creates the data directory if needed and opens BadgerDB.
func Open(path string) (*Store, error) {
	if err := os.MkdirAll(path, 0o700); err != nil {
		return nil, fmt.Errorf("badgerstore: mkdir %s: %w", path, err)
	}

	opts := badger.DefaultOptions(path).
		WithLogger(nil).
		WithCompression(1).              // Snappy
		WithValueLogFileSize(256 << 20). // 256 MB segments
		WithMemTableSize(64 << 20).
		WithNumVersionsToKeep(1) // events are immutable

	db, err := badger.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("badgerstore: open: %w", err)
	}

	s := &Store{db: db}
	go s.runGC()
	return s, nil
}

// PutEvent serialises and writes a single event atomically.
func (s *Store) PutEvent(ev *models.Event) error {
	val, err := json.Marshal(ev)
	if err != nil {
		return fmt.Errorf("badgerstore: marshal %s: %w", ev.ID, err)
	}
	return s.db.Update(func(txn *badger.Txn) error {
		return txn.Set(eventKey(ev.Timestamp, ev.ID), val)
	})
}

// PutEventBatch writes a slice of events using BadgerDB's write-batch API.
// Internally splits if the transaction size limit is exceeded.
func (s *Store) PutEventBatch(events []*models.Event) error {
	wb := s.db.NewWriteBatch()
	defer wb.Cancel()
	for _, ev := range events {
		val, err := json.Marshal(ev)
		if err != nil {
			return fmt.Errorf("badgerstore: marshal %s: %w", ev.ID, err)
		}
		if err := wb.Set(eventKey(ev.Timestamp, ev.ID), val); err != nil {
			return fmt.Errorf("badgerstore: batch set: %w", err)
		}
	}
	return wb.Flush()
}

// GetEvent retrieves one event by its ID via a prefix scan.
func (s *Store) GetEvent(id string) (*models.Event, error) {
	var ev models.Event
	found := false
	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.Prefix = []byte(evtPrefix)
		it := txn.NewIterator(opts)
		defer it.Close()
		suffix := []byte(":" + id)
		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()
			if bytes.HasSuffix(item.Key(), suffix) {
				found = true
				return item.Value(func(v []byte) error {
					return json.Unmarshal(v, &ev)
				})
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("badgerstore: get %s: %w", id, err)
	}
	if !found {
		return nil, fmt.Errorf("badgerstore: event %s not found", id)
	}
	return &ev, nil
}

// GetEvents retrieves multiple events by ID in one read transaction.
// IDs not found are silently skipped.
func (s *Store) GetEvents(ids []string) ([]*models.Event, error) {
	idSet := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		idSet[id] = struct{}{}
	}
	var results []*models.Event
	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.Prefix = []byte(evtPrefix)
		it := txn.NewIterator(opts)
		defer it.Close()
		for it.Rewind(); it.Valid() && len(results) < len(ids); it.Next() {
			item := it.Item()
			// Key: "evt:{ts}:{id}" — id is after the second colon
			parts := strings.SplitN(string(item.Key()), ":", 3)
			if len(parts) != 3 {
				continue
			}
			if _, ok := idSet[parts[2]]; !ok {
				continue
			}
			var ev models.Event
			if err := item.Value(func(v []byte) error {
				return json.Unmarshal(v, &ev)
			}); err != nil {
				continue
			}
			results = append(results, &ev)
		}
		return nil
	})
	return results, err
}

// QueryTimeRange returns events in [start, end], up to limit.
func (s *Store) QueryTimeRange(start, end time.Time, limit int) ([]*models.Event, error) {
	if limit <= 0 {
		limit = 500
	}
	startKey := eventKey(start, "")
	endNano := end.UnixNano()
	var results []*models.Event
	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.Prefix = []byte(evtPrefix)
		it := txn.NewIterator(opts)
		defer it.Close()
		for it.Seek(startKey); it.Valid() && len(results) < limit; it.Next() {
			item := it.Item()
			parts := strings.SplitN(string(item.Key()), ":", 3)
			if len(parts) < 2 {
				continue
			}
			tsNano, err := strconv.ParseInt(parts[1], 10, 64)
			if err != nil || tsNano >= endNano {
				break
			}
			var ev models.Event
			if err := item.Value(func(v []byte) error {
				return json.Unmarshal(v, &ev)
			}); err != nil {
				continue
			}
			results = append(results, &ev)
		}
		return nil
	})
	return results, err
}

// DeleteOlderThan deletes all events timestamped before cutoff.
// Returns the number of keys deleted.
func (s *Store) DeleteOlderThan(cutoff time.Time) (int, error) {
	cutoffKey := eventKey(cutoff, "")
	var keys [][]byte
	if err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.Prefix = []byte(evtPrefix)
		opts.PrefetchValues = false
		it := txn.NewIterator(opts)
		defer it.Close()
		for it.Rewind(); it.Valid(); it.Next() {
			k := it.Item().KeyCopy(nil)
			if bytes.Compare(k, cutoffKey) < 0 {
				keys = append(keys, k)
			}
		}
		return nil
	}); err != nil {
		return 0, err
	}
	wb := s.db.NewWriteBatch()
	for _, k := range keys {
		if err := wb.Delete(k); err != nil {
			wb.Cancel()
			return 0, fmt.Errorf("badgerstore: delete: %w", err)
		}
	}
	return len(keys), wb.Flush()
}

// Stats returns on-disk size metrics.
func (s *Store) Stats() StoreStats {
	lsm, vlog := s.db.Size()
	return StoreStats{LSMBytes: lsm, VLogBytes: vlog}
}

// Close flushes pending writes and closes the DB.
func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) runGC() {
	t := time.NewTicker(gcInterval)
	defer t.Stop()
	for range t.C {
		for s.db.RunValueLogGC(0.7) == nil {
		}
	}
}

// eventKey builds a lexicographically time-ordered key.
func eventKey(ts time.Time, id string) []byte {
	return []byte(fmt.Sprintf("%s%015d:%s", evtPrefix, ts.UnixNano(), id))
}

// StoreStats holds size metrics returned to the dashboard.
type StoreStats struct {
	LSMBytes  int64
	VLogBytes int64
}
