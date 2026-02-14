package sysmon

import (
	"fmt"
	"testing"
)

func TestSysmonParser_Parse(t *testing.T) {
	p := New()

	genXML := func(id int, computer, user string, data map[string]string) string {
		dataStr := ""
		for k, v := range data {
			dataStr += fmt.Sprintf("<Data Name=\"%s\">%s</Data>", k, v)
		}
		return fmt.Sprintf(`
<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
	<System>
		<Provider Name="Microsoft-Windows-Sysmon" />
		<EventID>%d</EventID>
		<TimeCreated SystemTime="2023-10-11T22:14:15.123Z" />
		<Computer>%s</Computer>
		<Security UserID="%s" />
	</System>
	<EventData>
		%s
	</EventData>
</Event>`, id, computer, user, dataStr)
	}

	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"ID1_Process_Create", genXML(1, "WS01", "S-1-5-18", map[string]string{"Image": "C:\\Windows\\System32\\cmd.exe", "CommandLine": "cmd.exe /c whoami"}), false},
		{"ID3_Network_Connect", genXML(3, "WS01", "S-1-5-18", map[string]string{"SourceIp": "192.168.1.5", "DestinationIp": "8.8.8.8", "DestinationPort": "53"}), false},
		{"ID11_File_Create", genXML(11, "WS01", "S-1-5-18", map[string]string{"TargetFilename": "C:\\temp\\payload.exe"}), false},
		{"ID22_DNS_Query", genXML(22, "WS01", "S-1-5-18", map[string]string{"QueryName": "malware.com", "QueryResults": "1.2.3.4"}), false},
	}

	for i := 0; i < 46; i++ {
		id := (i % 25) + 1
		tests = append(tests, struct {
			name    string
			raw     string
			wantErr bool
		}{
			fmt.Sprintf("Variant_ID_%d_%d", id, i),
			genXML(id, "HOST-SYS", "SID-123", map[string]string{"Key": "Value"}),
			false,
		})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("SysmonParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestSysmonParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse("<Event>...Microsoft-Windows-Sysmon...</Event>") {
		t.Error("CanParse failed for valid Sysmon XML")
	}
}
