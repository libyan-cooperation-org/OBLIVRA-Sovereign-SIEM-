package fim

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func TestFimEventGeneration(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "fim_test")
	if err != nil {
		t.Fatalf("failed to create tmp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	testFile := filepath.Join(tmpDir, "sensitive.txt")
	if err := os.WriteFile(testFile, []byte("initial content"), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	var triggeredEvent *models.Event
	handler := func(ctx context.Context, ev *models.Event) error {
		triggeredEvent = ev
		return nil
	}

	m, err := NewManager(handler)
	if err != nil {
		t.Fatalf("failed to create manager: %v", err)
	}
	m.Start(context.Background())

	if err := m.AddPath(testFile); err != nil {
		t.Fatalf("failed to add path: %v", err)
	}

	t.Run("File Modification", func(t *testing.T) {
		triggeredEvent = nil
		if err := os.WriteFile(testFile, []byte("changed content"), 0644); err != nil {
			t.Fatalf("failed to modify file: %v", err)
		}

		// Wait for fsnotify event
		select {
		case <-time.After(500 * time.Millisecond):
			if triggeredEvent == nil {
				t.Error("Expected FIM event to be triggered for modification")
			} else if triggeredEvent.Fields["op"] != "Modified" {
				t.Errorf("Expected op 'Modified', got '%v'", triggeredEvent.Fields["op"])
			}
		}
	})

	t.Run("File Deletion", func(t *testing.T) {
		triggeredEvent = nil
		if err := os.Remove(testFile); err != nil {
			t.Fatalf("failed to delete file: %v", err)
		}

		select {
		case <-time.After(500 * time.Millisecond):
			if triggeredEvent == nil {
				t.Error("Expected FIM event to be triggered for deletion")
			} else if triggeredEvent.Severity != models.SeverityCritical {
				t.Errorf("Expected severity 'critical', got '%s'", triggeredEvent.Severity)
			}
		}
	})
}
