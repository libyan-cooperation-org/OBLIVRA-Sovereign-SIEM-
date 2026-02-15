package containment

import (
	"context"
	"log"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/ransomware/intelligence"
)

// Orchestrator coordinates automated response across different systems.
type Orchestrator struct {
	Isolator *NetworkIsolator
}

func NewOrchestrator() *Orchestrator {
	return &Orchestrator{
		Isolator: NewNetworkIsolator(),
	}
}

// ExecuteRansomwareResponse triggers a full containment suite based on threat score.
func (o *Orchestrator) ExecuteRansomwareResponse(ctx context.Context, threat intelligence.ThreatScore) {
	log.Printf("[RDS-ORCHESTRATOR] Initiating automated containment for threat: %v", threat.Indicators)

	// In a real scenario, we'd extract the host from the events that triggered the threat.
	// For this simulation/skeleton, we'll use a placeholder.
	targetHost := "DETECTED_HOST"

	err := o.Isolator.QuarantineHost(targetHost, "Behavioral ransomware detection")
	if err != nil {
		log.Printf("[RDS-ORCHESTRATOR] Containment failed: %v", err)
	}

	// Trigger storage snapshots
	o.TriggerSnapshots(targetHost)
}

func (o *Orchestrator) IsolateHost(host string, reason string) error {
	return o.Isolator.QuarantineHost(host, reason)
}

func (o *Orchestrator) TriggerSnapshots(host string) {
	log.Printf("[RDS-ORCHESTRATOR] STORAGE CMD: Triggering immutable snapshots for volumes on %s", host)
}
