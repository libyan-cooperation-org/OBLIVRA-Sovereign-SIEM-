package cases

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
)

func TestCasesManager(t *testing.T) {
	tmpDir, _ := os.MkdirTemp("", "cases_test")
	defer os.RemoveAll(tmpDir)
	dbPath := filepath.Join(tmpDir, "oblivra.db")

	store, err := sqlitestore.Open(dbPath)
	if err != nil {
		t.Fatalf("failed to open store: %v", err)
	}
	defer store.Close()

	m := NewManager(store)

	t.Run("Create and Retrieve Case", func(t *testing.T) {
		caseRec, err := m.CreateCase("Malware Outbreak", "Infection detected on segment A", "high", "open", "analyst1")
		if err != nil {
			t.Fatalf("failed to create case: %v", err)
		}

		if caseRec.Title != "Malware Outbreak" {
			t.Errorf("Expected title 'Malware Outbreak', got '%s'", caseRec.Title)
		}

		c, alerts, comments, err := m.GetCaseDetails(caseRec.ID)
		if err != nil {
			t.Fatalf("failed to get case details: %v", err)
		}

		if c.ID != caseRec.ID {
			t.Errorf("Expected ID %s, got %s", caseRec.ID, c.ID)
		}
		if len(alerts) != 0 {
			t.Errorf("Expected 0 alerts, got %d", len(alerts))
		}
		if len(comments) != 0 {
			t.Errorf("Expected 0 comments, got %d", len(comments))
		}
	})

	t.Run("Add Comments", func(t *testing.T) {
		caseRec, _ := m.CreateCase("Test Comments", "", "low", "open", "")

		_, err := m.AddComment(caseRec.ID, "analyst1", "Analyzing traces...")
		if err != nil {
			t.Errorf("failed to add comment: %v", err)
		}

		_, alerts, comments, _ := m.GetCaseDetails(caseRec.ID)
		if len(comments) != 1 {
			t.Errorf("Expected 1 comment, got %d", len(comments))
		}
		if comments[0].Author != "analyst1" {
			t.Errorf("Expected author 'analyst1', got '%s'", comments[0].Author)
		}
		if len(alerts) != 0 {
			t.Errorf("Expected 0 alerts, got %d", len(alerts))
		}
	})
}
