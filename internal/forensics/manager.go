package forensics

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Manager handles the creation and verification of integrity blocks.
type Manager struct {
	store    *sqlitestore.DB
	batch    []*models.Event
	prevHash []byte
	mu       sync.Mutex
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup

	blockSize     int
	sealingPeriod time.Duration
}

// NewManager creates a new Forensics Manager.
func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{
		store:         store,
		batch:         make([]*models.Event, 0),
		blockSize:     100,             // 100 events per block
		sealingPeriod: 5 * time.Minute, // Auto-seal every 5 mins
	}
}

// Start begins the forensics manager background worker.
func (m *Manager) Start(ctx context.Context) error {
	m.ctx, m.cancel = context.WithCancel(ctx)

	// Load the last block to get the previous hash
	last, err := m.store.GetLastIntegrityBlock()
	if err != nil {
		return fmt.Errorf("forensics: load last block: %w", err)
	}
	if last != nil {
		m.prevHash = last.RootHash
	} else {
		m.prevHash = make([]byte, 32) // Genesis block hash
	}

	m.wg.Add(1)
	go m.sealer()

	log.Printf("Forensics Manager started (Last Hash: %x)", m.prevHash)
	return nil
}

// Stop shuts down the forensics manager.
func (m *Manager) Stop() {
	if m.cancel != nil {
		m.cancel()
	}
	m.wg.Wait()
	log.Printf("Forensics Manager stopped")
}

// ProcessEvent adds an event to the current integrity block candidate.
func (m *Manager) ProcessEvent(ctx context.Context, ev *models.Event) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.batch = append(m.batch, ev)
	if len(m.batch) >= m.blockSize {
		go m.sealCurrentBatch()
	}
}

func (m *Manager) sealer() {
	defer m.wg.Done()
	ticker := time.NewTicker(m.sealingPeriod)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			m.sealCurrentBatch()
			return
		case <-ticker.C:
			m.sealCurrentBatch()
		}
	}
}

func (m *Manager) sealCurrentBatch() {
	m.mu.Lock()
	if len(m.batch) == 0 {
		m.mu.Unlock()
		return
	}
	events := m.batch
	m.batch = make([]*models.Event, 0)
	prevHash := m.prevHash
	m.mu.Unlock()

	tree, err := NewMerkleTree(events)
	if err != nil {
		log.Printf("forensics: failed to create Merkle Tree: %v", err)
		return
	}

	block := &sqlitestore.IntegrityBlockRecord{
		RootHash:   tree.Hash,
		PrevHash:   prevHash,
		EventCount: len(events),
		Timestamp:  time.Now(),
	}

	if err := m.store.InsertIntegrityBlock(block); err != nil {
		log.Printf("forensics: failed to persist integrity block: %v", err)
		return
	}

	m.mu.Lock()
	m.prevHash = block.RootHash
	m.mu.Unlock()

	log.Printf("Forensics: Sealed block %d (events: %d, root: %x)", block.ID, block.EventCount, block.RootHash)
}

// CaptureEvidence takes an event and records it as forensic evidence.
func (m *Manager) CaptureEvidence(caseID, eventID, user, reason string, rawEvent string) error {
	hasher := sha256.New()
	hasher.Write([]byte(rawEvent))
	hash := hex.EncodeToString(hasher.Sum(nil))

	evidence := &sqlitestore.EvidenceRecord{
		ID:         uuid.NewString(),
		CaseID:     caseID,
		EventID:    eventID,
		RecordedBy: user,
		Reason:     reason,
		RawHash:    hash,
		CreatedAt:  time.Now(),
	}

	if err := m.store.InsertEvidence(evidence); err != nil {
		return err
	}

	// Log audit trail
	audit := &sqlitestore.AuditRecord{
		ID:         uuid.NewString(),
		UserID:     user,
		Action:     "evidence_captured",
		TargetType: "case",
		TargetID:   caseID,
		Details:    fmt.Sprintf("Event %s captured as evidence. Hash: %s", eventID, hash),
		Timestamp:  time.Now(),
	}

	return m.store.InsertAuditLog(audit)
}
