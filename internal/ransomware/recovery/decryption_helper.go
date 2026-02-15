package recovery

import "log"

// DecryptionHelper provides interfaces for known ransomware decryptors.
type DecryptionHelper struct{}

func (dh *DecryptionHelper) GetDecryptor(family string) string {
	log.Printf("[RDS-RECOVERY] Looking for decryptor for family: %s", family)
	return "No decryptor available for this variant."
}
