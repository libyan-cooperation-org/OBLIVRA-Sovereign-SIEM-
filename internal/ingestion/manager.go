package ingestion

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/auth"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/config"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Storage defines the interface required by the Ingestion Manager.
type Storage interface {
	WriteEvent(ctx context.Context, ev *models.Event) error
	WriteEventBatch(ctx context.Context, events []*models.Event) error
}

// Processor defines an interface for components that process events in real-time.
type Processor interface {
	ProcessEvent(ctx context.Context, ev *models.Event)
}

// Manager coordinates different ingestion sources.
type Manager struct {
	cfg        *config.IngestionConfig
	storage    Storage
	processors []Processor
	events     chan *models.Event
	wg         sync.WaitGroup
	bgCtx      context.Context
	cancel     context.CancelFunc
	auth       *auth.Manager
}

// NewManager creates a new Ingestion Manager.
func NewManager(cfg *config.IngestionConfig, storage Storage, auth *auth.Manager) *Manager {
	return &Manager{
		cfg:        cfg,
		storage:    storage,
		auth:       auth,
		processors: []Processor{},
		events:     make(chan *models.Event, 10000), // Buffer for 10k events
	}
}

// AddProcessor adds a real-time event processor.
func (m *Manager) AddProcessor(p Processor) {
	m.processors = append(m.processors, p)
}

// Start begins the ingestion process.
func (m *Manager) Start(ctx context.Context) error {
	m.bgCtx, m.cancel = context.WithCancel(ctx)

	// Start pipeline worker
	m.wg.Add(1)
	go m.pipelineWorker()

	log.Printf("Ingestion Manager started")
	return nil
}

// Stop gracefully shuts down the ingestion manager.
func (m *Manager) Stop() error {
	if m.cancel != nil {
		m.cancel()
	}
	m.wg.Wait()
	close(m.events)
	log.Printf("Ingestion Manager stopped")
	return nil
}

// Ingest submits an event to the ingestion pipeline.
func (m *Manager) Ingest(ev *models.Event) {
	select {
	case m.events <- ev:
	default:
		// Drop event if buffer is full (backpressure)
		log.Printf("Ingestion buffer full, dropping event: %s", ev.ID)
	}
}

func (m *Manager) pipelineWorker() {
	defer m.wg.Done()
	batchSize := 100
	flushInterval := 1 * time.Second
	batch := make([]*models.Event, 0, batchSize)
	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-m.bgCtx.Done():
			if len(batch) > 0 {
				m.flush(batch)
			}
			return
		case ev := <-m.events:
			// Run real-time processors
			for _, p := range m.processors {
				p.ProcessEvent(m.bgCtx, ev)
			}

			batch = append(batch, ev)
			if len(batch) >= batchSize {
				m.flush(batch)
				batch = make([]*models.Event, 0, batchSize)
				ticker.Reset(flushInterval)
			}
		case <-ticker.C:
			if len(batch) > 0 {
				m.flush(batch)
				batch = make([]*models.Event, 0, batchSize)
			}
		}
	}
}

func (m *Manager) flush(batch []*models.Event) {
	if err := m.storage.WriteEventBatch(m.bgCtx, batch); err != nil {
		log.Printf("Failed to flush ingestion batch: %v", err)
	}
}
