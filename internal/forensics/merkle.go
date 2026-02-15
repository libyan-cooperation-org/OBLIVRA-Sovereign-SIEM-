package forensics

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// MerkleNode represents a node in the Merkle Tree.
type MerkleNode struct {
	Left  *MerkleNode
	Right *MerkleNode
	Hash  []byte
}

// NewMerkleNode creates a new MerkleNode.
func NewMerkleNode(left, right *MerkleNode, data []byte) *MerkleNode {
	node := &MerkleNode{}

	if left == nil && right == nil {
		hash := sha256.Sum256(data)
		node.Hash = hash[:]
	} else {
		prevHashes := append(left.Hash, right.Hash...)
		hash := sha256.Sum256(prevHashes)
		node.Hash = hash[:]
	}

	node.Left = left
	node.Right = right

	return node
}

// NewMerkleTree builds a Merkle Tree from a slice of events.
func NewMerkleTree(events []*models.Event) (*MerkleNode, error) {
	var nodes []*MerkleNode

	if len(events) == 0 {
		return nil, fmt.Errorf("cannot build Merkle Tree from empty events")
	}

	for _, ev := range events {
		data, err := json.Marshal(ev)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal event %s: %w", ev.ID, err)
		}
		nodes = append(nodes, NewMerkleNode(nil, nil, data))
	}

	if len(nodes)%2 != 0 {
		nodes = append(nodes, nodes[len(nodes)-1])
	}

	for len(nodes) > 1 {
		var newLevel []*MerkleNode

		for i := 0; i < len(nodes); i += 2 {
			node := NewMerkleNode(nodes[i], nodes[i+1], nil)
			newLevel = append(newLevel, node)
		}

		nodes = newLevel
		if len(nodes) > 1 && len(nodes)%2 != 0 {
			nodes = append(nodes, nodes[len(nodes)-1])
		}
	}

	return nodes[0], nil
}

// ComputeHash calculates the hash of an event.
func ComputeEventHash(ev *models.Event) ([]byte, error) {
	data, err := json.Marshal(ev)
	if err != nil {
		return nil, err
	}
	hash := sha256.Sum256(data)
	return hash[:], nil
}
