package syslog

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
	// RFC3164: <PRI>MMM DD HH:MM:SS HOST TAG: MESSAGE
	// Using (?s) to allow . to match newlines in the message part
	rfc3164Regex = regexp.MustCompile(`(?s)^<(\d+)>([A-Z][a-z]{2}\s+\d+\s\d{2}:\d{2}:\d{2})\s(\S+)\s([^:]+):\s?(.*)$`)

	// RFC5424: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
	rfc5424Regex = regexp.MustCompile(`^<(\d+)>(\d+)\s(\S+)\s(\S+)\s(\S+)\s(\S+)\s(\S+)\s(.*)$`)
)

type SyslogParser struct{}

func New() *SyslogParser {
	return &SyslogParser{}
}

func (p *SyslogParser) Name() string {
	return "linux_syslog"
}

func (p *SyslogParser) Description() string {
	return "Parses Linux Syslog (RFC3164 and RFC5424) formats"
}

func (p *SyslogParser) CanParse(raw string) bool {
	return strings.HasPrefix(raw, "<") && strings.Contains(raw, ">")
}

func (p *SyslogParser) Parse(raw string) (*models.Event, error) {
	// RFC5424 usually starts with <PRI>VERSION (e.g., <34>1)
	if strings.HasPrefix(raw, "<") {
		closeIdx := strings.Index(raw, ">")
		if closeIdx > 0 && closeIdx < 5 {
			// Version is right after the bracket in RFC5424
			if closeIdx+2 <= len(raw) && raw[closeIdx+1] >= '1' && raw[closeIdx+1] <= '9' {
				return p.parseRFC5424(raw)
			}
			return p.parseRFC3164(raw)
		}
	}
	return nil, &parsers.ParsingError{Parser: p.Name(), Message: "unsupported syslog format", Raw: raw}
}

func (p *SyslogParser) parseRFC3164(raw string) (*models.Event, error) {
	matches := rfc3164Regex.FindStringSubmatch(raw)
	if len(matches) < 6 {
		// Try a more relaxed RFC3164 match if the strict one fails
		relaxed := regexp.MustCompile(`(?s)^<(\d+)>([A-Z][a-z]{2}\s+\d+\s\d{2}:\d{2}:\d{2})\s(\S+)\s(.*)$`)
		matches = relaxed.FindStringSubmatch(raw)
		if len(matches) < 5 {
			return nil, fmt.Errorf("invalid RFC3164 format")
		}

		pri, _ := strconv.Atoi(matches[1])
		tsStr := matches[2]
		host := matches[3]
		msg := matches[4]

		return &models.Event{
			Timestamp: parseRfc3164Time(tsStr),
			Source:    "linux_syslog",
			Host:      host,
			Severity:  getSeverity(pri),
			Category:  "SYSTEM",
			Message:   msg,
			Raw:       raw,
			Fields: map[string]interface{}{
				"pri": pri,
			},
		}, nil
	}

	pri, _ := strconv.Atoi(matches[1])
	tsStr := matches[2]
	host := matches[3]
	tag := matches[4]
	msg := matches[5]

	return &models.Event{
		Timestamp: parseRfc3164Time(tsStr),
		Source:    "linux_syslog",
		Host:      host,
		Severity:  getSeverity(pri),
		Category:  "SYSTEM",
		Message:   msg,
		Raw:       raw,
		Fields: map[string]interface{}{
			"pri":   pri,
			"tag":   tag,
			"level": pri % 8,
		},
	}, nil
}

func parseRfc3164Time(tsStr string) time.Time {
	year := time.Now().Year()
	ts, err := time.Parse("2006Jan _2 15:04:05", fmt.Sprintf("%d%s", year, tsStr))
	if err != nil {
		return time.Now()
	}
	return ts
}

func (p *SyslogParser) parseRFC5424(raw string) (*models.Event, error) {
	// RFC5424 Header: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA [MSG]
	// We need to parse until MSGID (first 6 fields)
	parts := strings.SplitN(raw, " ", 7)
	if len(parts) < 7 {
		return nil, fmt.Errorf("invalid RFC5424 header")
	}

	priPart := parts[0]
	bracketIdx := strings.Index(priPart, ">")
	if bracketIdx < 0 {
		return nil, fmt.Errorf("invalid RFC5424 PRI header")
	}
	pri, _ := strconv.Atoi(priPart[1:bracketIdx])

	tsStr := parts[1]
	host := parts[2]
	app := parts[3]
	pid := parts[4]
	msgid := parts[5]
	rest := parts[6]

	var sd, msg string
	if strings.HasPrefix(rest, "-") {
		sd = "-"
		if len(rest) > 2 {
			msg = rest[2:] // Skip "- "
		}
	} else if strings.HasPrefix(rest, "[") {
		// Find the end of structured data
		// This can be multiple [...] blocks. SD ends when we find "] " or it's the end of string
		// For simplicity, find the last "]" followed by a space or end of string
		lastBracket := -1
		inBracket := 0
		for i, char := range rest {
			if char == '[' {
				inBracket++
			} else if char == ']' {
				inBracket--
				if inBracket == 0 {
					lastBracket = i
					// Check if next char is space or end
					if i+1 == len(rest) || rest[i+1] == ' ' {
						break
					}
				}
			}
		}
		if lastBracket != -1 {
			sd = rest[:lastBracket+1]
			if lastBracket+2 < len(rest) {
				msg = rest[lastBracket+2:]
			}
		} else {
			sd = rest
		}
	} else {
		// No SD? Unlikely in valid RFC5424 but handle
		msg = rest
	}

	ts, err := time.Parse(time.RFC3339Nano, tsStr)
	if err != nil {
		ts, _ = time.Parse(time.RFC3339, tsStr)
	}

	return &models.Event{
		Timestamp: ts,
		Source:    "linux_syslog",
		Host:      host,
		Severity:  getSeverity(pri),
		Category:  "SYSTEM",
		Message:   msg,
		Raw:       raw,
		Fields: map[string]interface{}{
			"pri":   pri,
			"app":   app,
			"pid":   pid,
			"msgid": msgid,
			"sd":    sd,
			"level": pri % 8,
			"fac":   pri / 8,
		},
	}, nil
}

func getSeverity(pri int) models.Severity {
	level := pri % 8
	switch level {
	case 0, 1: // Emergency, Alert
		return models.SeverityCritical
	case 2, 3: // Critical, Error
		return models.SeverityHigh
	case 4: // Warning
		return models.SeverityMedium
	case 5, 6: // Notice, Informational
		return models.SeverityInfo
	default: // Debug
		return models.SeverityLow
	}
}

func init() {
	parsers.Register(New())
}
