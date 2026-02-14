package windows_event

import (
	"encoding/xml"
	"fmt"
	"strings"
	"time"

	"github.com/Mr-Naps/oblivra/pkg/models"
	"github.com/Mr-Naps/oblivra/pkg/parsers"
)

// WinEventXML represents the standard Windows Event XML structure
type WinEventXML struct {
	XMLName string `xml:"Event"`
	System  struct {
		Provider struct {
			Name string `xml:"Name,attr"`
			Guid string `xml:"Guid,attr"`
		} `xml:"Provider"`
		EventID     int    `xml:"EventID"`
		Version     int    `xml:"Version"`
		Level       int    `xml:"Level"`
		Task        int    `xml:"Task"`
		Opcode      int    `xml:"Opcode"`
		Keywords    string `xml:"Keywords"`
		TimeCreated struct {
			SystemTime string `xml:"SystemTime,attr"`
		} `xml:"TimeCreated"`
		EventRecordID int      `xml:"EventRecordID"`
		Correlation   struct{} `xml:"Correlation"`
		Execution     struct {
			ProcessID string `xml:"ProcessID,attr"`
			ThreadID  string `xml:"ThreadID,attr"`
		} `xml:"Execution"`
		Channel  string `xml:"Channel"`
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

type WindowsEventParser struct{}

func New() *WindowsEventParser {
	return &WindowsEventParser{}
}

func (p *WindowsEventParser) Name() string {
	return "windows_event"
}

func (p *WindowsEventParser) Description() string {
	return "Parses Windows Security and System Event Logs (XML format)"
}

func (p *WindowsEventParser) CanParse(raw string) bool {
	return strings.Contains(raw, "<Event") && strings.Contains(raw, "</Event>")
}

func (p *WindowsEventParser) Parse(raw string) (*models.Event, error) {
	var winEvent WinEventXML
	err := xml.Unmarshal([]byte(raw), &winEvent)
	if err != nil {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "failed to unmarshal XML", Raw: raw}
	}

	ts, _ := time.Parse(time.RFC3339Nano, winEvent.System.TimeCreated.SystemTime)
	if ts.IsZero() {
		ts, _ = time.Parse("2006-01-02T15:04:05.9999999Z", winEvent.System.TimeCreated.SystemTime)
	}

	fields := make(map[string]interface{})
	for _, data := range winEvent.EventData.Data {
		fields[data.Name] = data.Value
	}

	fields["event_id"] = winEvent.System.EventID
	fields["provider"] = winEvent.System.Provider.Name
	fields["channel"] = winEvent.System.Channel
	fields["record_id"] = winEvent.System.EventRecordID

	return &models.Event{
		Timestamp: ts,
		Source:    "windows_event",
		Host:      winEvent.System.Computer,
		User:      winEvent.System.Security.UserID,
		Severity:  mapLevelToSeverity(winEvent.System.Level),
		Category:  winEvent.System.Channel,
		Message:   fmt.Sprintf("Windows Event %d from %s", winEvent.System.EventID, winEvent.System.Provider.Name),
		Raw:       raw,
		Fields:    fields,
	}, nil
}

func mapLevelToSeverity(level int) models.Severity {
	switch level {
	case 1: // Critical
		return models.SeverityCritical
	case 2: // Error
		return models.SeverityHigh
	case 3: // Warning
		return models.SeverityMedium
	case 4: // Information
		return models.SeverityInfo
	default:
		return models.SeverityLow
	}
}

func init() {
	parsers.Register(New())
}
