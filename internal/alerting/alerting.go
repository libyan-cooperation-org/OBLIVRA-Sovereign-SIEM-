package alerting

import (
	"context"
	"fmt"
	"log"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/response"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Manager handles the lifecycle and persistence of alerts.
type Manager struct {
	store    *sqlitestore.DB
	response *response.Manager
}

// NewManager creates a new Alerting Manager.
func NewManager(store *sqlitestore.DB, resp *response.Manager) *Manager {
	return &Manager{
		store:    store,
		response: resp,
	}
}

// HandleAlert persists the alert to SQLite.
func (m *Manager) HandleAlert(ctx context.Context, alert *models.Alert) error {
	if err := m.store.InsertAlert(alert); err != nil {
		return fmt.Errorf("alerting: failed to insert alert: %w", err)
	}

	log.Printf("ALERT TRIGGERED: %s (Severity: %s)", alert.Title, alert.Severity)

	// Automated Response (SOAR)
	if m.response != nil {
		go m.response.Execute(ctx, alert)
	}

	return nil
}
