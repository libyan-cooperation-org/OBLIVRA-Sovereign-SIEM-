package nginx

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/parsers"
)

var (
	// Combined Log Format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
	accessRegex = regexp.MustCompile(`^(\S+)\s-\s(\S+)\s\[([^\]]+)\]\s"([^"]+)"\s(\d{3})\s(\d+)\s"([^"]*)"\s"([^"]*)"$`)

	// Error Log Format: 2023/10/11 22:14:15 [level] pid#tid: *conn msg, client: IP, server: Host, request: "REQ", host: "HOST"
	errorRegex = regexp.MustCompile(`^(\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2})\s\[([^\]]+)\]\s(\d+)#(\d+):\s(\*\d+\s)?([^,]+)(?:,\sclient:\s([^,]+))?(?:,\sserver:\s([^,]+))?(?:,\srequest:\s"([^"]+)")?(?:,\shost:\s"([^"]+)")?.*$`)
)

type NginxParser struct{}

func New() *NginxParser {
	return &NginxParser{}
}

func (p *NginxParser) Name() string {
	return "nginx"
}

func (p *NginxParser) Description() string {
	return "Parses Nginx access (Combined) and error logs"
}

func (p *NginxParser) CanParse(raw string) bool {
	return accessRegex.MatchString(raw) || errorRegex.MatchString(raw)
}

func (p *NginxParser) Parse(raw string) (*models.Event, error) {
	if accessRegex.MatchString(raw) {
		return p.parseAccess(raw)
	}
	if errorRegex.MatchString(raw) {
		return p.parseError(raw)
	}
	return nil, &parsers.ParsingError{Parser: p.Name(), Message: "unsupported nginx log format", Raw: raw}
}

func (p *NginxParser) parseAccess(raw string) (*models.Event, error) {
	matches := accessRegex.FindStringSubmatch(raw)
	if len(matches) < 9 {
		return nil, fmt.Errorf("invalid access log format")
	}

	clientIP := matches[1]
	user := matches[2]
	tsStr := matches[3]
	request := matches[4]
	status := matches[5]
	bytes := matches[6]
	referer := matches[7]
	agent := matches[8]

	ts, _ := time.Parse("02/Jan/2006:15:04:05 -0700", tsStr)

	severity := models.SeverityInfo
	if strings.HasPrefix(status, "4") || strings.HasPrefix(status, "5") {
		severity = models.SeverityHigh
	}

	return &models.Event{
		Timestamp: ts,
		Source:    "nginx_access",
		Host:      clientIP,
		User:      user,
		Severity:  severity,
		Category:  "WEB",
		Message:   fmt.Sprintf("HTTP %s %s - %s", status, request, clientIP),
		Raw:       raw,
		Fields: map[string]interface{}{
			"client_ip": clientIP,
			"request":   request,
			"status":    status,
			"bytes":     bytes,
			"referer":   referer,
			"agent":     agent,
		},
	}, nil
}

func (p *NginxParser) parseError(raw string) (*models.Event, error) {
	matches := errorRegex.FindStringSubmatch(raw)
	if len(matches) < 7 {
		return nil, fmt.Errorf("invalid error log format")
	}

	tsStr := matches[1]
	level := matches[2]
	pid := matches[3]
	tid := matches[4]
	msg := matches[6]

	client := ""
	if len(matches) > 7 {
		client = matches[7]
	}
	server := ""
	if len(matches) > 8 {
		server = matches[8]
	}
	request := ""
	if len(matches) > 9 {
		request = matches[9]
	}

	ts, _ := time.Parse("2006/01/02 15:04:05", tsStr)

	return &models.Event{
		Timestamp: ts,
		Source:    "nginx_error",
		Host:      server,
		Severity:  mapErrorLevel(level),
		Category:  "WEB_ERROR",
		Message:   msg,
		Raw:       raw,
		Fields: map[string]interface{}{
			"level":   level,
			"pid":     pid,
			"tid":     tid,
			"client":  client,
			"request": request,
		},
	}, nil
}

func mapErrorLevel(level string) models.Severity {
	switch level {
	case "emerg", "alert", "crit":
		return models.SeverityCritical
	case "error":
		return models.SeverityHigh
	case "warn":
		return models.SeverityMedium
	default:
		return models.SeverityInfo
	}
}

func init() {
	parsers.Register(New())
}
