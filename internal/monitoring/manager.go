package monitoring

import (
	"context"
	"log"
	"runtime"
	"sync"
	"time"
)

// Stats represents the system health metrics.
type Stats struct {
	CPUUsage     float64 `json:"cpu_usage"`
	MemoryUsage  uint64  `json:"memory_usage"` // Bytes
	NumGoroutine int     `json:"num_goroutines"`
	EPS          int     `json:"eps"`
}

// Manager tracks system metrics and ingestion performance.
type Manager struct {
	mu       sync.Mutex
	epsCount int
	events   chan bool
}

func NewManager() *Manager {
	return &Manager{
		events: make(chan bool, 1000),
	}
}

// TrackEvent increments the events-per-second counter.
func (m *Manager) TrackEvent() {
	select {
	case m.events <- true:
	default:
		// Drop if overloaded
	}
}

// Start begins the monitoring loop.
func (m *Manager) Start(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-m.events:
				m.mu.Lock()
				m.epsCount++
				m.mu.Unlock()
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			stats := m.GetStats()
			// In a real system, we'd emit this as an internal event for the dashboard
			// models.Event{ ... }
			log.Printf("System Stats - EPS: %d, RAM: %d MB, GoRoutines: %d", stats.EPS, stats.MemoryUsage/1024/1024, stats.NumGoroutine)

			m.mu.Lock()
			m.epsCount = 0
			m.mu.Unlock()
		}
	}
}

// GetStats calculates the current health metrics.
func (m *Manager) GetStats() Stats {
	var mStats runtime.MemStats
	runtime.ReadMemStats(&mStats)

	m.mu.Lock()
	eps := m.epsCount / 2 // Based on 2-second ticker
	m.mu.Unlock()

	return Stats{
		MemoryUsage:  mStats.Alloc,
		NumGoroutine: runtime.NumGoroutine(),
		EPS:          eps,
	}
}
