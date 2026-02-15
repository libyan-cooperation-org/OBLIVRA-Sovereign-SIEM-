package sqlitestore_test

import (
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func tmpDB(t *testing.T) (*sqlitestore.DB, func()) {
	t.Helper()
	f, err := os.CreateTemp("", "sqlite-test-*.db")
	if err != nil {
		t.Fatal(err)
	}
	f.Close()
	db, err := sqlitestore.Open(f.Name())
	if err != nil {
		os.Remove(f.Name())
		t.Fatal(err)
	}
	return db, func() {
		db.Close()
		os.Remove(f.Name())
	}
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

func TestInsertAndListAlerts(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	a := &models.Alert{
		ID:        uuid.NewString(),
		EventID:   uuid.NewString(),
		RuleID:    "rule-001",
		Timestamp: time.Now(),
		Severity:  models.SeverityHigh,
		Title:     "Brute Force Detected",
		Summary:   "Multiple failed logins",
		Status:    "open",
		Assignee:  "",
	}
	if err := db.InsertAlert(a); err != nil {
		t.Fatalf("InsertAlert: %v", err)
	}

	alerts, err := db.ListAlerts("open", "", 100)
	if err != nil {
		t.Fatalf("ListAlerts: %v", err)
	}
	if len(alerts) != 1 {
		t.Errorf("got %d alerts, want 1", len(alerts))
	}
	if alerts[0].Title != a.Title {
		t.Errorf("title mismatch: %s != %s", alerts[0].Title, a.Title)
	}
}

func TestUpdateAlertStatus(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	a := &models.Alert{
		ID: uuid.NewString(), EventID: uuid.NewString(), RuleID: "r1",
		Timestamp: time.Now(), Severity: models.SeverityCritical,
		Title: "Test", Status: "open", Assignee: "",
	}
	if err := db.InsertAlert(a); err != nil {
		t.Fatal(err)
	}
	if err := db.UpdateAlertStatus(a.ID, "resolved", "analyst@oblivra"); err != nil {
		t.Fatalf("UpdateAlertStatus: %v", err)
	}
	got, err := db.GetAlert(a.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != "resolved" {
		t.Errorf("status = %q, want resolved", got.Status)
	}
	if got.Assignee != "analyst@oblivra" {
		t.Errorf("assignee = %q", got.Assignee)
	}
}

func TestAlertCounts(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	severities := []models.Severity{
		models.SeverityCritical, models.SeverityCritical,
		models.SeverityHigh,
		models.SeverityMedium, models.SeverityMedium, models.SeverityMedium,
	}
	for _, sev := range severities {
		_ = db.InsertAlert(&models.Alert{
			ID: uuid.NewString(), EventID: uuid.NewString(), RuleID: "r",
			Timestamp: time.Now(), Severity: sev, Title: "t", Status: "open",
		})
	}

	counts, err := db.AlertCounts()
	if err != nil {
		t.Fatalf("AlertCounts: %v", err)
	}
	if counts["CRITICAL"] != 2 {
		t.Errorf("CRITICAL count = %d, want 2", counts["CRITICAL"])
	}
	if counts["HIGH"] != 1 {
		t.Errorf("HIGH count = %d, want 1", counts["HIGH"])
	}
	if counts["MEDIUM"] != 3 {
		t.Errorf("MEDIUM count = %d, want 3", counts["MEDIUM"])
	}
}

// ─── Cases ───────────────────────────────────────────────────────────────────

func TestInsertAndListCases(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	c := &sqlitestore.CaseRecord{
		ID: uuid.NewString(), Title: "Ransomware Incident",
		Description: "Active encryption detected",
		Severity: "critical", Status: "open", Assignee: "",
		CreatedAt: time.Now(), UpdatedAt: time.Now(), AlertCount: 3,
	}
	if err := db.InsertCase(c); err != nil {
		t.Fatalf("InsertCase: %v", err)
	}
	cases, err := db.ListCases("", 100)
	if err != nil {
		t.Fatalf("ListCases: %v", err)
	}
	if len(cases) != 1 {
		t.Errorf("got %d cases, want 1", len(cases))
	}
	if cases[0].Title != c.Title {
		t.Errorf("title mismatch")
	}
}

func TestUpdateCaseStatus(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	c := &sqlitestore.CaseRecord{
		ID: uuid.NewString(), Title: "Test Case",
		Severity: "medium", Status: "open",
		CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	_ = db.InsertCase(c)
	if err := db.UpdateCaseStatus(c.ID, "resolved"); err != nil {
		t.Fatalf("UpdateCaseStatus: %v", err)
	}
	cases, err := db.ListCases("resolved", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(cases) != 1 {
		t.Errorf("expected 1 resolved case, got %d", len(cases))
	}
}

// ─── Agents ──────────────────────────────────────────────────────────────────

func TestUpsertAndListAgents(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	a := &sqlitestore.AgentRecord{
		ID: "agent-001", Hostname: "srv-dc-01", IP: "10.0.0.10",
		OS: "Windows Server 2022", Version: "2.4.1",
		Status: "online", EPS: 1200, Protocol: "grpc",
		LastSeen: time.Now(),
	}
	if err := db.UpsertAgent(a); err != nil {
		t.Fatalf("UpsertAgent: %v", err)
	}
	agents, err := db.ListAgents()
	if err != nil {
		t.Fatalf("ListAgents: %v", err)
	}
	if len(agents) != 1 {
		t.Errorf("got %d agents, want 1", len(agents))
	}
	if agents[0].Hostname != "srv-dc-01" {
		t.Errorf("hostname mismatch")
	}
}

func TestUpdateAgentStatus(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	a := &sqlitestore.AgentRecord{
		ID: "agent-002", Hostname: "ws-01", IP: "10.0.0.20",
		Status: "online", EPS: 400, LastSeen: time.Now(),
	}
	_ = db.UpsertAgent(a)
	if err := db.UpdateAgentStatus("agent-002", "offline", 0); err != nil {
		t.Fatalf("UpdateAgentStatus: %v", err)
	}
	agents, err := db.ListAgents()
	if err != nil {
		t.Fatal(err)
	}
	if agents[0].Status != "offline" {
		t.Errorf("status = %q, want offline", agents[0].Status)
	}
}

// ─── Rules ───────────────────────────────────────────────────────────────────

func TestInsertAndListRules(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	r := &sqlitestore.RuleRecord{
		ID: uuid.NewString(), Name: "SSH Brute Force",
		Description: "Detects >5 failed SSH logins in 60s",
		Severity: "high", Enabled: true,
		MITRE: "T1110.001",
		Condition: `{"field":"message","contains":"Failed password","threshold":5,"window":60}`,
		CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	if err := db.InsertRule(r); err != nil {
		t.Fatalf("InsertRule: %v", err)
	}
	rules, err := db.ListRules(true)
	if err != nil {
		t.Fatalf("ListRules: %v", err)
	}
	if len(rules) != 1 {
		t.Errorf("got %d rules, want 1", len(rules))
	}
	if rules[0].MITRE != "T1110.001" {
		t.Errorf("MITRE = %q", rules[0].MITRE)
	}
}

// ─── Assets ──────────────────────────────────────────────────────────────────

func TestUpsertAndListAssets(t *testing.T) {
	db, cleanup := tmpDB(t)
	defer cleanup()

	asset := &sqlitestore.AssetRecord{
		ID: uuid.NewString(), Hostname: "srv-fin-01", IP: "10.0.1.50",
		OS: "Ubuntu 22.04", Type: "server", Criticality: "crown_jewel",
		Owner: "finance-team", LastSeen: time.Now(), Tags: `["finance","production"]`,
	}
	if err := db.UpsertAsset(asset); err != nil {
		t.Fatalf("UpsertAsset: %v", err)
	}
	assets, err := db.ListAssets(100)
	if err != nil {
		t.Fatalf("ListAssets: %v", err)
	}
	if len(assets) != 1 {
		t.Errorf("got %d assets, want 1", len(assets))
	}
	if assets[0].Criticality != "crown_jewel" {
		t.Errorf("criticality = %q", assets[0].Criticality)
	}
}
