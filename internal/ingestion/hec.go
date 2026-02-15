package ingestion

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// StartHECServer starts the Splunk-compatible HTTP Event Collector server.
func (m *Manager) StartHECServer() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/services/collector/event", m.handleHECEvent)
	mux.HandleFunc("/services/collector/raw", m.handleHECRaw)

	addr := fmt.Sprintf(":%d", m.cfg.HECPort)
	server := &http.Server{
		Addr:    addr,
		Handler: m.authMiddleware(mux),
	}

	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		log.Printf("HEC server listening on http://%s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("HEC server error: %v", err)
		}
	}()

	// Handle graceful shutdown
	go func() {
		<-m.bgCtx.Done()
		server.Close()
	}()

	return nil
}

func (m *Manager) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		expected := "Splunk " + m.cfg.HECToken

		if auth != expected && r.URL.Query().Get("token") != m.cfg.HECToken {
			// Try OBLIVRA IAM token
			bearerToken := ""
			if strings.HasPrefix(auth, "Bearer ") {
				bearerToken = strings.TrimPrefix(auth, "Bearer ")
			}

			if bearerToken == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			user, err := m.auth.ValidateToken(bearerToken)
			if err != nil || user == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

type hecEvent struct {
	Event      json.RawMessage `json:"event"`
	Source     string          `json:"source"`
	SourceType string          `json:"sourcetype"`
	Host       string          `json:"host"`
	Time       float64         `json:"time"`
	Index      string          `json:"index"`
}

func (m *Manager) handleHECEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload hecEvent
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Map to OBLIVRA Event
	ev := &models.Event{
		ID:        uuid.NewString(),
		Timestamp: time.Now(),
		Source:    payload.Source,
		Host:      payload.Host,
		Category:  payload.SourceType,
		Severity:  models.SeverityInfo,
		Message:   string(payload.Event),
		Raw:       string(payload.Event),
	}

	if payload.Time > 0 {
		ev.Timestamp = time.Unix(0, int64(payload.Time*1e9))
	}

	m.Ingest(ev)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"text": "Success", "code": "0"})
}

func (m *Manager) handleHECRaw(w http.ResponseWriter, r *http.Request) {
	// Basic raw implementation
	host := r.URL.Query().Get("host")
	source := r.URL.Query().Get("source")

	ev := &models.Event{
		ID:        uuid.NewString(),
		Timestamp: time.Now(),
		Source:    source,
		Host:      host,
		Severity:  models.SeverityInfo,
	}

	// Read body as message
	buf := make([]byte, 1024*64)
	n, _ := r.Body.Read(buf)
	ev.Message = string(buf[:n])
	ev.Raw = ev.Message

	m.Ingest(ev)
	w.WriteHeader(http.StatusOK)
}
