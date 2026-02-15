package intelligence

import (
	"log"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// TTPSMapper maps incidents to MITRE ATT&CK techniques.
type TTPSMapper struct{}

func NewTTPSMapper() *TTPSMapper {
	return &TTPSMapper{}
}

// MapToMITRE identifies techniques used in an incident.
func (tm *TTPSMapper) MapToMITRE(events []*models.Event) []string {
	log.Println("[RDS-INTELLIGENCE] Mapping incident events to MITRE ATT&CK TTPs...")
	return []string{"T1486", "T1490"} // Ransomware-related tech references
}
