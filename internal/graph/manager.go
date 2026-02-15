package graph

import (
	"fmt"
	"sync"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Node represents an entity in the attack graph.
type Node struct {
	ID    string `json:"id"`
	Type  string `json:"type"` // user, host, ip, process
	Label string `json:"label"`
}

// Edge represents a relationship between two entities.
type Edge struct {
	From   string `json:"from"`
	To     string `json:"to"`
	Action string `json:"action"` // login, connect, process_start
}

// Graph represents the collection of nodes and edges.
type Graph struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

// Manager handles entity relationship extraction and graph generation.
type Manager struct {
	mu sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{}
}

// GenerateFromEvents builds a graph from a slice of events.
func (m *Manager) GenerateFromEvents(events []*models.Event) *Graph {
	m.mu.RLock()
	defer m.mu.RUnlock()

	g := &Graph{
		Nodes: []Node{},
		Edges: []Edge{},
	}

	nodeMap := make(map[string]bool)

	addNode := func(id, nType, label string) {
		if id == "" || nodeMap[id] {
			return
		}
		g.Nodes = append(g.Nodes, Node{ID: id, Type: nType, Label: label})
		nodeMap[id] = true
	}

	addEdge := func(from, to, action string) {
		if from == "" || to == "" {
			return
		}
		g.Edges = append(g.Edges, Edge{From: from, To: to, Action: action})
	}

	for _, ev := range events {
		// Host Node
		addNode(ev.Host, "host", ev.Host)

		// User Node
		if ev.User != "" {
			addNode(ev.User, "user", ev.User)
			addEdge(ev.User, ev.Host, "activity_on")
		}

		// Process Activity (simplified)
		if proc, ok := ev.Fields["process_name"].(string); ok {
			procID := fmt.Sprintf("%s:%s", ev.Host, proc)
			addNode(procID, "process", proc)
			addEdge(ev.Host, procID, "executed")
		}

		// Network Activity
		if dest, ok := ev.Fields["dest_ip"].(string); ok {
			addNode(dest, "ip", dest)
			addEdge(ev.Host, dest, "connected_to")
		}
	}

	return g
}
