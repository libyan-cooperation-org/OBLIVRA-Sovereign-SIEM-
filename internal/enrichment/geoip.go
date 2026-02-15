package enrichment

import (
	"context"
	"net"
	"strings"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// GeoIPEnricher adds geographic context to IP addresses.
type GeoIPEnricher struct{}

func NewGeoIPEnricher() *GeoIPEnricher {
	return &GeoIPEnricher{}
}

func (e *GeoIPEnricher) Name() string { return "GeoIP" }

func (e *GeoIPEnricher) Enrich(ctx context.Context, ev *models.Event) error {
	ipStr := e.extractIP(ev)
	if ipStr == "" {
		return nil
	}

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil
	}

	// Basic classification for now (Private vs Public)
	if ip.IsPrivate() {
		ev.Metadata["geo_country"] = "Internal"
		ev.Metadata["geo_city"] = "Private Network"
	} else {
		// Mock public IP lookup (In production, load MMDB)
		if strings.HasPrefix(ipStr, "8.8.8") {
			ev.Metadata["geo_country"] = "United States"
			ev.Metadata["geo_city"] = "Mountain View"
			ev.Metadata["geo_asn"] = "Google LLC (AS15169)"
		} else {
			ev.Metadata["geo_country"] = "Unknown"
		}
	}

	return nil
}

func (e *GeoIPEnricher) extractIP(ev *models.Event) string {
	// Try to find an IP in Host or Message
	host := ev.Host
	if net.ParseIP(host) != nil {
		return host
	}

	// Check fields
	if ev.Fields != nil {
		if srcIP, ok := ev.Fields["src_ip"].(string); ok {
			return srcIP
		}
	}

	return ""
}
