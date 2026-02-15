package forensics

import (
	"bytes"
	"testing"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func TestMerkleTreeConsistency(t *testing.T) {
	events := []*models.Event{
		{ID: "1", Message: "Log 1"},
		{ID: "2", Message: "Log 2"},
		{ID: "3", Message: "Log 3"},
		{ID: "4", Message: "Log 4"},
	}

	tree1, err := NewMerkleTree(events)
	if err != nil {
		t.Fatalf("failed to create tree 1: %v", err)
	}

	tree2, err := NewMerkleTree(events)
	if err != nil {
		t.Fatalf("failed to create tree 2: %v", err)
	}

	if !bytes.Equal(tree1.Hash, tree2.Hash) {
		t.Errorf("Merkle roots are not consistent: %x != %x", tree1.Hash, tree2.Hash)
	}
}

func TestMerkleTreeTamperDetection(t *testing.T) {
	event1 := &models.Event{ID: "1", Message: "Good Log"}
	event2 := &models.Event{ID: "2", Message: "Another Log"}

	events := []*models.Event{event1, event2}

	treeOrig, _ := NewMerkleTree(events)

	// Tamper with one event
	event1.Message = "Tampered Log"
	treeTampered, _ := NewMerkleTree(events)

	if bytes.Equal(treeOrig.Hash, treeTampered.Hash) {
		t.Error("Merkle root failed to detect tampering")
	}
}

func TestMerkleTreeOddNumber(t *testing.T) {
	events := []*models.Event{
		{ID: "1", Message: "Log 1"},
		{ID: "2", Message: "Log 2"},
		{ID: "3", Message: "Log 3"},
	}

	_, err := NewMerkleTree(events)
	if err != nil {
		t.Fatalf("failed to handle odd number of events: %v", err)
	}
}
