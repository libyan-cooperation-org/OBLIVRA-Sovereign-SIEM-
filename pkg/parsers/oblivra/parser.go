package oblivra

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/Mr-Naps/oblivra/pkg/models"
	"github.com/Mr-Naps/oblivra/pkg/parsers"
)

type OblivraAgentParser struct{}

func New() *OblivraAgentParser {
	return &OblivraAgentParser{}
}

func (p *OblivraAgentParser) Name() string {
	return "oblivra"
}

func (p *OblivraAgentParser) Description() string {
	return "Parses OBLIVRA Agent native JSON format"
}

func (p *OblivraAgentParser) CanParse(raw string) bool {
	return strings.Contains(raw, "\"source\":\"agent\"") || strings.Contains(raw, "\"source\": \"agent\"")
}

func (p *OblivraAgentParser) Parse(raw string) (*models.Event, error) {
	var ev models.Event
	err := json.Unmarshal([]byte(raw), &ev)
	if err != nil {
		return nil, &parsers.ParsingError{Parser: p.Name(), Message: "failed to parse JSON", Raw: raw}
	}

	// Ensure fields are present
	if ev.Timestamp.IsZero() {
		ev.Timestamp = time.Now()
	}
	if ev.Raw == "" {
		ev.Raw = raw
	}
	if ev.Source == "" {
		ev.Source = "oblivra_agent"
	}

	return &ev, nil
}

func init() {
	parsers.Register(New())
}
