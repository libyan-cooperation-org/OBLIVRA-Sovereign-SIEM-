package forensics

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"log"
	"os"
	"path/filepath"
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

	// Ed25519 signing key — generated once, persisted to disk
	privKey ed25519.PrivateKey
	pubKey  ed25519.PublicKey
}

// NewManager creates a new Forensics Manager.
func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{
		store:         store,
		batch:         make([]*models.Event, 0),
		blockSize:     100,
		sealingPeriod: 5 * time.Minute,
	}
}

// Start begins the forensics manager background worker.
func (m *Manager) Start(ctx context.Context) error {
	m.ctx, m.cancel = context.WithCancel(ctx)

	// Load or generate the signing key pair
	if err := m.loadOrGenerateKey(); err != nil {
		log.Printf("forensics: warning — could not load signing key: %v (blocks will be unsigned)", err)
	}

	// Load the last block to get the previous hash
	last, err := m.store.GetLastIntegrityBlock()
	if err != nil {
		return fmt.Errorf("forensics: load last block: %w", err)
	}
	if last != nil {
		m.prevHash = last.RootHash
	} else {
		m.prevHash = make([]byte, 32) // Genesis block: all zeros
	}

	m.wg.Add(1)
	go m.sealer()

	log.Printf("Forensics Manager started (prevHash: %x…)", m.prevHash[:8])
	return nil
}

// Stop shuts down the forensics manager gracefully, sealing any pending batch.
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
		// Capture and reset batch before launching goroutine
		events := m.batch
		m.batch = make([]*models.Event, 0)
		prevHash := m.prevHash
		go m.sealBatch(events, prevHash)
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

	m.sealBatch(events, prevHash)
}

func (m *Manager) sealBatch(events []*models.Event, prevHash []byte) {
	tree, err := NewMerkleTree(events)
	if err != nil {
		log.Printf("forensics: Merkle tree build failed: %v", err)
		return
	}

	block := &sqlitestore.IntegrityBlockRecord{
		RootHash:   tree.Hash,
		PrevHash:   prevHash,
		EventCount: len(events),
		Timestamp:  time.Now(),
	}

	// ── Ed25519 signature ─────────────────────────────────────────────────
	// We sign sha256(rootHash || prevHash || eventCount || timestamp) so the
	// signature covers both the content and the chain linkage.
	if m.privKey != nil {
		payload := append(block.RootHash, block.PrevHash...)
		tsBytes := []byte(fmt.Sprintf("%d:%d", block.EventCount, block.Timestamp.UnixNano()))
		payload = append(payload, tsBytes...)
		digest := sha256.Sum256(payload)
		block.Signature = ed25519.Sign(m.privKey, digest[:])
	}

	if err := m.store.InsertIntegrityBlock(block); err != nil {
		log.Printf("forensics: failed to persist integrity block: %v", err)
		return
	}

	m.mu.Lock()
	m.prevHash = block.RootHash
	m.mu.Unlock()

	sigStatus := "unsigned"
	if len(block.Signature) > 0 {
		sigStatus = fmt.Sprintf("sig:%x…", block.Signature[:8])
	}
	log.Printf("Forensics: sealed block (events:%d root:%x… %s)", block.EventCount, block.RootHash[:8], sigStatus)
}

// VerifyBlock verifies the Ed25519 signature on an integrity block.
// Returns (true, nil) if valid, (false, nil) if the block was unsigned,
// and (false, err) if verification fails.
func (m *Manager) VerifyBlock(block *sqlitestore.IntegrityBlockRecord) (bool, error) {
	if len(block.Signature) == 0 {
		return false, nil // unsigned — was sealed before key was available
	}
	if m.pubKey == nil {
		return false, fmt.Errorf("no public key available for verification")
	}

	payload := append(block.RootHash, block.PrevHash...)
	tsBytes := []byte(fmt.Sprintf("%d:%d", block.EventCount, block.Timestamp.UnixNano()))
	payload = append(payload, tsBytes...)
	digest := sha256.Sum256(payload)

	ok := ed25519.Verify(m.pubKey, digest[:], block.Signature)
	if !ok {
		return false, fmt.Errorf("signature verification failed — block may be tampered")
	}
	return true, nil
}

