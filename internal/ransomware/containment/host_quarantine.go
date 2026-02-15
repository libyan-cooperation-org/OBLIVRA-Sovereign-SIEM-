package containment

import "log"

// HostQuarantine handles VLAN changes or EDR-based host isolation.
type HostQuarantine struct{}

func (hq *HostQuarantine) Isolate(host string) error {
	log.Printf("[RDS-CONTAINMENT] Quarantining host %s via VLAN/EDR API...", host)
	return nil
}
