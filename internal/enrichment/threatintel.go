package enrichment

import (
	"context"
	"sync"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// ThreatIntelEnricher flags events matched against blacklists.
type ThreatIntelEnricher struct {
	blacklist map[string]string
	mu        sync.RWMutex
}

func NewThreatIntelEnricher() *ThreatIntelEnricher {
	return &ThreatIntelEnricher{
		blacklist: make(map[string]string),
	}
}

func (e *ThreatIntelEnricher) Name() string { return "ThreatIntel" }

// AddToBlacklist adds an indicator to the local blacklist.
func (e *ThreatIntelEnricher) AddToBlacklist(indicator, reason string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.blacklist[indicator] = reason
}

func (e *ThreatIntelEnricher) Enrich(ctx context.Context, ev *models.Event) error {
	e.mu.RLock()
	defer e.mu.RUnlock()

	// Check Host
	if reason, ok := e.blacklist[ev.Host]; ok {
		e.flag(ev, reason)
		return nil
	}

	// Check fields for src_ip, dest_ip, domain
	if ev.Fields != nil {
		for _, key := range []string{"src_ip", "dest_ip", "domain"} {
			if val, ok := ev.Fields[key].(string); ok {
				if reason, ok := e.blacklist[val]; ok {
					e.flag(ev, reason)
					return nil
				}
			}
		}
	}

	return nil
}

func (e *ThreatIntelEnricher) flag(ev *models.Event, reason string) {
	ev.Metadata["threat_match"] = "true"
	ev.Metadata["threat_reason"] = reason
	ev.Severity = models.SeverityHigh // Auto-escalate
}
