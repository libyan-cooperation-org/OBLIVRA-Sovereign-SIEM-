package models

import (
	"time"
)

// Severity represents the importance of an event
type Severity string

const (
	SeverityCritical Severity = "CRITICAL"
	SeverityHigh     Severity = "HIGH"
	SeverityMedium   Severity = "MEDIUM"
	SeverityLow      Severity = "LOW"
	SeverityInfo     Severity = "INFO"
)

// Event is the core data structure for all logs in OBLIVRA
type Event struct {
	ID        string                 `json:"id" bluge:"index=true"`
	Timestamp time.Time              `json:"timestamp" bluge:"index=true"`
	Source    string                 `json:"source" bluge:"index=true"`
	Host      string                 `json:"host" bluge:"index=true"`
	User      string                 `json:"user" bluge:"index=true"`
	Severity  Severity               `json:"severity" bluge:"index=true"`
	Category  string                 `json:"category" bluge:"index=true"`
	Message   string                 `json:"message" bluge:"index=true"`
	Raw       string                 `json:"raw"`
	Fields    map[string]interface{} `json:"fields"`
	Metadata  map[string]string      `json:"metadata"`
}

// Alert represents a triggered detection rule
type Alert struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	RuleID    string    `json:"rule_id"`
	Timestamp time.Time `json:"timestamp"`
	Severity  Severity  `json:"severity"`
	Title     string    `json:"title"`
	Summary   string    `json:"summary"`
	Status    string    `json:"status"` // Open, Investigating, Resolved, False Positive
	Assignee  string    `json:"assignee"`
}
