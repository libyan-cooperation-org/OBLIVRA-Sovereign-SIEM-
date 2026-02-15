package fim

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// IngestionHandler defines how FIM events are ingested into the SIEM.
type IngestionHandler func(ctx context.Context, ev *models.Event) error

// BaselineStore is a minimal interface for persisting FIM hashes across restarts.
type BaselineStore interface {
	UpsertFimBaseline(path, hash string) error
	GetFimBaseline(path string) (string, error)
}

// FimManager monitors file system integrity.
type Manager struct {
	watcher   *fsnotify.Watcher
	baselines map[string]string
	handler   IngestionHandler
	store     BaselineStore // optional — nil if not provided
	mu        sync.RWMutex
}

// NewManager creates a new FIM Manager.
func NewManager(handler IngestionHandler) (*Manager, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("fim: failed to create watcher: %w", err)
	}

	return &Manager{
		watcher:   watcher,
		baselines: make(map[string]string),
		handler:   handler,
	}, nil
}

// SetStore attaches a persistence backend for baseline hashes.
// Call before AddPath so existing hashes can be loaded on restart.
func (m *Manager) SetStore(s BaselineStore) {
	m.mu.Lock()
	m.store = s
	m.mu.Unlock()
}

// AddPath adds a path to the FIM watchlist and loads its stored baseline hash.
func (m *Manager) AddPath(path string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	// Try loading previously stored hash first (survives restarts)
	var storedHash string
	if m.store != nil {
		storedHash, _ = m.store.GetFimBaseline(absPath)
	}

	// Fall back to computing current hash
	if storedHash == "" {
		storedHash, _ = HashFile(absPath)
		if storedHash != "" && m.store != nil {
			_ = m.store.UpsertFimBaseline(absPath, storedHash)
		}
	}

	m.baselines[absPath] = storedHash
	log.Printf("FIM: Watching %s (Hash: %s…)", absPath, storedHash[:min(8, len(storedHash))])
	return m.watcher.Add(absPath)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Start begins processing watcher events.
func (m *Manager) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				m.watcher.Close()
				return
			case event, ok := <-m.watcher.Events:
				if !ok {
					return
				}
				m.handleFsEvent(ctx, event)
			case err, ok := <-m.watcher.Errors:
				if !ok {
					return
				}
				log.Printf("FIM Error: %v", err)
			}
		}
	}()
}

func (m *Manager) handleFsEvent(ctx context.Context, fsevent fsnotify.Event) {
	m.mu.Lock()
	defer m.mu.Unlock()

	path := fsevent.Name
	oldHash := m.baselines[path]
	newHash, _ := HashFile(path)

	// Determine operation
	op := "Modified"
	severity := models.SeverityHigh

	if fsevent.Op&fsnotify.Create == fsnotify.Create {
		op = "Created"
	} else if fsevent.Op&fsnotify.Remove == fsnotify.Remove {
		op = "Deleted"
		severity = models.SeverityCritical
		delete(m.baselines, path)
	} else if fsevent.Op&fsnotify.Rename == fsnotify.Rename {
		op = "Renamed"
		delete(m.baselines, path)
	} else if fsevent.Op&fsnotify.Write == fsnotify.Write {
		if oldHash == newHash {
			return // Metadata change only, ignore if content is same
		}
		m.baselines[path] = newHash
		if m.store != nil {
			_ = m.store.UpsertFimBaseline(path, newHash)
		}
	}

	// Create SIEM Event
	ev := &models.Event{
		ID:        fmt.Sprintf("fim_%d", time.Now().UnixNano()),
		Timestamp: time.Now(),
		Source:    "FIM",
		Host:      "localhost", // Local FIM
		Category:  "File Integrity",
		Severity:  severity,
		Message:   fmt.Sprintf("File %s: %s", op, path),
		Fields: map[string]interface{}{
			"path":     path,
			"op":       op,
			"old_hash": oldHash,
			"new_hash": newHash,
		},
	}

	if err := m.handler(ctx, ev); err != nil {
		log.Printf("FIM: failed to ingest event: %v", err)
	}
}
