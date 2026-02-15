package intelligence

import (
	"fmt"
	"log"
	"time"
)

// IOC represents an Indicator of Compromise.
type IOC struct {
	Type  string `json:"type"` // "IP", "Domain", "FileHash"
	Value string `json:"value"`
}

// RansomwareCampaign tracks active ransomware families and victims.
type RansomwareCampaign struct {
	ID          string    `json:"id"`
	Family      string    `json:"family"` // "LockBit", "BlackCat", "Akira"
	FirstSeen   time.Time `json:"first_seen"`
	VictimCount int       `json:"victim_count"`
	Victims     []string  `json:"victims"` // Anonymized org IDs
	TTPs        []string  `json:"ttps"`    // MITRE ATT&CK techniques
	IOCs        []IOC     `json:"iocs"`
	ThreatLevel int       `json:"threat_level"` // 0-100
}

// CampaignTracker monitors global/national trends in ransomware.
type CampaignTracker struct {
	Campaigns map[string]RansomwareCampaign
}

func NewCampaignTracker() *CampaignTracker {
	return &CampaignTracker{
		Campaigns: make(map[string]RansomwareCampaign),
	}
}

// AnalyzeTrends looks for patterns indicating a broad campaign.
func (ct *CampaignTracker) AnalyzeTrends() []string {
	alerts := []string{}

	for _, campaign := range ct.Campaigns {
		// Example logic: 3+ organizations hit by the same family in 7 days
		if campaign.VictimCount >= 3 {
			alert := fmt.Sprintf(
				"Ransomware_Campaign_Detected: %s campaign active. %d victims. TTPs: %v",
				campaign.Family, campaign.VictimCount, campaign.TTPs,
			)
			alerts = append(alerts, alert)
			log.Println("[RDS-INTELLIGENCE] BROAD THREAT ALERT:", alert)
		}
	}

	return alerts
}

// BroadcastThreat shares IOCs with all OBLIVRA deployments.
func (ct *CampaignTracker) BroadcastThreat(message string) {
	log.Printf("[RDS-INTELLIGENCE] BROADCASTING threat intel to Libyan collective defense network: %s", message)
}
