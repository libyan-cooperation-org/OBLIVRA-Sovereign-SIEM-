package paloalto

import (
	"encoding/csv"
	"fmt"
	"strings"
	"time"

	"github.com/Mr-Naps/oblivra/pkg/models"
	"github.com/Mr-Naps/oblivra/pkg/parsers"
)

type PaloAltoParser struct{}

func New() *PaloAltoParser {
	return &PaloAltoParser{}
}

func (p *PaloAltoParser) Name() string {
	return "paloalto"
}

func (p *PaloAltoParser) Description() string {
	return "Parses Palo Alto PAN-OS logs (CSV format)"
}

func (p *PaloAltoParser) CanParse(raw string) bool {
	// PAN-OS logs are CSV, often start with a syslog-like header or just a digit
	// Checking for common keywords in CSV positions
	parts := strings.Split(raw, ",")
	if len(parts) < 10 {
		return false
	}
	logType := parts[3]
	return logType == "TRAFFIC" || logType == "THREAT" || logType == "SYSTEM" || logType == "CONFIG"
}

func (p *PaloAltoParser) Parse(raw string) (*models.Event, error) {
	// Handle potential syslog header before CSV
	csvRaw := raw
	if idx := strings.Index(raw, ","); idx > 0 {
		// If the first part contains a space, it might be a syslog header
		firstPart := raw[:idx]
		if strings.Contains(firstPart, " ") {
			lastSpace := strings.LastIndex(firstPart, " ")
			csvRaw = raw[lastSpace+1:]
		}
	}

	reader := csv.NewReader(strings.NewReader(csvRaw))
	reader.LazyQuotes = true
	record, err := reader.Read()
	if err != nil {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "failed to parse CSV", Raw: raw}
	}

	if len(record) < 20 {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "incomplete CSV record", Raw: raw}
	}

	logType := record[3]
	tsStr := record[6]
	srcIP := record[7]
	dstIP := record[8]
	rule := record[11]

	ts, _ := time.Parse("2006/01/02 15:04:05", tsStr)

	fields := make(map[string]interface{})
	fields["log_type"] = logType
	fields["rule"] = rule
	fields["src_ip"] = srcIP
	fields["dst_ip"] = dstIP

	severity := models.SeverityInfo
	category := "FIREWALL"
	message := fmt.Sprintf("Palo Alto %s: %s -> %s", logType, srcIP, dstIP)

	if logType == "THREAT" && len(record) > 30 {
		threat := record[27]
		id := record[28]
		severity = mapThreatSeverity(record[29])
		message = fmt.Sprintf("Threat Detected: %s (%s)", threat, id)
		category = "SECURITY"
		fields["threat"] = threat
		fields["threat_id"] = id
	}

	return &models.Event{
		Timestamp: ts,
		Source:    "paloalto",
		Host:      record[2], // Serial number
		Severity:  severity,
		Category:  category,
		Message:   message,
		Raw:       raw,
		Fields:    fields,
	}, nil
}

func mapThreatSeverity(s string) models.Severity {
	switch strings.ToLower(s) {
	case "critical":
		return models.SeverityCritical
	case "high":
		return models.SeverityHigh
	case "medium":
		return models.SeverityMedium
	case "low":
		return models.SeverityLow
	default:
		return models.SeverityInfo
	}
}

func init() {
	parsers.Register(New())
}
