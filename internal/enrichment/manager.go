package enrichment

import (
	"context"
	"log"
	"sync"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Enricher defines the interface for components that add metadata to events.
type Enricher interface {
	Name() string
	Enrich(ctx context.Context, ev *models.Event) error
}

// Manager orchestrates the enrichment of events.
type Manager struct {
	enrichers []Enricher
	mu        sync.RWMutex
}

// NewManager creates a new Enrichment Manager.
func NewManager() *Manager {
	return &Manager{
		enrichers: make([]Enricher, 0),
	}
}

// AddEnricher adds a new enricher to the pipeline.
func (m *Manager) AddEnricher(e Enricher) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.enrichers = append(m.enrichers, e)
	log.Printf("Enrichment: Added enricher %s", e.Name())
}

// ProcessEvent satisfies the ingestion.Processor interface.
// It enriches the event in-place before it continues down the pipeline.
func (m *Manager) ProcessEvent(ctx context.Context, ev *models.Event) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if ev.Metadata == nil {
		ev.Metadata = make(map[string]string)
	}

	for _, e := range m.enrichers {
		if err := e.Enrich(ctx, ev); err != nil {
			log.Printf("Enrichment: %s failed for event %s: %v", e.Name(), ev.ID, err)
		}
	}
}
