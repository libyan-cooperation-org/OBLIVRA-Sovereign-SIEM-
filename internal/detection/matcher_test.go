package detection

import (
	"testing"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func TestMatcher(t *testing.T) {
	m := NewMatcher()
	ev := &models.Event{
		Message: "Failed login attempt for user admin",
		Host:    "srv-auth-01",
		User:    "admin",
	}

	tests := []struct {
		name string
		cond Condition
		want bool
	}{
		{
			name: "Eq match",
			cond: Condition{Field: "user", Operator: "eq", Value: "admin"},
			want: true,
		},
		{
			name: "Eq mismatch",
			cond: Condition{Field: "user", Operator: "eq", Value: "root"},
			want: false,
		},
		{
			name: "Contains match",
			cond: Condition{Field: "message", Operator: "contains", Value: "Failed login"},
			want: true,
		},
		{
			name: "Regex match",
			cond: Condition{Field: "message", Operator: "regex", Value: "user [a-z]+"},
			want: true,
		},
		{
			name: "Nested AND match",
			cond: Condition{
				Logical: "and",
				Nested: []Condition{
					{Field: "user", Operator: "eq", Value: "admin"},
					{Field: "host", Operator: "eq", Value: "srv-auth-01"},
				},
			},
			want: true,
		},
		{
			name: "Nested OR match",
			cond: Condition{
				Logical: "or",
				Nested: []Condition{
					{Field: "user", Operator: "eq", Value: "guest"},
					{Field: "host", Operator: "eq", Value: "srv-auth-01"},
				},
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := m.Matches(ev, tt.cond); got != tt.want {
				t.Errorf("Matcher.Matches() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestThresholdTracker(t *testing.T) {
	tt := NewThresholdTracker()
	ruleID := "rule-1"
	threshold := 3
	window := 1 * time.Second

	// 1st event
	if tt.Record(ruleID, threshold, window) {
		t.Error("Threshold reached after 1 event")
	}

	// 2nd event
	if tt.Record(ruleID, threshold, window) {
		t.Error("Threshold reached after 2 events")
	}

	// 3rd event
	if !tt.Record(ruleID, threshold, window) {
		t.Error("Threshold not reached after 3 events")
	}

	// Wait for window to expire
	time.Sleep(1100 * time.Millisecond)

	// 4th event (should be 1st in new window if we didn't clear)
	// But the engine clears it after trigger. Let's test non-clear first by engine behavior simulation.
	tt.Clear(ruleID)
	if tt.Record(ruleID, threshold, window) {
		t.Error("Threshold reached after clear")
	}
}
