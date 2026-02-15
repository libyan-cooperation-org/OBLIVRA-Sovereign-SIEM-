package intelligence

import (
	"log"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// IOCCorrelator matches events against known ransomware IOCs.
type IOCCorrelator struct {
	KnownIOCs map[string]string // Value -> Type
}

func NewIOCCorrelator() *IOCCorrelator {
	return &IOCCorrelator{
		KnownIOCs: make(map[string]string),
	}
}

// Correlate checks if an event contains any known ransomware indicators.
func (ic *IOCCorrelator) Correlate(ev *models.Event) bool {
	// Check IPs
	if ev.Category == "Network_Connect" {
		destIP := ev.Fields["dest_ip"].(string)
		if ic.KnownIOCs[destIP] == "IP" {
			log.Printf("[RDS-INTELLIGENCE] IOC MATCH: Event %s matches known ransomware IP %s", ev.ID, destIP)
			return true
		}
	}

	// Check Hashes
	if hash, ok := ev.Metadata["sha256"]; ok {
		if ic.KnownIOCs[hash] == "FileHash" {
			log.Printf("[RDS-INTELLIGENCE] IOC MATCH: Event %s matches known ransomware hash %s", ev.ID, hash)
			return true
		}
	}

	return false
}
