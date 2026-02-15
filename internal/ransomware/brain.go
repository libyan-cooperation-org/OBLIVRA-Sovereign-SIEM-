package ransomware

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/ransomware/containment"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/ransomware/detection"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Brain is the central orchestration engine for the Ransomware Defense System.
type Brain struct {
	BehavioralEngine *detection.BehavioralEngine
	CanaryMonitor    *detection.CanaryMonitor
	Orchestrator     *containment.Orchestrator

	eventBuffer []*models.Event
	mu          sync.Mutex
}

func NewBrain() *Brain {
	return &Brain{
		BehavioralEngine: detection.NewBehavioralEngine(),
		CanaryMonitor:    detection.NewCanaryMonitor(),
		Orchestrator:     containment.NewOrchestrator(),
		eventBuffer:      make([]*models.Event, 0),
	}
}

// Start initiates the background monitoring loops.
func (b *Brain) Start(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			b.RunDetectionCycle(ctx)
		}
	}
}

// ProcessEvent adds an event to the brain for behavioral analysis.
func (b *Brain) ProcessEvent(ctx context.Context, ev *models.Event) {
	b.mu.Lock()
	defer b.mu.Unlock()

	// Keep a rolling buffer of recent events (e.g., last 5 minutes)
	b.eventBuffer = append(b.eventBuffer, ev)

	// Trim buffer (Simplified: keep last 1000 events)
	if len(b.eventBuffer) > 1000 {
		b.eventBuffer = b.eventBuffer[len(b.eventBuffer)-1000:]
	}
}

// RunDetectionCycle executes detection logic and triggers responses.
func (b *Brain) RunDetectionCycle(ctx context.Context) {
	// 1. Check Canary Files (High confidence, immediate action)
	canaryAlerts := b.CanaryMonitor.CheckIntegrity()
	for _, alert := range canaryAlerts {
		log.Printf("[RDS-BRAIN] CRITICAL: Canary triggered on host %s", alert.Host)
		b.HandleCriticalAlert(ctx, &alert)
	}

	// 2. Behavioral Analysis
	b.mu.Lock()
	events := make([]*models.Event, len(b.eventBuffer))
	copy(events, b.eventBuffer)
	b.mu.Unlock()

	threat := b.BehavioralEngine.Analyze(events)
	if threat.Value >= 70 {
		log.Printf("[RDS-BRAIN] HIGH THREAT DETECTED: Score %d, Indicators: %v", threat.Value, threat.Indicators)
		// Trigger automated response based on policy
		b.Orchestrator.ExecuteRansomwareResponse(ctx, threat)
	}
}

func (b *Brain) HandleCriticalAlert(ctx context.Context, alert *models.Alert) {
	// Immediate containment for canary triggers
	err := b.Orchestrator.IsolateHost(alert.Host, "Canary file trigger")
	if err != nil {
		log.Printf("[RDS-BRAIN] Failed to isolate host %s: %v", alert.Host, err)
	}
}
