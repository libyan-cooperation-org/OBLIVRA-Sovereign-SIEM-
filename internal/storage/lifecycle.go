// Package storage (lifecycle.go) implements the data retention policy for OBLIVRA.
// A background goroutine runs once per day and purges events older than
// StorageConfig.Retention days from both BadgerDB and the Bluge index.
package storage

import (
	"context"
	"time"
)

const gcSchedule = 24 * time.Hour

// StartLifecycleManager launches the background retention goroutine.
// It stops when ctx is cancelled.
func (e *Engine) StartLifecycleManager(ctx context.Context, retentionDays int) {
	go e.lifecycleLoop(ctx, retentionDays)
}

func (e *Engine) lifecycleLoop(ctx context.Context, retentionDays int) {
	if retentionDays <= 0 {
		return // retention disabled
	}

	ticker := time.NewTicker(gcSchedule)
	defer ticker.Stop()

	// Run immediately on startup, then on the daily schedule.
	e.purgeOldEvents(retentionDays)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			e.purgeOldEvents(retentionDays)
		}
	}
}

// purgeOldEvents deletes events older than retentionDays from BadgerDB.
// Bluge documents for those events are deleted by ID via a time-range query.
func (e *Engine) purgeOldEvents(retentionDays int) {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)

	// 1. Fetch IDs of events to be deleted from BadgerDB (for Bluge cleanup).
	oldEvents, err := e.Badger.QueryTimeRange(time.Time{}, cutoff, 100_000)
	if err != nil {
		// Log and continue — partial purge is better than no purge.
		return
	}

	// 2. Delete from Bluge index.
	for _, ev := range oldEvents {
		_ = e.Bluge.DeleteEvent(ev.ID)
	}

	// 3. Delete raw payloads from BadgerDB.
	_, _ = e.Badger.DeleteOlderThan(cutoff)
}

// StorageStats holds combined metrics from all three engines.
type StorageStats struct {
	BadgerLSMBytes  int64  `json:"badger_lsm_bytes"`
	BadgerVLogBytes int64  `json:"badger_vlog_bytes"`
	SQLitePath      string `json:"sqlite_path"`
}

// Stats returns combined storage metrics for the dashboard.
func (e *Engine) Stats() StorageStats {
	bs := e.Badger.Stats()
	return StorageStats{
		BadgerLSMBytes:  bs.LSMBytes,
		BadgerVLogBytes: bs.VLogBytes,
	}
}

// ─── SEARCH & STATS ──────────────────────────────────────────────────────────
