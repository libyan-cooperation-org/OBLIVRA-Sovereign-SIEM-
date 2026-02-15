package app

import (
	"context"
	"fmt"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/agents"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/alerting"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/auth"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/compliance"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/config"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/deception"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/detection"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/enrichment"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/fim"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/forensics"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/graph"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/hunting"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/ingestion"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/monitoring"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/netflow"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/ransomware"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/rbac"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/reports"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/response"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// App is the root application struct bound to the Wails runtime.
// Every exported method here becomes callable from the SolidJS frontend.
type App struct {
	ctx        context.Context
	config     *config.Config
	storage    *storage.Engine
	ingestion  *ingestion.Manager
	detection  *detection.Engine
	alerting   *alerting.Manager
	forensics  *forensics.Manager
	enrichment *enrichment.Manager
	deception  *deception.Manager
	response   *response.Manager
	agents     *agents.Manager
	fim        *fim.Manager
	auth       *auth.Manager
	user       *sqlitestore.UserRecord
	reports    *reports.Manager
	compliance *compliance.Manager
	hunting    *hunting.Manager
	graph      *graph.Manager
	monitoring *monitoring.Manager
	netflow    *netflow.Collector
	ransomware *ransomware.Brain
	rbac       *rbac.RBACManager
}

// NewApp creates a new App with default configuration.
func NewApp() *App {
	return &App{
		config: config.DefaultConfig(),
	}
}

// Startup is called by Wails after the window is ready.
// It initialises all storage engines and starts the lifecycle manager.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// 1. Storage
	eng, err := storage.Open(ctx, a.config)
	if err != nil {
		panic(fmt.Sprintf("OBLIVRA: storage open failed: %v", err))
	}
	a.storage = eng
	a.storage.StartLifecycleManager(ctx, a.config.Storage.Retention)

	// 2. Response (SOAR)
	a.response = response.NewManager(a.storage.SQLite)
	a.response.RegisterAction(&response.BlockIPAction{})
	a.response.RegisterAction(&response.DisableUserAction{})
	a.response.RegisterAction(&response.WebhookAction{})
	a.response.RegisterAction(&response.NotifyAction{})
	a.response.RegisterAction(&response.IsolateHostAction{})
	a.response.RegisterAction(&response.KillProcessAction{})

	// 3. Alerting
	a.alerting = alerting.NewManager(a.storage.SQLite, a.response)

	// 4. Compliance
	a.compliance = compliance.NewManager()

	// 5. Detection — seed built-in rules on first run, then load into engine
	a.detection = detection.NewEngine(a.alerting.HandleAlert, a.compliance)
	if err := detection.SeedDefaultRules(a.storage.SQLite); err != nil {
		fmt.Printf("Warning: Rule seeding failed: %v\n", err)
	}
	if err := a.detection.LoadRules(a.storage.SQLite); err != nil {
		fmt.Printf("Warning: Detection Engine failed to load rules: %v\n", err)
	}

	// 4. Enrichment
	a.enrichment = enrichment.NewManager()
	a.enrichment.AddEnricher(enrichment.NewGeoIPEnricher())
	a.enrichment.AddEnricher(enrichment.NewThreatIntelEnricher())
	a.enrichment.AddEnricher(enrichment.NewAssetEnricher(a.storage.SQLite))

	// 5. Deception
	a.deception = deception.NewManager(func(ctx context.Context, alert *models.Alert) error {
		return a.alerting.HandleAlert(ctx, alert)
	})
	if err := a.deception.LoadTokens(a.storage.SQLite); err != nil {
		fmt.Printf("Warning: Deception Engine failed to load tokens: %v\n", err)
	}

	// 6. Forensics
	a.forensics = forensics.NewManager(a.storage.SQLite)
	if err := a.forensics.Start(ctx); err != nil {
		fmt.Printf("Warning: Forensics Manager failed to start: %v\n", err)
	}

	// 7. Ransomware Defense System (RDS)
	a.ransomware = ransomware.NewBrain()
	go a.ransomware.Start(ctx)

	// 6. System Monitoring — must be initialised before ingestion pipeline so
	// the monitoringProcessor wrapper captures a valid (non-nil) Manager.
	a.monitoring = monitoring.NewManager()
	go a.monitoring.Start(ctx)

	// 7. Ingestion pipeline
	a.auth = auth.NewManager(a.storage.SQLite)
	a.ingestion = ingestion.NewManager(&a.config.Ingestion, a.storage, a.auth)
	a.ingestion.AddProcessor(a.enrichment) // Enrichment FIRST
	a.ingestion.AddProcessor(a.deception)  // Deception check
	a.ingestion.AddProcessor(a.detection)
	a.ingestion.AddProcessor(a.forensics)
	a.ingestion.AddProcessor(a.ransomware)
	a.ingestion.AddProcessor(monitoringProcessor{a.monitoring})

	// 7. Agent Management
	a.agents = agents.NewManager(a.storage.SQLite)
	go a.agents.StartHealthChecker(ctx, 1*time.Minute)

	// 8. RBAC
	a.rbac = rbac.NewManager(a.storage.SQLite)

	// 8. FIM
	fimMgr, err := fim.NewManager(func(ctx context.Context, ev *models.Event) error {
		a.ingestion.Ingest(ev)
		return nil
	})
	if err != nil {
		fmt.Printf("Warning: FIM Manager failed: %v\n", err)
	} else {
		a.fim = fimMgr
		// Attach baseline persistence so hashes survive restarts
		a.fim.SetStore(a.storage.SQLite)
		a.fim.Start(ctx)
		// Load watchlist — AddPath now loads stored baselines automatically
		if list, err := a.storage.SQLite.ListFimWatchlist(); err == nil {
			for _, item := range list {
				_ = a.fim.AddPath(item.Path)
			}
		}
	}

	// 10. Reporting
	a.reports = reports.NewManager(a.storage.SQLite)

	// 12. Hunting & Investigation
	a.hunting = hunting.NewManager(a.storage.SQLite)
	a.graph = graph.NewManager()

	// 14. Network Analysis (Netflow) — runs its own UDP listener on port 2055.
	// NOTE: netflow is NOT added to the ingestion pipeline; it calls ingestion.Ingest directly.
	a.netflow = netflow.NewCollector(2055, func(c context.Context, ev *models.Event) error {
		a.ingestion.Ingest(ev)
		return nil
	})
	if err := a.netflow.Start(ctx); err != nil {
		fmt.Printf("Warning: Netflow Collector failed to start: %v\n", err)
	}

	if err := a.ingestion.Start(ctx); err != nil {
		panic(fmt.Sprintf("OBLIVRA: ingestion start failed: %v", err))
	}

	// Start Ingestion Servers
	if err := a.ingestion.StartSyslogServer(); err != nil {
		fmt.Printf("Warning: Syslog server failed: %v\n", err)
	}
	if err := a.ingestion.StartHECServer(); err != nil {
		fmt.Printf("Warning: HEC server failed: %v\n", err)
	}

	// Seed default admin
	a.seedAdmin()
}

