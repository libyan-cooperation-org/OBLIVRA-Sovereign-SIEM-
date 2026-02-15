package main

import (
	"fmt"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/parsers/syslog"
)

func main() {
	p := syslog.New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"RFC3164_SSH_Success", "<34>Oct 11 22:14:15 host sshd[123]: Accepted password for root from 192.168.1.1 port 5678 ssh2", false},
		{"RFC5424_Standard", "<34>1 2023-10-11T22:14:15.000Z host app - - - Message", false},
		{"Edge_No_Tag_Content", "<34>Oct 11 22:14:15 host : message with empty tag", false},
		{"Variant_Cisco_IOS", "<189>Oct 11 22:38:05 cisco-switch 123: %LINEPROTO-5-UPDOWN: Line protocol on Interface FastEthernet0/1, changed state to up", false},
		{"Variant_Generic_Device", "<13>Oct 11 22:39:44 unknown-dev device_id=445 action=block", false},
		{"Error_Incomplete", "<34>Oct 11", true},
	}

	for _, tt := range tests {
		ev, err := p.Parse(tt.raw)
		if (err != nil) != tt.wantErr {
			fmt.Printf("FAIL [%s]: error = %v, wantErr %v\n", tt.name, err, tt.wantErr)
		} else {
			fmt.Printf("PASS [%s]\n", tt.name)
			if ev != nil {
				// fmt.Printf("  Event: %+v\n", ev)
			}
		}
	}
}
