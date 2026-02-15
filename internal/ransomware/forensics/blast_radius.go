package forensics

import "log"

// BlastRadius maps the extent of the attack across the network.
type BlastRadius struct{}

func (br *BlastRadius) Map(host string) []string {
	log.Printf("[RDS-FORENSICS] Mapping attack blast radius starting from host %s...", host)
	return []string{host, "Neighbor-PC-1", "Fileserver-01"}
}
