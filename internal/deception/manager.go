package deception

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// AlertHandler defines how to process a triggered deception alert.
type AlertHandler func(ctx context.Context, alert *models.Alert) error

// Manager handles the lifecycle and matching of honeytokens.
type Manager struct {
	tokens  map[string]*models.Honeytoken
	handler AlertHandler
	mu      sync.RWMutex
}

// NewManager creates a new Deception Manager.
func NewManager(handler AlertHandler) *Manager {
	return &Manager{
		tokens:  make(map[string]*models.Honeytoken),
		handler: handler,
	}
}

// LoadTokens fetches active honeytokens from SQLite.
func (m *Manager) LoadTokens(store *sqlitestore.DB) error {
	tokens, err := store.ListHoneytokens()
	if err != nil {
		return fmt.Errorf("deception: list tokens: %w", err)
	}

	m.mu.Lock()
	m.tokens = make(map[string]*models.Honeytoken)
	for _, t := range tokens {
		m.tokens[strings.ToLower(t.Value)] = t
	}
	m.mu.Unlock()

	log.Printf("Deception Engine loaded %d honeytokens", len(tokens))
	return nil
}

// ProcessEvent checks an event against all loaded honeytokens.
func (m *Manager) ProcessEvent(ctx context.Context, ev *models.Event) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if len(m.tokens) == 0 {
		return
	}

	// Check common fields
	m.checkMatch(ctx, ev, ev.User, "User")
	m.checkMatch(ctx, ev, ev.Host, "Host")
	m.checkMatch(ctx, ev, ev.Message, "Message")

	// Check dynamic fields
	if ev.Fields != nil {
		for field, val := range ev.Fields {
			if strVal, ok := val.(string); ok {
				m.checkMatch(ctx, ev, strVal, field)
			}
		}
	}
}

func (m *Manager) checkMatch(ctx context.Context, ev *models.Event, value string, field string) {
	if value == "" {
		return
	}

	// Simplified check: exact match (case-insensitive)
	lowerVal := strings.ToLower(value)

	// Check if the value itself or any part of it (for message) contains a honeytoken
	// For performance in high-frequency fields we might use a prefix tree or regex,
	// but for deception exact match or simple contains is often better to avoid noise.

	for _, token := range m.tokens {
		if strings.Contains(lowerVal, strings.ToLower(token.Value)) {
			// Trigger alert
			alert := &models.Alert{
				ID:        fmt.Sprintf("dec_%s_%d", token.ID, ev.Timestamp.UnixNano()),
				EventID:   ev.ID,
				RuleID:    "DECEPTION_" + string(token.Type),
				Timestamp: ev.Timestamp,
				Severity:  models.SeverityCritical,
				Title:     fmt.Sprintf("Deception Triggered: %s", token.Type),
				Summary:   fmt.Sprintf("Honeytoken '%s' (%s) accessed in field '%s'", token.Value, token.Description, field),
				Status:    "open",
			}

			if err := m.handler(ctx, alert); err != nil {
				log.Printf("deception: alert handler failed: %v", err)
			}
			return // Trigger once per event
		}
	}
}
