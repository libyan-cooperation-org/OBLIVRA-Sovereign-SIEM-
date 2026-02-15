package detection

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/compliance"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// AlertHandler defines how to process a triggered alert.
type AlertHandler func(ctx context.Context, alert *models.Alert) error

// Engine is the core detection processing unit.
type Engine struct {
	rules      []Rule
	matcher    *Matcher
	thresholds *ThresholdTracker
	dedup      *Deduplicator
	handler    AlertHandler
	compliance *compliance.Manager
	mu         sync.RWMutex
}

// NewEngine creates a new Detection Engine.
// dedupWindow controls how long a rule+host pair is suppressed after firing.
// A good default is 5 minutes for high-volume rules; pass 0 to disable.
func NewEngine(handler AlertHandler, comp *compliance.Manager) *Engine {
	return &Engine{
		matcher:    NewMatcher(),
		thresholds: NewThresholdTracker(),
		// 5-minute cooldown: same rule won't spam alerts on the same host
		dedup:      NewDeduplicator(5 * time.Minute),
		handler:    handler,
		compliance: comp,
	}
}

// LoadRules fetches enabled rules from the SQLite store.
func (e *Engine) LoadRules(store *sqlitestore.DB) error {
	records, err := store.ListRules(true)
	if err != nil {
		return fmt.Errorf("detection: list rules: %w", err)
	}

	var rules []Rule
	for _, r := range records {
		var cond Condition
		if err := json.Unmarshal([]byte(r.Condition), &cond); err != nil {
			log.Printf("detection: failed to parse rule %s condition: %v", r.ID, err)
			continue
		}

		threshold := r.Threshold
		window := r.Window
		if threshold < 1 {
			threshold = 1
		}
		if window < 0 {
			window = 0
		}

		rules = append(rules, Rule{
			ID:             r.ID,
			Name:           r.Name,
			Severity:       models.Severity(r.Severity),
			Condition:      cond,
			Threshold:      threshold,
			TimeWindow:     window,
			MITRE:          r.MITRE,
			ResponseAction: r.ResponseAction,
			ResponseParams: r.ResponseParams,
		})
	}

	e.mu.Lock()
	e.rules = rules
	e.mu.Unlock()

	log.Printf("Detection Engine loaded %d rules", len(rules))
	return nil
}

// ProcessEvent checks an event against all loaded rules.
func (e *Engine) ProcessEvent(ctx context.Context, ev *models.Event) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	for _, rule := range e.rules {
		if !e.matcher.Matches(ev, rule.Condition) {
			continue
		}

		// ── Threshold check ──────────────────────────────────────────────────
		// Rules with threshold > 1 only fire once N hits accumulate within
		// their time window.  After firing we clear the counter so the next
		// wave also requires N hits.
		if rule.Threshold > 1 && rule.TimeWindow > 0 {
			if !e.thresholds.Record(rule.ID+ev.Host, rule.Threshold, time.Duration(rule.TimeWindow)*time.Second) {
				continue // not yet reached threshold
			}
			e.thresholds.Clear(rule.ID + ev.Host)
		}

		// ── Deduplication ────────────────────────────────────────────────────
		// For single-shot rules (threshold == 1) we apply a per-host cooldown
		// so one noisy log source can't generate thousands of identical alerts.
		// Threshold-based rules skip dedup because the threshold itself already
		// acts as the rate limiter.
		if rule.Threshold <= 1 {
			if !e.dedup.Allow(rule.ID, ev.Host) {
				continue // suppressed within cooldown window
			}
		}

		// ── Build and emit alert ─────────────────────────────────────────────
		alert := &models.Alert{
			ID:        fmt.Sprintf("alt_%s_%d", rule.ID[:8], time.Now().UnixNano()),
			EventID:   ev.ID,
			RuleID:    rule.ID,
			Timestamp: ev.Timestamp,
			Severity:  rule.Severity,
			Title:     rule.Name,
			Host:      ev.Host,
			Summary:   fmt.Sprintf("Rule '%s' triggered on host %s", rule.Name, ev.Host),
			Status:    "open",
			Metadata:  make(map[string]string),
		}

		// Copy relevant event fields into alert metadata
		if ev.User != "" {
			alert.Metadata["user"] = ev.User
		}
		if ev.Source != "" {
			alert.Metadata["source"] = ev.Source
		}

		// MITRE enrichment via compliance manager
		if rule.MITRE != "" && e.compliance != nil {
			e.compliance.EnrichAlert(alert, rule.MITRE)
		}

		if err := e.handler(ctx, alert); err != nil {
			log.Printf("detection: alert handler failed for rule %s: %v", rule.ID, err)
		}
	}
}

// ReloadRules reloads rules from the store without restarting the engine.
func (e *Engine) ReloadRules(store *sqlitestore.DB) error {
	return e.LoadRules(store)
}

// RuleCount returns the number of currently loaded rules.
func (e *Engine) RuleCount() int {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return len(e.rules)
}