// Shutdown is called by Wails on app exit.
func (a *App) Shutdown(ctx context.Context) {
	if a.forensics != nil {
		a.forensics.Stop()
	}
	if a.ingestion != nil {
		_ = a.ingestion.Stop()
	}
	if a.storage != nil {
		_ = a.storage.Close()
	}
}

// ─── IAM (Identity & Access Management) ──────────────────────────────────────

func (a *App) seedAdmin() {
	u, _ := a.storage.SQLite.GetUserByUsername("admin")
	if u == nil {
		fmt.Println("IAM: Seeding default admin user...")
		_, _ = a.auth.CreateUser("admin", "admin123", "admin")
	}
}

// Login authenticates a user and starts a session.
func (a *App) Login(username, password string) (bool, error) {
	u, err := a.auth.Authenticate(username, password)
	if err != nil {
		return false, err
	}
	a.user = u
	return true, nil
}

// Logout clears the current session.
func (a *App) Logout() {
	a.user = nil
}

// GetCurrentUser returns the logged-in user details.
func (a *App) GetCurrentUser() (*sqlitestore.UserRecord, error) {
	if a.user == nil {
		return nil, fmt.Errorf("not logged in")
	}
	return a.user, nil
}

// checkPermission is the new granular RBAC check.
func (a *App) checkPermission(perm string) error {
	if a.user == nil {
		return fmt.Errorf("authentication required")
	}

	has, err := a.rbac.HasPermission(a.ctx, a.user.ID, perm)
	if err != nil {
		return fmt.Errorf("rbac error: %w", err)
	}

	if !has {
		return fmt.Errorf("permission denied: missing permission '%s'", perm)
	}

	return nil
}

