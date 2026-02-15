package agents

import (
	"context"
	"testing"
	"time"
)

func TestAgentManagement(t *testing.T) {
	// Mock store is difficult without real SQLite, but we can verify the Manager logic
	// if we had a more abstracted store. For now, we'll test the loop logic.

	m := NewManager(nil) // Using nil store to test non-DB dependent logic if any

	t.Run("Health Checker Loop", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())

		// This is just a smoke test for the loop starting
		go m.StartHealthChecker(ctx, 10*time.Millisecond)
		time.Sleep(20 * time.Millisecond)
		cancel()
	})
}
