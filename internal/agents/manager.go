package agents

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
)

// Manager handles remote Sentinel agents.
type Manager struct {
	store *sqlitestore.DB
	mu    sync.RWMutex
}

// NewManager creates a new Agent Manager.
func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{
		store: store,
	}
}

// RegisterAgent handles the initial registration of a Sentinel agent.
func (m *Manager) RegisterAgent(a *sqlitestore.AgentRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	a.Status = "online"
	a.LastSeen = time.Now()

	if err := m.store.UpsertAgent(a); err != nil {
		return fmt.Errorf("agents: failed to register: %w", err)
	}

	log.Printf("Agent Registered: %s (%s) using %s", a.Hostname, a.IP, a.Protocol)
	return nil
}

// Heartbeat updates the agent's status and last seen timestamp.
func (m *Manager) Heartbeat(id string, eps int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := m.store.UpdateAgentStatus(id, "online", eps); err != nil {
		return fmt.Errorf("agents: failed to update heartbeat: %w", err)
	}

	return nil
}

// CheckHealth marks agents as offline if they haven't checked in recently.
func (m *Manager) CheckHealth(timeout time.Duration) {
	agents, err := m.store.ListAgents()
	if err != nil {
		log.Printf("agents: health check failed: %v", err)
		return
	}

	now := time.Now()
	for _, a := range agents {
		if a.Status == "online" && now.Sub(a.LastSeen) > timeout {
			log.Printf("Agent went OFFLINE: %s", a.Hostname)
			_ = m.store.UpdateAgentStatus(a.ID, "offline", a.EPS)
		}
	}
}

// StartHealthChecker runs a background loop to monitor agent connectivity.
func (m *Manager) StartHealthChecker(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.CheckHealth(interval * 3) // Timeout = 3x interval
		}
	}
}
