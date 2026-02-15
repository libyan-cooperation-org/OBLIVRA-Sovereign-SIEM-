package intelligence

import "fmt"

// ThreatScore represents the 0-100 confidence scoring for an incident.
type ThreatScore struct {
	Value      int      `json:"value"`      // 0-100 score
	Confidence int      `json:"confidence"` // 0-100 confidence
	Indicators []string `json:"indicators"` // List of behavioral indicators
}

func (ts ThreatScore) String() string {
	return fmt.Sprintf("Score: %d (Confidence: %d%%)", ts.Value, ts.Confidence)
}
