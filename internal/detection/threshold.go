package detection

import (
	"sync"
	"time"
)

// ThresholdTracker tracks event counts for rules with thresholds.
type ThresholdTracker struct {
	counts map[string][]time.Time // Key: ruleID + optional grouping
	mu     sync.Mutex
}

func NewThresholdTracker() *ThresholdTracker {
	return &ThresholdTracker{
		counts: make(map[string][]time.Time),
	}
}

// Record counts an occurrence and returns true if the threshold is reached.
func (t *ThresholdTracker) Record(ruleID string, threshold int, window time.Duration) bool {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	evs := t.counts[ruleID]

	// Filter out old events
	cutoff := now.Add(-window)
	var active []time.Time
	for _, ts := range evs {
		if ts.After(cutoff) {
			active = append(active, ts)
		}
	}

	active = append(active, now)
	t.counts[ruleID] = active

	return len(active) >= threshold
}

// Clear removes tracking data for a rule.
func (t *ThresholdTracker) Clear(ruleID string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.counts, ruleID)
}
