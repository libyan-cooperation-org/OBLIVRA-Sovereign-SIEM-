package detection

import (
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/ransomware/intelligence"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// BehaviorPattern represents observed ransomware-like behaviors.
type BehaviorPattern struct {
	RapidFileModifications bool
	HighEntropyWrites      bool
	ExtensionChanges       bool
	ShadowCopyDeletion     bool
	BackupDeletion         bool
	CredentialDumping      bool
	LateralMovement        bool
	UnusualProcessTree     bool
}

// BehavioralEngine analyzes event streams for ransomware patterns.
type BehavioralEngine struct{}

func NewBehavioralEngine() *BehavioralEngine {
	return &BehavioralEngine{}
}

// Analyze evaluates a list of events to determine a ransomware threat score.
func (be *BehavioralEngine) Analyze(events []*models.Event) intelligence.ThreatScore {
	score := 0
	indicators := []string{}

	// 1. Rapid file modifications (Strongest signal)
	if countFileEvents(events, 60*time.Second) > 100 {
		score += 40
		indicators = append(indicators, "RAPID_FILE_MODIFICATIONS")
	}

	// 2. High entropy (Encryption indicator)
	if detectHighEntropy(events) {
		score += 30
		indicators = append(indicators, "HIGH_ENTROPY_WRITES")
	}

	// 3. Shadow copy deletion (Pre-encryption prep)
	if detectShadowCopyDeletion(events) {
		score += 20
		indicators = append(indicators, "SHADOW_COPY_DELETION")
	}

	// 4. Credential dumping + Lateral movement
	if detectCredDump(events) && detectLateralMovement(events) {
		score += 10
		indicators = append(indicators, "LATERAL_MOVEMENT_WITH_CRED_DUMP")
	}

	confidence := calculateConfidence(events, indicators)

	return intelligence.ThreatScore{
		Value:      score,
		Confidence: confidence,
		Indicators: indicators,
	}
}

// Helper functions (Internal implementation)

func countFileEvents(events []*models.Event, window time.Duration) int {
	count := 0
	now := time.Now()
	for _, e := range events {
		if time.Since(e.Timestamp) <= window && (e.Category == "File_Modify" || e.Category == "File_Write") {
			count++
		}
	}
	return count
}

func detectHighEntropy(events []*models.Event) bool {
	for _, e := range events {
		if entropyStr, ok := e.Metadata["entropy"]; ok {
			var entropy float64
			// Note: In a real agent, entropy would be pre-calculated or calculated here if Raw is available
			// For this simulation, we check if it's flagged as high.
			if entropyStr == "high" {
				return true
			}
		}
	}
	return false
}

func detectShadowCopyDeletion(events []*models.Event) bool {
	for _, e := range events {
		if e.Category == "Process_Create" && (e.Fields["image"] == "vssadmin.exe" || e.Fields["command_line"] == "delete shadows") {
			return true
		}
	}
	return false
}

func detectCredDump(events []*models.Event) bool {
	for _, e := range events {
		if e.Category == "Process_Access" && e.Fields["target"] == "lsass.exe" {
			return true
		}
	}
	return false
}

func detectLateralMovement(events []*models.Event) bool {
	for _, e := range events {
		if e.Category == "Network_Connect" && (e.Fields["dest_port"] == 445 || e.Fields["dest_port"] == 3389) {
			return true
		}
	}
	return false
}

func calculateConfidence(events []*models.Event, indicators []string) int {
	if len(indicators) == 0 {
		return 0
	}
	// Simple confidence logic: more distinct indicators = higher confidence
	conf := len(indicators) * 25
	if conf > 100 {
		conf = 100
	}
	return conf
}
