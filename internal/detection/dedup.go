package detection

import (
	"sync"
	"time"
)

// dedupKey uniquely identifies an alert instance.
// We combine ruleID + host so the same rule can still fire on different hosts.
type dedupKey struct {
	ruleID string
	host   string
}

// Deduplicator suppresses repeated alerts for the same rule+host within a
// configurable cooldown window.  After the window expires the rule can fire
// again (ensuring repeated attacks still generate new alerts on each cycle).
type Deduplicator struct {
	mu       sync.Mutex
	lastSeen map[dedupKey]time.Time
	cooldown time.Duration
}

// NewDeduplicator creates a Deduplicator with the given cooldown.
// A cooldown of 0 disables deduplication (every match generates an alert).
func NewDeduplicator(cooldown time.Duration) *Deduplicator {
	d := &Deduplicator{
		lastSeen: make(map[dedupKey]time.Time),
		cooldown: cooldown,
	}
	// Purge expired entries every 5 minutes to prevent unbounded growth.
	go d.gcLoop()
	return d
}

// Allow returns true when an alert for this rule+host should be emitted.
// It returns false if an identical alert was already emitted within the
// cooldown window.
func (d *Deduplicator) Allow(ruleID, host string) bool {
	if d.cooldown == 0 {
		return true
	}

	key := dedupKey{ruleID: ruleID, host: host}
	now := time.Now()

	d.mu.Lock()
	defer d.mu.Unlock()

	if last, ok := d.lastSeen[key]; ok {
		if now.Sub(last) < d.cooldown {
			return false // still in cooldown — suppress
		}
	}

	d.lastSeen[key] = now
	return true
}

// Reset forces the cooldown for a specific rule+host to expire immediately,
// allowing the next matching event to fire regardless of the window.
// Useful after a manual "acknowledge" so analysts can track recurrence.
func (d *Deduplicator) Reset(ruleID, host string) {
	d.mu.Lock()
	delete(d.lastSeen, dedupKey{ruleID: ruleID, host: host})
	d.mu.Unlock()
}

// gcLoop periodically removes entries whose cooldown has already expired.
func (d *Deduplicator) gcLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		d.gc()
	}
}

func (d *Deduplicator) gc() {
	now := time.Now()
	d.mu.Lock()
	defer d.mu.Unlock()
	for k, last := range d.lastSeen {
		if now.Sub(last) >= d.cooldown {
			delete(d.lastSeen, k)
		}
	}
}
