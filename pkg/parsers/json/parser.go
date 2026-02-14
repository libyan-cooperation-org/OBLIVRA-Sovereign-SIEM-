package json

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/parsers"
)

type GenericJSONParser struct{}

func New() *GenericJSONParser {
	return &GenericJSONParser{}
}

func (p *GenericJSONParser) Name() string {
	return "json"
}

func (p *GenericJSONParser) Description() string {
	return "Generic JSON catch-all parser"
}

func (p *GenericJSONParser) CanParse(raw string) bool {
	rawTrim := strings.TrimSpace(raw)
	return strings.HasPrefix(rawTrim, "{") && strings.HasSuffix(rawTrim, "}")
}

func (p *GenericJSONParser) Parse(raw string) (*models.Event, error) {
	var fields map[string]interface{}
	err := json.Unmarshal([]byte(raw), &fields)
	if err != nil {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "invalid JSON", Raw: raw}
	}

	event := &models.Event{
		Timestamp: time.Now(),
		Source:    "json_generic",
		Severity:  models.SeverityInfo,
		Category:  "LOG",
		Message:   "Generic JSON event",
		Raw:       raw,
		Fields:    fields,
	}

	// Intelligent field mapping
	for k, v := range fields {
		kl := strings.ToLower(k)
		switch kl {
		case "timestamp", "time", "ts", "@timestamp":
			if tsStr, ok := v.(string); ok {
				if t, err := time.Parse(time.RFC3339, tsStr); err == nil {
					event.Timestamp = t
				} else if t, err := time.Parse(time.RFC3339Nano, tsStr); err == nil {
					event.Timestamp = t
				}
			}
		case "message", "msg", "text":
			if msgStr, ok := v.(string); ok {
				event.Message = msgStr
			}
		case "host", "hostname", "computer":
			if hostStr, ok := v.(string); ok {
				event.Host = hostStr
			}
		case "user", "username":
			if userStr, ok := v.(string); ok {
				event.User = userStr
			}
		case "severity", "level":
			if sevStr, ok := v.(string); ok {
				event.Severity = mapSev(sevStr)
			}
		}
	}

	return event, nil
}

func mapSev(s string) models.Severity {
	switch strings.ToLower(s) {
	case "critical", "fatal", "emerg", "panic":
		return models.SeverityCritical
	case "error", "err", "high":
		return models.SeverityHigh
	case "warn", "warning", "medium":
		return models.SeverityMedium
	case "info", "informational", "low":
		return models.SeverityInfo
	default:
		return models.SeverityLow
	}
}

func init() {
	parsers.Register(New())
}
