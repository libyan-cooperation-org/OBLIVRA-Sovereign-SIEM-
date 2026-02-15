package cases

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Manager handles the business logic for incident investigations.
type Manager struct {
	store *sqlitestore.DB
}

// NewManager creates a new Cases Manager.
func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{
		store: store,
	}
}

// CreateCase initializes a new investigation.
func (m *Manager) CreateCase(title, description, severity, status, assignee string) (*sqlitestore.CaseRecord, error) {
	c := &sqlitestore.CaseRecord{
		ID:          uuid.NewString(),
		Title:       title,
		Description: description,
		Severity:    severity,
		Status:      status,
		Assignee:    assignee,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := m.store.InsertCase(c); err != nil {
		return nil, fmt.Errorf("cases: failed to create: %w", err)
	}

	log.Printf("Case Created: %s - %s", c.ID, c.Title)
	return c, nil
}

// AddComment adds an analyst note to a case.
func (m *Manager) AddComment(caseID, author, text string) (*sqlitestore.CaseComment, error) {
	comment := &sqlitestore.CaseComment{
		ID:        uuid.NewString(),
		CaseID:    caseID,
		Author:    author,
		Text:      text,
		CreatedAt: time.Now(),
	}

	if err := m.store.InsertCaseComment(comment); err != nil {
		return nil, fmt.Errorf("cases: failed to add comment: %w", err)
	}

	// Update case updated_at
	_ = m.store.UpdateCaseStatus(caseID, "") // Workaround to update updated_at if status is same

	return comment, nil
}

// LinkAlert attaches an alert to a case.
func (m *Manager) LinkAlert(caseID, alertID string) error {
	if err := m.store.LinkAlertToCase(caseID, alertID); err != nil {
		return fmt.Errorf("cases: failed to link alert: %w", err)
	}
	return nil
}

// ListCases retrieves cases with optional filtering.
func (m *Manager) ListCases(status string, limit int) ([]*sqlitestore.CaseRecord, error) {
	return m.store.ListCases(status, limit)
}

// GetCaseDetails returns a case with its linked alerts and comments.
func (m *Manager) GetCaseDetails(caseID string) (*sqlitestore.CaseRecord, []*models.Alert, []*sqlitestore.CaseComment, error) {
	c, err := m.store.GetCase(caseID)
	if err != nil {
		return nil, nil, nil, err
	}
	if c == nil {
		return nil, nil, nil, fmt.Errorf("case not found")
	}

	alerts, err := m.store.GetAlertsForCase(caseID)
	if err != nil {
		return nil, nil, nil, err
	}

	comments, err := m.store.ListCaseComments(caseID)
	if err != nil {
		return nil, nil, nil, err
	}

	return c, alerts, comments, nil
}
