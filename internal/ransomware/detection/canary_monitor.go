package detection

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// CanaryFile represents a honeypot file used for early ransomware detection.
type CanaryFile struct {
	Path        string    `json:"path"`
	Hash        string    `json:"hash"`
	LastChecked time.Time `json:"last_checked"`
	Criticality string    `json:"criticality"` // "Executive", "Finance", "HR"
}

// CanaryMonitor watches honeyfiles for any changes.
type CanaryMonitor struct {
	Files []CanaryFile
}

func NewCanaryMonitor() *CanaryMonitor {
	return &CanaryMonitor{
		Files: []CanaryFile{
			{Path: "C:\\Finance\\Q4_Budget_CONFIDENTIAL.xlsx", Criticality: "High"},
			{Path: "C:\\HR\\Salaries_2025.docx", Criticality: "High"},
		},
	}
}

// CheckIntegrity scans all canary files for modifications.
func (cm *CanaryMonitor) CheckIntegrity() []models.Alert {
	alerts := []models.Alert{}

	for i, canary := range cm.Files {
		currentHash, err := hashFile(canary.Path)
		if err != nil {
			// If file is missing, it's also a high-confidence signal of ransomware prep
			if os.IsNotExist(err) {
				alert := models.Alert{
					ID:        fmt.Sprintf("canary_del_%d", time.Now().UnixNano()),
					Timestamp: time.Now(),
					Severity:  models.SeverityCritical,
					Title:     "Ransomware_Canary_Deleted",
					Summary:   fmt.Sprintf("Canary file DELETED: %s", canary.Path),
					Status:    "open",
					Metadata: map[string]string{
						"path":        canary.Path,
						"criticality": canary.Criticality,
					},
				}
				alerts = append(alerts, alert)
			}
			continue
		}

		if canary.Hash == "" {
			// First-time initialization
			cm.Files[i].Hash = currentHash
			cm.Files[i].LastChecked = time.Now()
			continue
		}

		if currentHash != canary.Hash {
			// DEFINITIVE RANSOMWARE DETECTION
			alert := models.Alert{
				ID:        fmt.Sprintf("canary_trig_%d", time.Now().UnixNano()),
				Timestamp: time.Now(),
				Severity:  models.SeverityCritical,
				Title:     "Ransomware_Canary_Triggered",
				Summary:   fmt.Sprintf("Canary file modified: %s", canary.Path),
				Status:    "open",
				Metadata: map[string]string{
					"path":          canary.Path,
					"criticality":   canary.Criticality,
					"auto_response": "IMMEDIATE_ISOLATION",
				},
			}
			alerts = append(alerts, alert)
			cm.Files[i].Hash = currentHash // Update to avoid duplicate alerts
		}
		cm.Files[i].LastChecked = time.Now()
	}

	return alerts
}

func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", h.Sum(nil)), nil
}
