package sysmon

import (
	"encoding/xml"
	"fmt"
	"strings"
	"time"

	"github.com/Mr-Naps/oblivra/pkg/models"
	"github.com/Mr-Naps/oblivra/pkg/parsers"
)

// Re-defining for Sysmon-specific context if needed, but keeping it compatible
type SysmonXML struct {
	XMLName string `xml:"Event"`
	System  struct {
		Provider struct {
			Name string `xml:"Name,attr"`
		} `xml:"Provider"`
		EventID     int `xml:"EventID"`
		TimeCreated struct {
			SystemTime string `xml:"SystemTime,attr"`
		} `xml:"TimeCreated"`
		Computer string `xml:"Computer"`
		Security struct {
			UserID string `xml:"UserID,attr"`
		} `xml:"Security"`
	} `xml:"System"`
	EventData struct {
		Data []struct {
			Name  string `xml:"Name,attr"`
			Value string `xml:",chardata"`
		} `xml:"Data"`
	} `xml:"EventData"`
}

type SysmonParser struct{}

func New() *SysmonParser {
	return &SysmonParser{}
}

func (p *SysmonParser) Name() string {
	return "windows_sysmon"
}

func (p *SysmonParser) Description() string {
	return "Parses Microsoft-Windows-Sysmon/Operational events"
}

func (p *SysmonParser) CanParse(raw string) bool {
	return strings.Contains(raw, "<Event") && strings.Contains(raw, "Microsoft-Windows-Sysmon")
}

func (p *SysmonParser) Parse(raw string) (*models.Event, error) {
	var sysmon SysmonXML
	err := xml.Unmarshal([]byte(raw), &sysmon)
	if err != nil {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "failed to unmarshal Sysmon XML", Raw: raw}
	}

	ts, _ := time.Parse(time.RFC3339Nano, sysmon.System.TimeCreated.SystemTime)
	if ts.IsZero() {
		ts, _ = time.Parse("2006-01-02T15:04:05.9999999Z", sysmon.System.TimeCreated.SystemTime)
	}

	fields := make(map[string]interface{})
	for _, data := range sysmon.EventData.Data {
		fields[data.Name] = data.Value
	}

	id := sysmon.System.EventID
	fields["event_id"] = id

	category, message := getSysmonInfo(id, fields)

	return &models.Event{
		Timestamp: ts,
		Source:    "windows_sysmon",
		Host:      sysmon.System.Computer,
		User:      sysmon.System.Security.UserID,
		Severity:  models.SeverityInfo, // Sysmon is mostly telemetry
		Category:  category,
		Message:   message,
		Raw:       raw,
		Fields:    fields,
	}, nil
}

func getSysmonInfo(id int, fields map[string]interface{}) (string, string) {
	switch id {
	case 1:
		return "PROCESS", fmt.Sprintf("Process Created: %v", fields["Image"])
	case 3:
		return "NETWORK", fmt.Sprintf("Network Connect: %v -> %v:%v", fields["SourceIp"], fields["DestinationIp"], fields["DestinationPort"])
	case 7:
		return "IMAGE_LOAD", fmt.Sprintf("Image Loaded: %v into %v", fields["ImageLoaded"], fields["Image"])
	case 8:
		return "THREAD_INJECTION", fmt.Sprintf("CreateRemoteThread: %v -> %v", fields["SourceImage"], fields["TargetImage"])
	case 10:
		return "PROCESS_ACCESS", fmt.Sprintf("Process Access: %v -> %v", fields["SourceImage"], fields["TargetImage"])
	case 11:
		return "FILE", fmt.Sprintf("File Created: %v", fields["TargetFilename"])
	case 22:
		return "DNS", fmt.Sprintf("DNS Query: %v -> %v", fields["QueryName"], fields["QueryResults"])
	default:
		return "SYSMON", fmt.Sprintf("Sysmon Event %d", id)
	}
}

func init() {
	parsers.Register(New())
}
