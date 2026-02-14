package fortigate

import (
	"fmt"
	"testing"
)

func TestFortiGateParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"Traffic_Accept", `date=2023-10-11 time=22:14:15 devname="FGT-01" devid="FGT60D3G15012345" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=192.168.1.100 srcport=54321 dstip=8.8.8.8 dstport=53 proto=17 action="accept" policyid=1`, false},
		{"Traffic_Deny", `date=2023-10-11 time=22:15:10 devname="FGT-01" logid="0001000014" type="traffic" subtype="forward" level="warning" action="deny" srcip=10.0.0.5 dstip=172.16.0.10 service="HTTPS"`, false},
		{"Security_AV", `date=2023-10-11 time=22:16:05 devname="FGT-01" logid="0202000020" type="utm" subtype="virus" level="critical" msg="Virus detected" virus="EICAR_Test_File" status="blocked"`, false},
		{"System_Login", `date=2023-10-11 time=22:17:00 devname="FGT-01" logid="0100032001" type="event" subtype="system" level="information" user="admin" ui="https" msg="Administrator login successful"`, false},
		{"No_Quotes", `date=2023-10-11 time=22:18:00 devname=FGT-CORE type=traffic action=deny`, false},
	}

	// Add 45+ variant cases
	for i := 0; i < 45; i++ {
		raw := fmt.Sprintf(`date=2023-10-11 time=22:18:%02d devname="FGT-%d" type="traffic" action="accept" srcip=1.2.3.%d msg="Test event %d"`, i%60, i, i, i)
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
				t.Errorf("FortiGateParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && ev == nil {
				t.Error("Event is nil")
			}
		})
	}
}

func TestFortiGateParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse("devname=FGT-01 type=traffic") {
		t.Error("CanParse failed for valid FortiGate string")
	}
}
