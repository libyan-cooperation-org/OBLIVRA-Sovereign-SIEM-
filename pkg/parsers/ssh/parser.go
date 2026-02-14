package ssh

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/Mr-Naps/oblivra/pkg/models"
	"github.com/Mr-Naps/oblivra/pkg/parsers"
)

var (
	// Accepted password for root from 1.2.3.4 port 5678 ssh2
	acceptedRegex = regexp.MustCompile(`Accepted\s+(\S+)\s+for\s+(\S+)\s+from\s+(\S+)\s+port\s+(\d+)\s+(\S+)`)

	// Failed password for invalid user admin from 10.0.0.5 port 1234 ssh2
	failedRegex = regexp.MustCompile(`Failed\s+(\S+)\s+for\s+(?:invalid\s+user\s+)?(\S+)\s+from\s+(\S+)\s+port\s+(\d+)\s+(\S+)`)

	// Connection closed by authenticating user root 1.1.1.1 port 123 [preauth]
	closedRegex = regexp.MustCompile(`Connection\s+closed\s+by\s+(?:authenticating\s+user\s+)?(\S+)\s+(\S+)\s+port\s+(\d+)`)

	// Standard Syslog-like header: Oct 11 22:14:15 host sshd[123]:
	headerRegex = regexp.MustCompile(`^([A-Z][a-z]{2}\s+\d+\s\d{2}:\d{2}:\d{2})\s(\S+)\s([^:]+):\s?(.*)$`)
)

type SSHParser struct{}

func New() *SSHParser {
	return &SSHParser{}
}

func (p *SSHParser) Name() string {
	return "ssh"
}

func (p *SSHParser) Description() string {
	return "Parses OpenSSH authentication and session logs"
}

func (p *SSHParser) CanParse(raw string) bool {
	return strings.Contains(raw, "sshd[") || strings.Contains(raw, "sshd:")
}

func (p *SSHParser) Parse(raw string) (*models.Event, error) {
	headerMatches := headerRegex.FindStringSubmatch(raw)
	var ts time.Time
	var host, tag, message string

	if len(headerMatches) >= 5 {
		ts = parseTime(headerMatches[1])
		host = headerMatches[2]
		tag = headerMatches[3]
		message = headerMatches[4]
	} else {
		// Fallback for logs without header (direct message)
		ts = time.Now()
		message = raw
	}

	fields := make(map[string]interface{})
	fields["tag"] = tag

	severity := models.SeverityInfo
	category := "AUTH"

	switch {
	case acceptedRegex.MatchString(message):
		m := acceptedRegex.FindStringSubmatch(message)
		fields["action"] = "accepted"
		fields["method"] = m[1]
		fields["user"] = m[2]
		fields["source_ip"] = m[3]
		fields["port"] = m[4]
		fields["proto"] = m[5]
		severity = models.SeverityLow
	case failedRegex.MatchString(message):
		m := failedRegex.FindStringSubmatch(message)
		fields["action"] = "failed"
		fields["method"] = m[1]
		fields["user"] = m[2]
		fields["source_ip"] = m[3]
		fields["port"] = m[4]
		fields["proto"] = m[5]
		severity = models.SeverityHigh
	case closedRegex.MatchString(message):
		m := closedRegex.FindStringSubmatch(message)
		fields["action"] = "closed"
		fields["user"] = m[1]
		fields["source_ip"] = m[2]
		fields["port"] = m[3]
	}

	return &models.Event{
		Timestamp: ts,
		Source:    "ssh",
		Host:      host,
		User:      fmt.Sprintf("%v", fields["user"]),
		Severity:  severity,
		Category:  category,
		Message:   message,
		Raw:       raw,
		Fields:    fields,
	}, nil
}

func parseTime(tsStr string) time.Time {
	year := time.Now().Year()
	ts, err := time.Parse("2006Jan _2 15:04:05", fmt.Sprintf("%d%s", year, tsStr))
	if err != nil {
		return time.Now()
	}
	return ts
}

func init() {
	parsers.Register(New())
}
