package enrichment

import (
	"context"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// AssetEnricher adds organizational context from the asset inventory.
type AssetEnricher struct {
	store *sqlitestore.DB
}

func NewAssetEnricher(store *sqlitestore.DB) *AssetEnricher {
	return &AssetEnricher{
		store: store,
	}
}

func (e *AssetEnricher) Name() string { return "Asset" }

func (e *AssetEnricher) Enrich(ctx context.Context, ev *models.Event) error {
	// Lookup host in assets table
	asset, err := e.store.GetAssetByHost(ev.Host)
	if err != nil {
		return nil // Ignore lookup errors
	}
	if asset == nil {
		return nil
	}

	ev.Metadata["asset_name"] = asset.Hostname
	ev.Metadata["asset_criticality"] = asset.Criticality
	ev.Metadata["asset_owner"] = asset.Owner

	// Tag event with asset ID if found
	if ev.Fields == nil {
		ev.Fields = make(map[string]interface{})
	}
	ev.Fields["asset_id"] = asset.ID

	return nil
}
