package cisco_asa

import (
	"fmt"
	"testing"
)

func TestCiscoASAParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"Connection_Built", `<166>Oct 11 2023 22:14:15: %ASA-6-302013: Built outbound TCP connection 1234 for outside:192.168.1.1/80 (192.168.1.1/80) to inside:10.0.0.1/1234 (10.0.0.1/1234)`, false},
		{"Deny_Access_In", `%ASA-4-106023: Deny tcp src outside:1.1.1.1/1234 dst inside:10.0.0.5/445 by access-group "outside_access_in" [0x0, 0x0]`, false},
		{"Login_Permitted", `%ASA-6-605005: Login permitted from 192.168.10.5 for user "admin"`, false},
		{"Config_Changed", `%ASA-5-111005: User 'admin' executed the 'write memory' command.`, false},
	}

	// Add 46+ variant cases
	for i := 0; i < 46; i++ {
		raw := fmt.Sprintf(`%%ASA-6-302%03d: Built connection to 1.2.3.%d`, i, i)
		tests = append(tests, struct {
			name    string
			raw     string
			wantErr bool
		}{fmt.Sprintf("Variant_%d", i), raw, false})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ev, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("CiscoASAParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && ev == nil {
				t.Error("Event is nil")
			}
		})
	}
}

func TestCiscoASAParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse("Some syslog... %ASA-6-302013: ...") {
		t.Error("CanParse failed for valid ASA mnemonic")
	}
}
