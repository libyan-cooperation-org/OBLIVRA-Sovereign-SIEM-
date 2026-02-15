package hunting

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Manager handles the lifecycle of hunting queries and leads.
type Manager struct {
	store *sqlitestore.DB
}

// NewManager creates a new Hunting Manager.
func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{store: store}
}

// SaveSearch persists a new hunting query.
func (m *Manager) SaveSearch(name, query, user string) (*models.SavedSearch, error) {
	s := &models.SavedSearch{
		ID:        uuid.NewString(),
		Name:      name,
		Query:     query,
		CreatedBy: user,
		CreatedAt: time.Now(),
	}

	err := m.store.InsertSavedSearch(s.ID, s.Name, s.Query, s.CreatedBy, s.CreatedAt.Unix())
	if err != nil {
		return nil, fmt.Errorf("hunting: failed to save search: %w", err)
	}

	return s, nil
}

// ListSearches returns all saved hunting queries.
func (m *Manager) ListSearches() ([]*models.SavedSearch, error) {
	return m.store.ListSavedSearches()
}