// PublicKeyHex returns the hex-encoded Ed25519 public key for external auditors.
func (m *Manager) PublicKeyHex() string {
	if m.pubKey == nil {
		return ""
	}
	return hex.EncodeToString(m.pubKey)
}

// ── Key management ────────────────────────────────────────────────────────────

func (m *Manager) loadOrGenerateKey() error {
	home, _ := os.UserHomeDir()
	keyDir := filepath.Join(home, ".oblivra", "keys")
	privPath := filepath.Join(keyDir, "forensics_ed25519.pem")
	pubPath := filepath.Join(keyDir, "forensics_ed25519_pub.pem")

	if err := os.MkdirAll(keyDir, 0o700); err != nil {
		return err
	}

	// Try loading existing key
	if data, err := os.ReadFile(privPath); err == nil {
		block, _ := pem.Decode(data)
		if block != nil && block.Type == "ED25519 PRIVATE KEY" && len(block.Bytes) == ed25519.PrivateKeySize {
			m.privKey = ed25519.PrivateKey(block.Bytes)
			m.pubKey = m.privKey.Public().(ed25519.PublicKey)
			log.Printf("Forensics: loaded Ed25519 signing key from %s", privPath)
			return nil
		}
	}

	// Generate new key pair
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return fmt.Errorf("generate ed25519: %w", err)
	}
	m.privKey = priv
	m.pubKey = pub

	// Persist private key
	privBlock := &pem.Block{Type: "ED25519 PRIVATE KEY", Bytes: []byte(priv)}
	if err := os.WriteFile(privPath, pem.EncodeToMemory(privBlock), 0o600); err != nil {
		return fmt.Errorf("write private key: %w", err)
	}

	// Persist public key (for external auditors)
	pubBlock := &pem.Block{Type: "ED25519 PUBLIC KEY", Bytes: []byte(pub)}
	if err := os.WriteFile(pubPath, pem.EncodeToMemory(pubBlock), 0o644); err != nil {
		log.Printf("forensics: warning — could not write public key: %v", err)
	}

	log.Printf("Forensics: generated new Ed25519 signing key at %s", privPath)
	log.Printf("Forensics: public key for auditors: %s", hex.EncodeToString(pub))
	return nil
}

// ── Evidence capture ──────────────────────────────────────────────────────────

// CaptureEvidence takes an event and records it as forensic evidence.
func (m *Manager) CaptureEvidence(caseID, eventID, user, reason string, rawEvent string) error {
	hasher := sha256.New()
	hasher.Write([]byte(rawEvent))
	hash := hex.EncodeToString(hasher.Sum(nil))

	// Sign the hash if we have a key
	var sig string
	if m.privKey != nil {
		hashBytes, _ := hex.DecodeString(hash)
		sigBytes := ed25519.Sign(m.privKey, hashBytes)
		sig = hex.EncodeToString(sigBytes)
	}

	evidence := &sqlitestore.EvidenceRecord{
		ID:         uuid.NewString(),
		CaseID:     caseID,
		EventID:    eventID,
		RecordedBy: user,
		Reason:     reason,
		RawHash:    hash,
		Signature:  sig,
		CreatedAt:  time.Now(),
	}

	if err := m.store.InsertEvidence(evidence); err != nil {
		return err
	}

	// Audit trail
	audit := &sqlitestore.AuditRecord{
		ID:         uuid.NewString(),
		UserID:     user,
		Action:     "evidence_captured",
		TargetType: "case",
		TargetID:   caseID,
		Details:    fmt.Sprintf("Event %s captured. SHA-256: %s", eventID, hash[:16]+"…"),
		Timestamp:  time.Now(),
	}
	return m.store.InsertAuditLog(audit)
}
