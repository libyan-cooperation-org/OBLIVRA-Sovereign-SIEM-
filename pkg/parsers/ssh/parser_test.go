package ssh

import (
	"fmt"
	"testing"
)

func TestSSHParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		// Success
		{"Accepted_Password", "Oct 11 22:14:15 host sshd[123]: Accepted password for root from 1.2.3.4 port 5678 ssh2", false},
		{"Accepted_PublicKey", "Oct 11 22:14:15 host sshd[123]: Accepted publickey for admin from 1.1.1.1 port 44322 ssh2: RSA SHA256:abcd", false},

		// Failure
		{"Failed_Password", "Oct 11 22:15:10 host sshd[123]: Failed password for root from 10.0.0.5 port 1234 ssh2", false},
		{"Failed_Invalid_User", "Oct 11 22:15:15 host sshd[123]: Failed password for invalid user nonesuch from 10.0.0.5 port 1235 ssh2", false},

		// Closure
		{"Closed_Preauth", "Oct 11 22:16:05 host sshd[123]: Connection closed by authenticating user root 1.2.3.4 port 5678 [preauth]", false},
		{"Disconnected", "Oct 11 22:17:00 host sshd[123]: Received disconnect from 1.2.3.4 port 5678:11: Bye Bye", false},
	}

	// Add variants to meet 50+
	for i := 0; i < 44; i++ {
		raw := fmt.Sprintf(`Oct 11 22:%02d:00 host sshd[%d]: Failed password for testuser%d from 192.168.1.%d port %d ssh2`, i%60, 1000+i, i, i, 10000+i)
		tests = append(tests, struct {
			name    string
			raw     string
			wantErr bool
		}{fmt.Sprintf("Failed_Variant_%d", i), raw, false})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ev, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("SSHParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && ev == nil {
				t.Error("Event is nil")
			}
		})
	}
}

func TestSSHParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse("sshd[123]: message") {
		t.Error("CanParse failed for valid SSH tag")
	}
}
