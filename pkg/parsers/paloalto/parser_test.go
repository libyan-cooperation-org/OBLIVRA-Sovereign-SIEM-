package paloalto

import (
	"fmt"
	"testing"
)

func TestPaloAltoParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"Traffic_End", `1,2023/10/11 22:14:15,0012345678,TRAFFIC,end,2,2023/10/11 22:14:15,1.2.3.4,8.8.8.8,0.0.0.0,0.0.0.0,rule1,srcuser,dstuser,web-browsing,vsys1,outside,inside,tunnel.1,tunnel.2,logset1,1234,80,443,123,53,0x40,tcp,allow,1024,512,512,5,2023/10/11 22:14:15,200,web-browsing,0,1,2,3,4,5,6,0,0,0,0,,,,,0,0,0,0,0,computer1,`, false},
		{"Threat_Virus", `1,2023/10/11 22:15:10,0012345678,THREAT,virus,2,2023/10/11 22:15:10,10.0.0.5,172.16.0.10,0.0.0.0,0.0.0.0,rule2,user1,user2,web-browsing,vsys1,inside,outside,tunnel.1,tunnel.2,logset1,1234,80,443,123,53,0x40,tcp,alert,1024,512,512,5,2023/10/11 22:15:10,200,web-browsing,EICAR,30001,critical,low,0,1,2,3,4,5,6,0,0,0,0,,,,,0,0,0,0,0,computer1,`, false},
		{"System_Login", `1,2023/10/11 22:16:00,0012345678,SYSTEM,login,2,2023/10/11 22:16:00,,,0.0.0.0,0.0.0.0,,,,,,,vsys1,,,,0,0,0,0,0,0x0,,informational,,0,0,0,0,0,Administrator login successful`, false},
		{"With_Syslog_Header", `Oct 11 22:17:00 pa-fw 1,2023/10/11 22:17:00,0012345678,TRAFFIC,end,2,2023/10/11 22:17:00,1.1.1.1,2.2.2.2,,,,rule3,,,,,,,,,,,,,tcp,allow,,,,,,,,,`, false},
	}

	// Add 46+ variant cases
	for i := 0; i < 46; i++ {
		raw := fmt.Sprintf(`1,2023/10/11 22:18:%02d,0012345678,TRAFFIC,end,2,2023/10/11 22:18:%02d,1.2.3.%d,4.5.6.7,,,,rule%d,,,,,,,,,,,,,tcp,allow,,,,,,,,,`, i%60, i%60, i, i)
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
				t.Errorf("PaloAltoParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && ev == nil {
				t.Error("Event is nil")
			}
		})
	}
}

func TestPaloAltoParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse("1,2023/10/11 22:14:15,0012345678,TRAFFIC,end,1,2,3,4,5,6,7,8,9,0") {
		t.Error("CanParse failed for valid Palo Alto CSV")
	}
}