// checkAuth is the legacy role-based check (deprecated).
func (a *App) checkAuth(requiredRoles ...string) error {
	if a.user == nil {
		return fmt.Errorf("authentication required")
	}

	if len(requiredRoles) == 0 {
		return nil
	}

	// Admin bypasses all checks
	if a.user.Role == "admin" {
		return nil
	}

	for _, role := range requiredRoles {
		if a.user.Role == role {
			return nil
		}
	}

	return fmt.Errorf("permission denied: required roles: %v", requiredRoles)
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// GetConfig returns the current configuration to the frontend.
func (a *App) GetConfig() *config.Config {
	return a.config
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

// SearchEvents executes a search query and returns matching events.
// Called from the Log Explorer and Search pages.
func (a *App) SearchEvents(text, source, host, severity string, startNano, endNano int64, limit int) ([]*models.Event, error) {
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SearchEvents(a.ctx, &storage.SearchQuery{
		Text:      text,
		Source:    source,
		Host:      host,
		Severity:  severity,
		StartTime: startNano,
		EndTime:   endNano,
		Limit:     limit,
	})
}

// GetStorageStats returns on-disk size metrics for the System settings page.
func (a *App) GetStorageStats() storage.StorageStats {
	if a.storage == nil {
		return storage.StorageStats{}
	}
	return a.storage.Stats()
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

// ListAlerts returns alerts from SQLite, optionally filtered.
func (a *App) ListAlerts(status, severity string, limit int) ([]*models.Alert, error) {
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.ListAlerts(status, severity, limit)
}

// UpdateAlertStatus changes an alert's status and assignee.
func (a *App) UpdateAlertStatus(id, status, assignee string) error {
	if err := a.checkPermission("alerts:write"); err != nil {
		return err
	}
	if a.storage == nil {
		return fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.UpdateAlertStatus(id, status, assignee)
}

// GetAlertCounts returns open-alert counts per severity for the dashboard.
func (a *App) GetAlertCounts() (map[string]int, error) {
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.AlertCounts()
}

// ─── CASES ───────────────────────────────────────────────────────────────────

// ListCases returns cases from SQLite.
func (a *App) ListCases(status string, limit int) ([]*sqlitestore.CaseRecord, error) {
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.ListCases(status, limit)
}

// UpdateCaseStatus resolves or closes a case.
func (a *App) UpdateCaseStatus(id, status string) error {
	if err := a.checkPermission("cases:write"); err != nil {
		return err
	}
	if a.storage == nil {
		return fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.UpdateCaseStatus(id, status)
}

// ─── ASSETS ───────────────────────────────────────────────────────────────────

// ListAssets returns assets from SQLite.
func (a *App) ListAssets(limit int) ([]*sqlitestore.AssetRecord, error) {
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.ListAssets(limit)
}

// ─── AGENTS ───────────────────────────────────────────────────────────────────

// ListAgents returns all agents from SQLite.
func (a *App) ListAgents() ([]*sqlitestore.AgentRecord, error) {
	if err := a.checkPermission("admin:system"); err != nil {
		return nil, err
	}
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.ListAgents()
}

// ─── RULES ───────────────────────────────────────────────────────────────────

// ListRules returns detection rules from SQLite.
func (a *App) ListRules(enabledOnly bool) ([]*sqlitestore.RuleRecord, error) {
	if err := a.checkPermission("rules:read"); err != nil {
		return nil, err
	}
	if a.storage == nil {
		return nil, fmt.Errorf("storage not initialised")
	}
	return a.storage.SQLite.ListRules(enabledOnly)
}

// ─── FORENSICS & REPORTING ───────────────────────────────────────────────────

// AddEvidence records a forensic artifact for a case.
func (a *App) AddEvidence(caseID, eventID, reason string) error {
	if err := a.checkPermission("cases:write"); err != nil {
		return err
	}

	// Retrieve raw event from Badger
	ev, err := a.storage.Badger.GetEvent(eventID)
	if err != nil {
		return fmt.Errorf("failed to retrieve original event: %w", err)
	}
	if ev == nil {
		return fmt.Errorf("event %s not found in raw storage", eventID)
	}

	return a.forensics.CaptureEvidence(caseID, eventID, a.user.Username, reason, ev.Raw)
}

// GenerateReport returns a Markdown report for a case.
func (a *App) GenerateReport(caseID string) (string, error) {
	if err := a.checkPermission("cases:read"); err != nil {
		return "", err
	}
	return a.reports.GenerateCaseReport(caseID)
}

// ListAuditLogs returns recent system actions.
func (a *App) ListAuditLogs(limit int) ([]*sqlitestore.AuditRecord, error) {
	if err := a.checkPermission("admin:system"); err != nil {
		return nil, err
	}
	return a.storage.SQLite.ListAuditLogs(limit)
}

// ─── FIM ─────────────────────────────────────────────────────────────────────

// ListFIMWatchlist returns all paths currently monitored by FIM.
func (a *App) ListFIMWatchlist() ([]*sqlitestore.FimWatchItem, error) {
	if err := a.checkPermission("admin:system"); err != nil {
		return nil, err
	}
	return a.storage.SQLite.ListFimWatchlist()
}

// AddFIMWatch adds a path to the FIM watchlist and starts monitoring it.
func (a *App) AddFIMWatch(path, description string, recursive bool) error {
	if err := a.checkPermission("admin:system"); err != nil {
		return err
	}
	if a.fim == nil {
		return fmt.Errorf("FIM manager not available")
	}
	item := &sqlitestore.FimWatchItem{
		Path:        path,
		Description: description,
		Recursive:   recursive,
		CreatedAt:   time.Now(),
	}
	if err := a.storage.SQLite.InsertFimWatch(item); err != nil {
		return err
	}
	return a.fim.AddPath(path)
}

// RemoveFIMWatch removes a path from the watchlist.
func (a *App) RemoveFIMWatch(path string) error {
	if err := a.checkPermission("admin:system"); err != nil {
		return err
	}
	return a.storage.SQLite.DeleteFimWatch(path)
}

// ListFIMEvents returns recent FIM alert events from the alert store.
func (a *App) ListFIMEvents(limit int) ([]*models.Alert, error) {
	if err := a.checkPermission("logs:search"); err != nil {
		return nil, err
	}
	// FIM events emit as SIEM alerts with rule_id matching the FIM rule
	alerts, err := a.storage.SQLite.ListAlerts("", "", limit)
	if err != nil {
		return nil, err
	}
	var fimAlerts []*models.Alert
	for _, al := range alerts {
		if al.RuleID == "rule-fim-critical-change" {
			fimAlerts = append(fimAlerts, al)
		}
	}
	return fimAlerts, nil
}

// ─── DECEPTION ───────────────────────────────────────────────────────────────

// ListHoneytokens returns all active honeytokens.
func (a *App) ListHoneytokens() ([]*models.Honeytoken, error) {
	if err := a.checkPermission("admin:system"); err != nil {
		return nil, err
	}
	return a.storage.SQLite.ListHoneytokens()
}

// AddHoneytoken creates a new honeytoken and hot-loads it into the deception engine.
func (a *App) AddHoneytoken(tokenType, value, description string) error {
	if err := a.checkPermission("admin:system"); err != nil {
		return err
	}
	token := &models.Honeytoken{
		ID:          fmt.Sprintf("ht_%d", time.Now().UnixNano()),
		Type:        models.HoneytokenType(tokenType),
		Value:       value,
		Description: description,
		CreatedAt:   time.Now(),
	}
	if err := a.storage.SQLite.InsertHoneytoken(token); err != nil {
		return err
	}
	// Hot-reload deception engine
	if a.deception != nil {
		_ = a.deception.LoadTokens(a.storage.SQLite)
	}
	return nil
}

// DeleteHoneytoken removes a honeytoken and reloads the engine.
func (a *App) DeleteHoneytoken(id string) error {
	if err := a.checkPermission("admin:system"); err != nil {
		return err
	}
	if err := a.storage.SQLite.DeleteHoneytoken(id); err != nil {
		return err
	}
	if a.deception != nil {
		_ = a.deception.LoadTokens(a.storage.SQLite)
	}
	return nil
}

// ListDeceptionAlerts returns alerts triggered by honeytokens.
func (a *App) ListDeceptionAlerts(limit int) ([]*models.Alert, error) {
	if err := a.checkPermission("alerts:read"); err != nil {
		return nil, err
	}
	alerts, err := a.storage.SQLite.ListAlerts("", "CRITICAL", limit)
	if err != nil {
		return nil, err
	}
	var dec []*models.Alert
	for _, al := range alerts {
		if len(al.RuleID) > 10 && al.RuleID[:10] == "DECEPTION_" {
			dec = append(dec, al)
		}
	}
	return dec, nil
}

// ─── INTEGRITY BLOCKS (MERKLE) ────────────────────────────────────────────────

// ListIntegrityBlocks returns the most recent forensic integrity blocks.
func (a *App) ListIntegrityBlocks(limit int) ([]*sqlitestore.IntegrityBlockRecord, error) {
	if err := a.checkPermission("logs:search"); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 50
	}
	return a.storage.SQLite.ListIntegrityBlocks(limit)
}

// ─── NETFLOW ─────────────────────────────────────────────────────────────────

// GetNetflowStats returns high-level netflow counters for the dashboard.
func (a *App) GetNetflowStats() map[string]interface{} {
	if a.netflow == nil {
		return map[string]interface{}{"total_flows": 0, "bytes_in": 0, "bytes_out": 0}
	}
	return a.netflow.Stats()
}

// ListNetflowTopTalkers returns the top N flows by byte volume.
func (a *App) ListNetflowTopTalkers(limit int) ([]map[string]interface{}, error) {
	if a.netflow == nil {
		return nil, nil
	}
	if limit <= 0 {
		limit = 20
	}
	return a.netflow.TopTalkers(limit), nil
}

// GetComplianceCoverage returns MITRE ATT&CK tactic coverage summary.
func (a *App) GetComplianceCoverage() (map[string]int, error) {
	if a.compliance == nil {
		return nil, fmt.Errorf("compliance manager not initialised")
	}
	return a.compliance.GetCoverage(), nil
}

// ─── INVESTIGATION ────────────────────────────────────────────────────────────

// ListSavedSearches returns all persisted hunting queries.
func (a *App) ListSavedSearches() ([]*models.SavedSearch, error) {
	if err := a.checkPermission("logs:search"); err != nil {
		return nil, err
	}
	return a.hunting.ListSearches()
}

// SaveSearch persists a new hunting query.
func (a *App) SaveSearch(name, query string) (*models.SavedSearch, error) {
	if err := a.checkPermission("logs:search"); err != nil {
		return nil, err
	}
	return a.hunting.SaveSearch(name, query, a.user.Username)
}

// GetAlertGraph generates a relationship graph for entities in an alert.
func (a *App) GetAlertGraph(alertID string) (*graph.Graph, error) {
	if err := a.checkAuth("analyst", "admin", "viewer"); err != nil {
		return nil, err
	}

	// 1. Get Alert
	alert, err := a.storage.SQLite.GetAlert(alertID)
	if err != nil {
		return nil, err
	}

	// 2. Get related events (simplified: events from same rule/host around same time)
	// In a real system, we'd use the event ID or search the indexer.
	// For now, let's just use the single trigger event if possible.
	triggerEvent, err := a.storage.Badger.GetEvent(alert.EventID)
	if err != nil || triggerEvent == nil {
		return nil, fmt.Errorf("failed to retrieve trigger event: %v", err)
	}

	return a.graph.GenerateFromEvents([]*models.Event{triggerEvent}), nil
}

// monitoringProcessor is a simple wrapper to track EPS via the ingestion pipeline.
type monitoringProcessor struct {
	m *monitoring.Manager
}

func (p monitoringProcessor) ProcessEvent(ctx context.Context, ev *models.Event) {
	p.m.TrackEvent()
}
