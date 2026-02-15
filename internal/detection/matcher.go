package detection

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Condition represents a single rule condition.
type Condition struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"` // eq, contains, regex, gt, lt
	Value    interface{} `json:"value"`
	Logical  string      `json:"logical"` // and, or (for nested conditions)
	Nested   []Condition `json:"nested"`
}

// Rule is the internal representation of a detection rule.
type Rule struct {
	ID             string
	Name           string
	Severity       models.Severity
	Condition      Condition
	Threshold      int
	TimeWindow     int // seconds
	MITRE          string
	ResponseAction string
	ResponseParams string
}

// Matcher evaluates conditions against events.
type Matcher struct {
	regexCache map[string]*regexp.Regexp
}

func NewMatcher() *Matcher {
	return &Matcher{
		regexCache: make(map[string]*regexp.Regexp),
	}
}

// Matches returns true if the event satisfies the rule's condition.
func (m *Matcher) Matches(ev *models.Event, cond Condition) bool {
	// If nested conditions exist, handle logical grouping
	if len(cond.Nested) > 0 {
		if strings.ToLower(cond.Logical) == "or" {
			for _, n := range cond.Nested {
				if m.Matches(ev, n) {
					return true
				}
			}
			return false
		}
		// Default to AND
		for _, n := range cond.Nested {
			if !m.Matches(ev, n) {
				return false
			}
		}
		return true
	}

	// Basic field matching
	val := m.getFieldValue(ev, cond.Field)
	if val == "" {
		return false
	}

	targetValue, ok := cond.Value.(string)
	if !ok {
		return false
	}

	switch strings.ToLower(cond.Operator) {
	case "eq":
		return val == targetValue
	case "contains":
		return strings.Contains(strings.ToLower(val), strings.ToLower(targetValue))
	case "regex":
		re, err := m.getRegex(targetValue)
		if err != nil {
			return false
		}
		return re.MatchString(val)
	}

	return false
}

func (m *Matcher) getFieldValue(ev *models.Event, field string) string {
	switch strings.ToLower(field) {
	case "message":
		return ev.Message
	case "host":
		return ev.Host
	case "source":
		return ev.Source
	case "user":
		return ev.User
	case "severity":
		return string(ev.Severity)
	case "category":
		return ev.Category
	case "raw":
		return ev.Raw
	}

	// Check event metadata (threat_match, geo_country, etc.)
	if ev.Metadata != nil {
		if v, ok := ev.Metadata[field]; ok {
			return v
		}
	}

	// Check dynamic fields
	if ev.Fields != nil {
		if v, ok := ev.Fields[field]; ok {
			return fmt.Sprintf("%v", v)
		}
	}

	return ""
}

func (m *Matcher) getRegex(pattern string) (*regexp.Regexp, error) {
	if re, ok := m.regexCache[pattern]; ok {
		return re, nil
	}
	re, err := regexp.Compile(pattern)
	if err != nil {
		return nil, err
	}
	m.regexCache[pattern] = re
	return re, nil
}
