package containment

import "log"

// UserSuspend handles account lockouts in AD or IDP.
type UserSuspend struct{}

func (us *UserSuspend) DisableAccount(user string) error {
	log.Printf("[RDS-CONTAINMENT] Disabling user account %s in Active Directory...", user)
	return nil
}
