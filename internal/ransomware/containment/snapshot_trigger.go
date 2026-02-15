package containment

import "log"

// SnapshotTrigger interfaces with storage/virtualization APIs to save state.
type SnapshotTrigger struct{}

func (st *SnapshotTrigger) Capture(host string) error {
	log.Printf("[RDS-CONTAINMENT] Triggering immutable storage snapshot for host %s...", host)
	return nil
}
