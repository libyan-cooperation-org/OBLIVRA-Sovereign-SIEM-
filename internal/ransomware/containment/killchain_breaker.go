package containment

import "log"

// KillchainBreaker terminates specific processes or services.
type KillchainBreaker struct{}

func (kb *KillchainBreaker) KillProcess(host string, pid string) error {
	log.Printf("[RDS-CONTAINMENT] Stopping process %s on host %s...", pid, host)
	return nil
}
