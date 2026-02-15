package enrichment

import (
	"context"
	"testing"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func TestEnrichmentManager(t *testing.T) {
	m := NewManager()
	geo := NewGeoIPEnricher()
	intel := NewThreatIntelEnricher()

	intel.AddToBlacklist("1.2.3.4", "Known C2")

	m.AddEnricher(geo)
	m.AddEnricher(intel)

	ctx := context.Background()

	t.Run("Public IP Enrichment", func(t *testing.T) {
		ev := &models.Event{Host: "8.8.8.8"}
		m.ProcessEvent(ctx, ev)

		if ev.Metadata["geo_country"] != "United States" {
			t.Errorf("Expected US, got %s", ev.Metadata["geo_country"])
		}
	})

	t.Run("Threat Intel Match", func(t *testing.T) {
		ev := &models.Event{Host: "1.2.3.4"}
		m.ProcessEvent(ctx, ev)

		if ev.Metadata["threat_match"] != "true" {
			t.Error("Expected threat_match to be true")
		}
		if ev.Severity != models.SeverityHigh {
			t.Error("Expected severity to be auto-escalated to HIGH")
		}
	})

	t.Run("Private IP Enrichment", func(t *testing.T) {
		ev := &models.Event{Host: "192.168.1.1"}
		m.ProcessEvent(ctx, ev)

		if ev.Metadata["geo_country"] != "Internal" {
			t.Errorf("Expected Internal, got %s", ev.Metadata["geo_country"])
		}
	})
}
