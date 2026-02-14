package cisco_asa

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/parsers"
)

var (
	// %ASA-6-302013: message
	asaRegex = regexp.MustCompile(`%ASA-(\d)-(\d+):\s?(.*)`)
)

type CiscoASAParser struct{}

func New() *CiscoASAParser {
	return &CiscoASAParser{}
}

func (p *CiscoASAParser) Name() string {
	return "cisco_asa"
}

func (p *CiscoASAParser) Description() string {
	return "Parses Cisco ASA firewall logs (%ASA-X-YYYYYY)"
}

func (p *CiscoASAParser) CanParse(raw string) bool {
	return strings.Contains(raw, "%ASA-")
}

func (p *CiscoASAParser) Parse(raw string) (*models.Event, error) {
	matches := asaRegex.FindStringSubmatch(raw)
	if len(matches) < 4 {
		// Try to find it if it's wrapped in syslog
		idx := strings.Index(raw, "%ASA-")
		if idx >= 0 {
			matches = asaRegex.FindStringSubmatch(raw[idx:])
		}
	}

	if len(matches) < 4 {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "no %ASA mnemonic found", Raw: raw}
	}

	severityInt, _ := strconv.Atoi(matches[1])
	mnemonic := matches[2]
	message := matches[3]

	fields := make(map[string]interface{})
	fields["mnemonic"] = mnemonic
	fields["severity_raw"] = severityInt

	// Extract extra info from message if possible (e.g., IPs)
	extractIPs(message, fields)

	return &models.Event{
		Timestamp: time.Now(), // Cisco logs often don't have year in syslog header
		Source:    "cisco_asa",
		Severity:  mapCiscoSeverity(severityInt),
		Category:  "FIREWALL",
		Message:   message,
		Raw:       raw,
		Fields:    fields,
	}, nil
}

func extractIPs(msg string, fields map[string]interface{}) {
	// Simple regex to find IP/Port patterns like 1.2.3.4/80
	ipRegex := regexp.MustCompile(`(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:/(\d+))?`)
	ips := ipRegex.FindAllStringSubmatch(msg, -1)
	for i, ip := range ips {
		prefix := fmt.Sprintf("ip_%d", i)
		fields[prefix] = ip[1]
		if len(ip) > 2 && ip[2] != "" {
			fields[prefix+"_port"] = ip[2]
		}
	}
}

func mapCiscoSeverity(level int) models.Severity {
	switch level {
	case 0, 1:
		return models.SeverityCritical
	case 2, 3:
		return models.SeverityHigh
	case 4:
		return models.SeverityMedium
	case 5, 6:
		return models.SeverityInfo
	default:
		return models.SeverityLow
	}
}

func init() {
	parsers.Register(New())
}
