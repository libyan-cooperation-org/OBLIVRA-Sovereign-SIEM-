package forensics

import (
	"log"
	"sort"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// InfectionVector represents the starting point of an attack.
type InfectionVector struct {
	Type       string        `json:"type"` // "Phishing", "Exploit", "RDP_BruteForce"
	Evidence   *models.Event `json:"evidence"`
	Confidence int           `json:"confidence"`
}

// PatientZeroAnalyzer reconstructs the initial infection steps.
type PatientZeroAnalyzer struct{}

func NewPatientZeroAnalyzer() *PatientZeroAnalyzer {
	return &PatientZeroAnalyzer{}
}

// Identify analyzes the timeline to find the entry point.
func (pz *PatientZeroAnalyzer) Identify(incidentEvents []*models.Event) InfectionVector {
	log.Println("[RDS-FORENSICS] Analyzing timeline to identify Patient Zero...")

	// Sort events chronologically to find the FIRST one related to the threat
	sort.Slice(incidentEvents, func(i, j int) bool {
		return incidentEvents[i].Timestamp.Before(incidentEvents[j].Timestamp)
	})

	for _, event := range incidentEvents {
		// 1. Phishing: Outlook/Browser spawning an executable
		if event.Category == "Process_Create" {
			parent := event.Fields["parent_process"].(string)
			process := event.Fields["process"].(string)

			if (parent == "outlook.exe" || parent == "chrome.exe" || parent == "msedge.exe") &&
				(process == "powershell.exe" || process == "cmd.exe") {
				return InfectionVector{
					Type:       "Phishing_Attachment",
					Evidence:   event,
					Confidence: 95,
				}
			}
		}

		// 2. Web Exploit: Web server (IIS/Apache) spawning shell
		if event.Category == "Process_Create" {
			parent := event.Fields["parent_process"].(string)
			if parent == "w3wp.exe" || parent == "httpd.exe" || parent == "nginx.exe" {
				return InfectionVector{
					Type:       "Web_Exploit",
					Evidence:   event,
					Confidence: 90,
				}
			}
		}

		// 3. RDP Brute Force: Many failed logins followed by success
		if event.Category == "Authentication_Success" {
			if failedAttempts, ok := event.Metadata["recent_failed_attempts"]; ok && failedAttempts != "0" {
				return InfectionVector{
					Type:       "RDP_Brute_Force",
					Evidence:   event,
					Confidence: 85,
				}
			}
		}
	}

	return InfectionVector{Type: "Unknown"}
}
