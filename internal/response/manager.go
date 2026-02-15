package response

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Action represents an automated response task.
type Action interface {
	Type() string
	Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error)
}

// Manager orchestrates the execution of automated responses.
type Manager struct {
	store   *sqlitestore.DB
	actions map[string]Action
	mu      sync.RWMutex
}

// NewManager creates a new Response Manager.
func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{
		store:   store,
		actions: make(map[string]Action),
	}
}

// RegisterAction adds a new action type to the manager.
func (m *Manager) RegisterAction(a Action) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.actions[a.Type()] = a
}

// Playbook is a sequence of actions.
type Playbook struct {
	ID      string           `json:"id"`
	Name    string           `json:"name"`
	Actions []PlaybookAction `json:"actions"`
}

type PlaybookAction struct {
	Type   string            `json:"type"`
	Params map[string]string `json:"params"`
}

// Execute triggers the associated action for an alert.
func (m *Manager) Execute(ctx context.Context, alert *models.Alert) {
	// ... (existing logic to find actionType)
	// (simplified for the walkthrough)
	m.executeWorkflow(ctx, alert)
}

func (m *Manager) executeWorkflow(ctx context.Context, alert *models.Alert) {
	var actionType string
	var params map[string]string

	// Check if it is a deception alert which has a dedicated rule prefix
	if strings.HasPrefix(alert.RuleID, "DECEPTION_") {
		actionType = "notify" // Default for deception
		params = map[string]string{"message": alert.Summary}
	} else {
		// Lookup rule to get response config
		rules, err := m.store.ListRules(false)
		if err == nil {
			for _, r := range rules {
				if r.ID == alert.RuleID {
					actionType = r.ResponseAction
					if r.ResponseParams != "" {
						json.Unmarshal([]byte(r.ResponseParams), &params)
					}
					break
				}
			}
		}
	}

	if actionType == "" {
		return
	}

	if actionType == "playbook" {
		playbookID := params["playbook_id"]
		m.ExecutePlaybook(ctx, playbookID, alert)
		return
	}

	m.ExecuteSingleAction(ctx, actionType, alert, params)
}

func (m *Manager) ExecuteSingleAction(ctx context.Context, actionType string, alert *models.Alert, params map[string]string) {
	m.mu.RLock()
	action, ok := m.actions[actionType]
	m.mu.RUnlock()

	if !ok {
		log.Printf("response: unknown action type %s", actionType)
		return
	}

	log.Printf("SOAR: Executing action %s for alert %s", actionType, alert.ID)

	record := &sqlitestore.ResponseExecutionRecord{
		ID:         uuid.NewString(),
		AlertID:    alert.ID,
		ActionType: actionType,
		Status:     "pending",
		Timestamp:  time.Now(),
	}

	output, err := action.Execute(ctx, alert, params)
	if err != nil {
		record.Status = "failed"
		record.Output = fmt.Sprintf("Error: %v", err)
		log.Printf("SOAR: Action %s failed: %v", actionType, err)
	} else {
		record.Status = "success"
		record.Output = output
		log.Printf("SOAR: Action %s executed successfully", actionType)
	}

	if err := m.store.InsertResponseHistory(record); err != nil {
		log.Printf("response: failed to save history: %v", err)
	}
}

func (m *Manager) ExecutePlaybook(ctx context.Context, playbookID string, alert *models.Alert) {
	log.Printf("SOAR: Running playbook %s for alert %s", playbookID, alert.ID)
	// Example: Full Containment Playbook
	if playbookID == "full_containment" {
		actions := []PlaybookAction{
			{Type: "isolate_host", Params: nil},
			{Type: "block_ip", Params: map[string]string{"ip": "auto"}}, // Simplified
			{Type: "notify", Params: map[string]string{"message": "Host isolated and IPs blocked automatically."}},
		}
		for _, a := range actions {
			m.ExecuteSingleAction(ctx, a.Type, alert, a.Params)
		}
	}
}
