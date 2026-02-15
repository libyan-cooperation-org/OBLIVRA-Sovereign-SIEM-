package compliance

import (
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Technique represents a MITRE ATT&CK technique.
type Technique struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Tactic      string `json:"tactic"`
}

// Manager handles compliance mapping and reporting.
type Manager struct {
	techniques map[string]Technique
}

func NewManager() *Manager {
	m := &Manager{
		techniques: make(map[string]Technique),
	}
	m.initDefaultTechniques()
	return m
}

func (m *Manager) initDefaultTechniques() {
	// Sample mapping (In production this would load from a JSON file)
	m.techniques["T1003"] = Technique{ID: "T1003", Name: "OS Credential Dumping", Tactic: "Credential Access"}
	m.techniques["T1059"] = Technique{ID: "T1059", Name: "Command and Scripting Interpreter", Tactic: "Execution"}
	m.techniques["T1134"] = Technique{ID: "T1134", Name: "Access Token Manipulation", Tactic: "Defense Evasion"}
	m.techniques["T1566"] = Technique{ID: "T1566", Name: "Phishing", Tactic: "Initial Access"}
	m.techniques["T1071"] = Technique{ID: "T1071", Name: "Application Layer Protocol", Tactic: "Command and Control"}
}

// GetCoverage returns a summary of tactic coverage.
func (m *Manager) GetCoverage() map[string]int {
	coverage := make(map[string]int)
	for _, t := range m.techniques {
		coverage[t.Tactic]++
	}
	return coverage
}

// EnrichAlert adds compliance metadata to an alert if a rule matches a technique.
func (m *Manager) EnrichAlert(alert *models.Alert, techniqueID string) {
	if tech, ok := m.techniques[techniqueID]; ok {
		if alert.Metadata == nil {
			alert.Metadata = make(map[string]string)
		}
		alert.Metadata["mitre_technique"] = tech.Name
		alert.Metadata["mitre_id"] = tech.ID
		alert.Metadata["mitre_tactic"] = tech.Tactic
	}
}

// GetTechnique returns details for a specific MITRE ID.
func (m *Manager) GetTechnique(id string) (Technique, bool) {
	t, ok := m.techniques[id]
	return t, ok
}
