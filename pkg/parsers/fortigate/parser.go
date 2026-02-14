package fortigate

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/Mr-Naps/oblivra/pkg/models"
	"github.com/Mr-Naps/oblivra/pkg/parsers"
)

var (
	// Matches key=value or key="value with spaces"
	kvRegex = regexp.MustCompile(`(\w+)=("[^"]*"|\S+)`)
)

type FortiGateParser struct{}

func New() *FortiGateParser {
	return &FortiGateParser{}
}

func (p *FortiGateParser) Name() string {
	return "fortigate"
}

func (p *FortiGateParser) Description() string {
	return "Parses FortiGate firewall logs (KV format)"
}

func (p *FortiGateParser) CanParse(raw string) bool {
	return strings.Contains(raw, "devname=") || strings.Contains(raw, "devid=")
}

func (p *FortiGateParser) Parse(raw string) (*models.Event, error) {
	fields := make(map[string]interface{})

	// Extract all KV pairs
	matches := kvRegex.FindAllStringSubmatch(raw, -1)
	for _, m := range matches {
		key := m[1]
		val := strings.Trim(m[2], "\"")
		fields[key] = val
	}

	if len(fields) == 0 {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "no KV pairs found", Raw: raw}
	}

	// Extract Timestamp
	ts := time.Now()
	if date, ok := fields["date"]; ok {
		if t, ok2 := fields["time"]; ok2 {
			tsStr := fmt.Sprintf("%v %v", date, t)
			if parsedTs, err := time.Parse("2006-01-02 15:04:05", tsStr); err == nil {
				ts = parsedTs
			}
		}
	}

	host, _ := fields["devname"].(string)
	if host == "" {
		host, _ = fields["devid"].(string)
	}

	severity := mapLevel(fmt.Sprintf("%v", fields["level"]))
	category := fmt.Sprintf("%v", fields["type"])
	msg := fmt.Sprintf("FortiGate %s: %s", category, fields["msg"])
	if fields["msg"] == nil {
		msg = fmt.Sprintf("FortiGate %s log from %s", category, host)
	}

	return &models.Event{
		Timestamp: ts,
		Source:    "fortigate",
		Host:      host,
		Severity:  severity,
		Category:  category,
		Message:   msg,
		Raw:       raw,
		Fields:    fields,
	}, nil
}

func mapLevel(level string) models.Severity {
	switch level {
	case "emergency", "alert", "critical":
		return models.SeverityCritical
	case "error":
		return models.SeverityHigh
	case "warning":
		return models.SeverityMedium
	case "notice", "information":
		return models.SeverityInfo
	default:
		return models.SeverityLow
	}
}

func init() {
	parsers.Register(New())
}
