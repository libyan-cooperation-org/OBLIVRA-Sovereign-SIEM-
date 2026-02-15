package models

import "time"

// HoneytokenType represents the category of the deception trap.
type HoneytokenType string

const (
	HoneytokenUser     HoneytokenType = "USER"
	HoneytokenFile     HoneytokenType = "FILE"
	HoneytokenURL      HoneytokenType = "URL"
	HoneytokenIP       HoneytokenType = "IP"
	HoneytokenHostname HoneytokenType = "HOSTNAME"
)

// Honeytoken represents a fake entity designed to trigger alerts.
type Honeytoken struct {
	ID          string         `json:"id"`
	Type        HoneytokenType `json:"type"`
	Value       string         `json:"value"`
	Description string         `json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
}
