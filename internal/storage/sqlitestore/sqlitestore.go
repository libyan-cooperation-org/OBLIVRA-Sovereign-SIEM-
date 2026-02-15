// Package sqlitestore provides relational storage for OBLIVRA metadata:
// alerts, cases, assets, detection rules, and agents.
// It uses database/sql with the go-sqlite3 CGo driver and runs all DDL
// migrations on Open so the schema is always up to date.
package sqlitestore

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
	_ "modernc.org/sqlite" // register driver
)

// DB wraps *sql.DB with OBLIVRA-specific helpers.
type DB struct {
	db *sql.DB
}

// Open opens (or creates) the SQLite file at path and runs all migrations.
func Open(path string) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, fmt.Errorf("sqlitestore: mkdir: %w", err)
	}

	// WAL mode: concurrent reads + one writer, no full-file locks.
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)&_pragma=busy_timeout(5000)", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("sqlitestore: open: %w", err)
	}
	db.SetMaxOpenConns(1) // sqlite3 is not concurrent-write safe
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)

	s := &DB{db: db}
	if err := s.migrate(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("sqlitestore: migrate: %w", err)
	}
	return s, nil
}

// ─── MIGRATIONS ──────────────────────────────────────────────────────────────

func (s *DB) migrate() error {
	_, err := s.db.Exec(schema)
	return err
}

const schema = `
CREATE TABLE IF NOT EXISTS alerts (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL,
    rule_id     TEXT NOT NULL,
    timestamp   INTEGER NOT NULL,   -- unix seconds
    severity    TEXT NOT NULL,
    title       TEXT NOT NULL,
    summary     TEXT,
    status      TEXT NOT NULL DEFAULT 'open',
    assignee    TEXT NOT NULL DEFAULT '',
    host        TEXT NOT NULL DEFAULT '',
    metadata    TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_status    ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity  ON alerts(severity);

CREATE TABLE IF NOT EXISTS cases (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    severity    TEXT NOT NULL DEFAULT 'medium',
    status      TEXT NOT NULL DEFAULT 'open',
    assignee    TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    alert_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

CREATE TABLE IF NOT EXISTS case_alerts (
    case_id     TEXT NOT NULL REFERENCES cases(id)  ON DELETE CASCADE,
    alert_id    TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, alert_id)
);

CREATE TABLE IF NOT EXISTS assets (
    id          TEXT PRIMARY KEY,
    hostname    TEXT NOT NULL,
    ip          TEXT NOT NULL,
    os          TEXT,
    type        TEXT NOT NULL DEFAULT 'server',
    criticality TEXT NOT NULL DEFAULT 'medium',
    owner       TEXT,
    last_seen   INTEGER NOT NULL,
    tags        TEXT    -- JSON array
);
CREATE INDEX IF NOT EXISTS idx_assets_ip       ON assets(ip);
CREATE INDEX IF NOT EXISTS idx_assets_hostname ON assets(hostname);

CREATE TABLE IF NOT EXISTS agents (
    id          TEXT PRIMARY KEY,
    hostname    TEXT NOT NULL,
    ip          TEXT NOT NULL,
    os          TEXT,
    version     TEXT,
    status      TEXT NOT NULL DEFAULT 'offline',
    eps         INTEGER NOT NULL DEFAULT 0,
    protocol    TEXT NOT NULL DEFAULT 'syslog',
    last_seen   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    severity    TEXT NOT NULL DEFAULT 'medium',
    enabled     INTEGER NOT NULL DEFAULT 1,
    mitre       TEXT,
    condition   TEXT NOT NULL,
    threshold   INTEGER DEFAULT 1,
    window      INTEGER DEFAULT 60,
    response_action TEXT,
    response_params TEXT,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);

CREATE TABLE IF NOT EXISTS integrity_blocks (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    root_hash      BLOB NOT NULL,
    prev_hash      BLOB NOT NULL,
    event_count    INTEGER NOT NULL,
    timestamp      INTEGER NOT NULL,
    signature      BLOB
);
CREATE INDEX IF NOT EXISTS idx_integrity_timestamp ON integrity_blocks(timestamp);

CREATE TABLE IF NOT EXISTS honeytokens (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    value       TEXT NOT NULL,
    description TEXT,
    created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_honeytokens_value ON honeytokens(value);

CREATE TABLE IF NOT EXISTS response_history (
    id          TEXT PRIMARY KEY,
    alert_id    TEXT NOT NULL,
    action_type TEXT NOT NULL,
    status      TEXT NOT NULL,
    output      TEXT,
    timestamp   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_response_alert ON response_history(alert_id);

CREATE TABLE IF NOT EXISTS case_comments (
    id          TEXT PRIMARY KEY,
    case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author      TEXT NOT NULL,
    text        TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_case_comments_case ON case_comments(case_id);

CREATE TABLE IF NOT EXISTS fim_watchlist (
    path        TEXT PRIMARY KEY,
    description TEXT,
    recursive   INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fim_baselines (
    path        TEXT PRIMARY KEY,
    hash        TEXT NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'viewer',
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id          TEXT PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS roles (
    id          TEXT PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS api_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT UNIQUE NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON api_tokens(user_id);

CREATE TABLE IF NOT EXISTS evidence (
    id          TEXT PRIMARY KEY,
    case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event_id    TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    reason      TEXT,
    raw_hash    TEXT NOT NULL,
    signature   TEXT,
    created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);

CREATE TABLE IF NOT EXISTS audit_log (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    details     TEXT,
    timestamp   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(timestamp);

CREATE TABLE IF NOT EXISTS saved_searches (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    query       TEXT NOT NULL,
    created_by  TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);

-- Default Permissions
INSERT OR IGNORE INTO permissions (id, name, description) VALUES 
('p1', 'logs:search', 'Search and view logs'),
('p2', 'alerts:read', 'View alerts'),
('p3', 'alerts:write', 'Modify alert status/assignee'),
('p4', 'cases:read', 'View cases'),
('p5', 'cases:write', 'Create and modify cases'),
('p6', 'rules:read', 'View detection rules'),
('p7', 'rules:write', 'Create and modify detection rules'),
('p8', 'admin:system', 'System administration access');

-- Default Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES 
('r1', 'admin', 'Full system access'),
('r2', 'analyst', 'Investigation and alert management'),
('r3', 'auditor', 'Read-only audit access'),
('r4', 'viewer', 'Basic dashboard access');

-- Map Permissions to Roles
-- Admin has all
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) 
SELECT 'r1', id FROM permissions;

-- Analyst
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES 
('r2', 'p1'), ('r2', 'p2'), ('r2', 'p3'), ('r2', 'p4'), ('r2', 'p5'), ('r2', 'p6');

-- Auditor
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES 
('r3', 'p1'), ('r3', 'p2'), ('r3', 'p4'), ('r3', 'p6');

-- Viewer
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES 
('r4', 'p1'), ('r4', 'p2');
`

// ─── ALERTS ──────────────────────────────────────────────────────────────────

// InsertAlert persists a new alert.
func (s *DB) InsertAlert(a *models.Alert) error {
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO alerts
		(id, event_id, rule_id, timestamp, severity, title, summary, status, assignee, host, metadata)
		VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
		a.ID, a.EventID, a.RuleID, a.Timestamp.Unix(),
		string(a.Severity), a.Title, a.Summary, a.Status, a.Assignee, a.Host,
		serializeMetadata(a.Metadata),
	)
	return err
}

// GetAlert retrieves a single alert by ID.
func (s *DB) GetAlert(id string) (*models.Alert, error) {
	row := s.db.QueryRow(`SELECT id,event_id,rule_id,timestamp,severity,title,summary,status,assignee,host,metadata FROM alerts WHERE id=?`, id)
	return scanAlert(row)
}

// ListAlerts returns alerts matching optional filters, ordered newest first.
func (s *DB) ListAlerts(status, severity string, limit int) ([]*models.Alert, error) {
	if limit <= 0 {
		limit = 200
	}
	q := `SELECT id,event_id,rule_id,timestamp,severity,title,summary,status,assignee,host,metadata FROM alerts WHERE 1=1`
	var args []interface{}
	if status != "" {
		q += ` AND status=?`
		args = append(args, status)
	}
	if severity != "" {
		q += ` AND severity=?`
		args = append(args, severity)
	}
	q += ` ORDER BY timestamp DESC LIMIT ?`
	args = append(args, limit)

	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlerts(rows)
}

// UpdateAlertStatus changes the status (and optionally assignee) of an alert.
func (s *DB) UpdateAlertStatus(id, status, assignee string) error {
	_, err := s.db.Exec(`UPDATE alerts SET status=?, assignee=? WHERE id=?`, status, assignee, id)
	return err
}

// AlertCounts returns a map of severity→count for open alerts.
func (s *DB) AlertCounts() (map[string]int, error) {
	rows, err := s.db.Query(`SELECT severity, COUNT(*) FROM alerts WHERE status='open' GROUP BY severity`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	counts := make(map[string]int)
	for rows.Next() {
		var sev string
		var n int
		if err := rows.Scan(&sev, &n); err != nil {
			return nil, err
		}
		counts[sev] = n
	}
	return counts, rows.Err()
}

// ─── CASES ───────────────────────────────────────────────────────────────────

// CaseRecord is the SQLite representation of a case (avoids importing frontend types).
type CaseRecord struct {
	ID          string
	Title       string
	Description string
	Severity    string
	Status      string
	Assignee    string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	AlertCount  int
}

// InsertCase persists a new case.
func (s *DB) InsertCase(c *CaseRecord) error {
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO cases
		(id, title, description, severity, status, assignee, created_at, updated_at, alert_count)
		VALUES (?,?,?,?,?,?,?,?,?)`,
		c.ID, c.Title, c.Description, c.Severity, c.Status, c.Assignee,
		c.CreatedAt.Unix(), c.UpdatedAt.Unix(), c.AlertCount,
	)
	return err
}

// GetCase retrieves a single case by ID.
func (s *DB) GetCase(id string) (*CaseRecord, error) {
	row := s.db.QueryRow(`SELECT id,title,description,severity,status,assignee,created_at,updated_at,alert_count FROM cases WHERE id=?`, id)
	var c CaseRecord
	var createdUnix, updatedUnix int64
	err := row.Scan(&c.ID, &c.Title, &c.Description, &c.Severity, &c.Status,
		&c.Assignee, &createdUnix, &updatedUnix, &c.AlertCount)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	c.CreatedAt = time.Unix(createdUnix, 0)
	c.UpdatedAt = time.Unix(updatedUnix, 0)
	return &c, nil
}

// ListCases returns all cases ordered by updated_at desc.
func (s *DB) ListCases(status string, limit int) ([]*CaseRecord, error) {
	if limit <= 0 {
		limit = 200
	}
	q := `SELECT id,title,description,severity,status,assignee,created_at,updated_at,alert_count FROM cases WHERE 1=1`
	var args []interface{}
	if status != "" {
		q += ` AND status=?`
		args = append(args, status)
	}
	q += ` ORDER BY updated_at DESC LIMIT ?`
	args = append(args, limit)
	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cases []*CaseRecord
	for rows.Next() {
		var c CaseRecord
		var createdUnix, updatedUnix int64
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Severity, &c.Status,
			&c.Assignee, &createdUnix, &updatedUnix, &c.AlertCount); err != nil {
			return nil, err
		}
		c.CreatedAt = time.Unix(createdUnix, 0)
		c.UpdatedAt = time.Unix(updatedUnix, 0)
		cases = append(cases, &c)
	}
	return cases, rows.Err()
}

// UpdateCaseStatus updates status and updated_at timestamp.
func (s *DB) UpdateCaseStatus(id, status string) error {
	_, err := s.db.Exec(`UPDATE cases SET status=?, updated_at=? WHERE id=?`, status, time.Now().Unix(), id)
	return err
}

// LinkAlertToCase adds a many-to-many relationship.
func (s *DB) LinkAlertToCase(caseID, alertID string) error {
	_, err := s.db.Exec(`INSERT OR IGNORE INTO case_alerts (case_id, alert_id) VALUES (?, ?)`, caseID, alertID)
	if err != nil {
		return err
	}
	// Update alert count
	_, err = s.db.Exec(`UPDATE cases SET alert_count = (SELECT COUNT(*) FROM case_alerts WHERE case_id = ?), updated_at = ? WHERE id = ?`,
		caseID, time.Now().Unix(), caseID)
	return err
}

// UnlinkAlertFromCase removes a many-to-many relationship.
func (s *DB) UnlinkAlertFromCase(caseID, alertID string) error {
	_, err := s.db.Exec(`DELETE FROM case_alerts WHERE case_id = ? AND alert_id = ?`, caseID, alertID)
	if err != nil {
		return err
	}
	// Update alert count
	_, err = s.db.Exec(`UPDATE cases SET alert_count = (SELECT COUNT(*) FROM case_alerts WHERE case_id = ?), updated_at = ? WHERE id = ?`,
		caseID, time.Now().Unix(), caseID)
	return err
}

// GetAlertsForCase returns all alerts linked to a case.
func (s *DB) GetAlertsForCase(caseID string) ([]*models.Alert, error) {
	rows, err := s.db.Query(`
		SELECT a.id, a.event_id, a.rule_id, a.timestamp, a.severity, a.title, a.summary, a.status, a.assignee, a.host, a.metadata
		FROM alerts a
		JOIN case_alerts ca ON a.id = ca.alert_id
		WHERE ca.case_id = ?`, caseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlerts(rows)
}

// AddCaseComment persists a new analyst comment for a case.
type CaseComment struct {
	ID        string
	CaseID    string
	Author    string
	Text      string
	CreatedAt time.Time
}

func (s *DB) InsertCaseComment(c *CaseComment) error {
	_, err := s.db.Exec(`
		INSERT INTO case_comments (id, case_id, author, text, created_at)
		VALUES (?, ?, ?, ?, ?)`,
		c.ID, c.CaseID, c.Author, c.Text, c.CreatedAt.Unix(),
	)
	return err
}

func (s *DB) ListCaseComments(caseID string) ([]*CaseComment, error) {
	rows, err := s.db.Query(`SELECT id, case_id, author, text, created_at FROM case_comments WHERE case_id = ? ORDER BY created_at ASC`, caseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*CaseComment
	for rows.Next() {
		var c CaseComment
		var ts int64
		if err := rows.Scan(&c.ID, &c.CaseID, &c.Author, &c.Text, &ts); err != nil {
			return nil, err
		}
		c.CreatedAt = time.Unix(ts, 0)
		comments = append(comments, &c)
	}
	return comments, rows.Err()
}

// ─── ASSETS ──────────────────────────────────────────────────────────────────

// AssetRecord is the SQLite representation of an asset.
type AssetRecord struct {
	ID          string
	Hostname    string
	IP          string
	OS          string
	Type        string
	Criticality string
	Owner       string
	LastSeen    time.Time
	Tags        string // JSON
}

// UpsertAsset inserts or replaces an asset record.
func (s *DB) UpsertAsset(a *AssetRecord) error {
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO assets
		(id, hostname, ip, os, type, criticality, owner, last_seen, tags)
		VALUES (?,?,?,?,?,?,?,?,?)`,
		a.ID, a.Hostname, a.IP, a.OS, a.Type, a.Criticality,
		a.Owner, a.LastSeen.Unix(), a.Tags,
	)
	return err
}

// ListAssets returns all assets ordered by hostname.
func (s *DB) ListAssets(limit int) ([]*AssetRecord, error) {
	if limit <= 0 {
		limit = 1000
	}
	rows, err := s.db.Query(`
		SELECT id,hostname,ip,os,type,criticality,owner,last_seen,tags
		FROM assets ORDER BY hostname LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var assets []*AssetRecord
	for rows.Next() {
		var a AssetRecord
		var lastSeenUnix int64
		if err := rows.Scan(&a.ID, &a.Hostname, &a.IP, &a.OS, &a.Type,
			&a.Criticality, &a.Owner, &lastSeenUnix, &a.Tags); err != nil {
			return nil, err
		}
		a.LastSeen = time.Unix(lastSeenUnix, 0)
		assets = append(assets, &a)
	}
	return assets, rows.Err()
}

// ─── IAM (Identity & Access Management) ──────────────────────────────────────

type UserRecord struct {
	ID           string
	Username     string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (s *DB) InsertUser(u *UserRecord) error {
	_, err := s.db.Exec(`
		INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		u.ID, u.Username, u.PasswordHash, u.Role, u.CreatedAt.Unix(), u.UpdatedAt.Unix(),
	)
	return err
}

func (s *DB) GetUserByUsername(username string) (*UserRecord, error) {
	row := s.db.QueryRow(`SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE username = ?`, username)
	var u UserRecord
	var created, updated int64
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &created, &updated); err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	u.CreatedAt = time.Unix(created, 0)
	u.UpdatedAt = time.Unix(updated, 0)
	return &u, nil
}

type TokenRecord struct {
	ID        string
	UserID    string
	Token     string
	ExpiresAt time.Time
	CreatedAt time.Time
}

func (s *DB) InsertToken(t *TokenRecord) error {
	_, err := s.db.Exec(`
		INSERT INTO api_tokens (id, user_id, token, expires_at, created_at)
		VALUES (?, ?, ?, ?, ?)`,
		t.ID, t.UserID, t.Token, t.ExpiresAt.Unix(), t.CreatedAt.Unix(),
	)
	return err
}

func (s *DB) GetToken(token string) (*TokenRecord, error) {
	row := s.db.QueryRow(`SELECT id, user_id, token, expires_at, created_at FROM api_tokens WHERE token = ?`, token)
	var t TokenRecord
	var expires, created int64
	if err := row.Scan(&t.ID, &t.UserID, &t.Token, &expires, &created); err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	t.ExpiresAt = time.Unix(expires, 0)
	t.CreatedAt = time.Unix(created, 0)
	return &t, nil
}

func (s *DB) GetUserByID(id string) (*UserRecord, error) {
	row := s.db.QueryRow(`SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE id = ?`, id)
	var u UserRecord
	var created, updated int64
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &created, &updated); err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	u.CreatedAt = time.Unix(created, 0)
	u.UpdatedAt = time.Unix(updated, 0)
	return &u, nil
}

// GetUserPermissions returns all permission names for a user based on their roles.
func (s *DB) GetUserPermissions(userID string) ([]string, error) {
	// Include legacy role mapping for compatibility
	rows, err := s.db.Query(`
		SELECT DISTINCT p.name 
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		JOIN roles r ON rp.role_id = r.id
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = ?
		UNION
		SELECT DISTINCT p.name
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		JOIN roles r ON rp.role_id = r.id
		JOIN users u ON u.role = r.name
		WHERE u.id = ?`, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var perms []string
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		perms = append(perms, p)
	}
	return perms, rows.Err()
}

// GetAssetByHost retrieves a single asset by its hostname.
func (s *DB) GetAssetByHost(hostname string) (*AssetRecord, error) {
	row := s.db.QueryRow(`
		SELECT id,hostname,ip,os,type,criticality,owner,last_seen,tags
		FROM assets WHERE hostname = ?`, hostname)
	var a AssetRecord
	var lastSeenUnix int64
	err := row.Scan(&a.ID, &a.Hostname, &a.IP, &a.OS, &a.Type,
		&a.Criticality, &a.Owner, &lastSeenUnix, &a.Tags)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	a.LastSeen = time.Unix(lastSeenUnix, 0)
	return &a, nil
}

// ─── AGENTS ──────────────────────────────────────────────────────────────────

// AgentRecord is the SQLite representation of an agent node.
type AgentRecord struct {
	ID       string
	Hostname string
	IP       string
	OS       string
	Version  string
	Status   string
	EPS      int
	Protocol string
	LastSeen time.Time
}

// UpsertAgent inserts or replaces an agent record.
func (s *DB) UpsertAgent(a *AgentRecord) error {
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO agents
		(id, hostname, ip, os, version, status, eps, protocol, last_seen)
		VALUES (?,?,?,?,?,?,?,?,?)`,
		a.ID, a.Hostname, a.IP, a.OS, a.Version,
		a.Status, a.EPS, a.Protocol, a.LastSeen.Unix(),
	)
	return err
}

// ListAgents returns all agents ordered by hostname.
func (s *DB) ListAgents() ([]*AgentRecord, error) {
	rows, err := s.db.Query(`
		SELECT id,hostname,ip,os,version,status,eps,protocol,last_seen
		FROM agents ORDER BY hostname`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var agents []*AgentRecord
	for rows.Next() {
		var a AgentRecord
		var lastSeenUnix int64
		if err := rows.Scan(&a.ID, &a.Hostname, &a.IP, &a.OS, &a.Version,
			&a.Status, &a.EPS, &a.Protocol, &lastSeenUnix); err != nil {
			return nil, err
		}
		a.LastSeen = time.Unix(lastSeenUnix, 0)
		agents = append(agents, &a)
	}
	return agents, rows.Err()
}

// UpdateAgentStatus updates the status, eps, and last_seen of an agent.
func (s *DB) UpdateAgentStatus(id, status string, eps int) error {
	_, err := s.db.Exec(`UPDATE agents SET status=?, eps=?, last_seen=? WHERE id=?`,
		status, eps, time.Now().Unix(), id)
	return err
}

// ─── RULES ───────────────────────────────────────────────────────────────────

// RuleRecord is the SQLite representation of a detection rule.
type RuleRecord struct {
	ID             string
	Name           string
	Description    string
	Severity       string
	Enabled        bool
	MITRE          string
	Condition      string // JSON DSL
	Threshold      int
	Window         int
	ResponseAction string
	ResponseParams string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// InsertRule persists a new detection rule.
func (s *DB) InsertRule(r *RuleRecord) error {
	enabled := 0
	if r.Enabled {
		enabled = 1
	}
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO rules
		(id, name, description, severity, enabled, mitre, condition, threshold, window, response_action, response_params, created_at, updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		r.ID, r.Name, r.Description, r.Severity, enabled,
		r.MITRE, r.Condition, r.Threshold, r.Window, r.ResponseAction, r.ResponseParams, r.CreatedAt.Unix(), r.UpdatedAt.Unix(),
	)
	return err
}

// ListRules returns all rules, enabled ones first.
func (s *DB) ListRules(enabledOnly bool) ([]*RuleRecord, error) {
	q := `SELECT id,name,description,severity,enabled,mitre,condition,threshold,window,response_action,response_params,created_at,updated_at FROM rules`
	if enabledOnly {
		q += ` WHERE enabled=1`
	}
	q += ` ORDER BY enabled DESC, name`
	rows, err := s.db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rules []*RuleRecord
	for rows.Next() {
		var r RuleRecord
		var enabledInt int
		var createdUnix, updatedUnix int64
		if err := rows.Scan(&r.ID, &r.Name, &r.Description, &r.Severity,
			&enabledInt, &r.MITRE, &r.Condition, &r.Threshold, &r.Window, &r.ResponseAction, &r.ResponseParams, &createdUnix, &updatedUnix); err != nil {
			return nil, err
		}
		r.Enabled = enabledInt == 1
		r.CreatedAt = time.Unix(createdUnix, 0)
		r.UpdatedAt = time.Unix(updatedUnix, 0)
		rules = append(rules, &r)
	}
	return rules, rows.Err()
}

// ─── FORENSICS ───────────────────────────────────────────────────────────────

// IntegrityBlockRecord represents a forensics integrity block in SQLite.
type IntegrityBlockRecord struct {
	ID         int64
	RootHash   []byte
	PrevHash   []byte
	EventCount int
	Timestamp  time.Time
	Signature  []byte
}

// InsertIntegrityBlock persists a new integrity block.
func (s *DB) InsertIntegrityBlock(b *IntegrityBlockRecord) error {
	_, err := s.db.Exec(`
		INSERT INTO integrity_blocks
		(root_hash, prev_hash, event_count, timestamp, signature)
		VALUES (?,?,?,?,?)`,
		b.RootHash, b.PrevHash, b.EventCount, b.Timestamp.Unix(), b.Signature,
	)
	return err
}

// ListIntegrityBlocks returns the N most recent sealed blocks.
func (s *DB) ListIntegrityBlocks(limit int) ([]*IntegrityBlockRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, root_hash, prev_hash, event_count, timestamp, signature
		FROM integrity_blocks ORDER BY id DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var blocks []*IntegrityBlockRecord
	for rows.Next() {
		var b IntegrityBlockRecord
		var ts int64
		if err := rows.Scan(&b.ID, &b.RootHash, &b.PrevHash, &b.EventCount, &ts, &b.Signature); err != nil {
			return nil, err
		}
		b.Timestamp = time.Unix(ts, 0)
		blocks = append(blocks, &b)
	}
	return blocks, rows.Err()
}

// GetLastIntegrityBlock returns the most recent block recorded.
func (s *DB) GetLastIntegrityBlock() (*IntegrityBlockRecord, error) {
	row := s.db.QueryRow(`
		SELECT id, root_hash, prev_hash, event_count, timestamp, signature
		FROM integrity_blocks ORDER BY id DESC LIMIT 1`)
	var b IntegrityBlockRecord
	var ts int64
	err := row.Scan(&b.ID, &b.RootHash, &b.PrevHash, &b.EventCount, &ts, &b.Signature)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	b.Timestamp = time.Unix(ts, 0)
	return &b, nil
}

// ─── DECEPTION ───────────────────────────────────────────────────────────────

// InsertHoneytoken adds a new honeytoken to the database.
func (s *DB) InsertHoneytoken(h *models.Honeytoken) error {
	_, err := s.db.Exec(`
		INSERT INTO honeytokens (id, type, value, description, created_at)
		VALUES (?, ?, ?, ?, ?)`,
		h.ID, string(h.Type), h.Value, h.Description, h.CreatedAt.Unix(),
	)
	return err
}

// ListHoneytokens returns all active honeytokens.
func (s *DB) ListHoneytokens() ([]*models.Honeytoken, error) {
	rows, err := s.db.Query(`SELECT id, type, value, description, created_at FROM honeytokens`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []*models.Honeytoken
	for rows.Next() {
		var h models.Honeytoken
		var typeStr string
		var createdAt int64
		if err := rows.Scan(&h.ID, &typeStr, &h.Value, &h.Description, &createdAt); err != nil {
			return nil, err
		}
		h.Type = models.HoneytokenType(typeStr)
		h.CreatedAt = time.Unix(createdAt, 0)
		tokens = append(tokens, &h)
	}
	return tokens, rows.Err()
}

// DeleteHoneytoken removes a honeytoken by ID.
func (s *DB) DeleteHoneytoken(id string) error {
	_, err := s.db.Exec(`DELETE FROM honeytokens WHERE id = ?`, id)
	return err
}

// ─── RESPONSE ───────────────────────────────────────────────────────────────

type ResponseExecutionRecord struct {
	ID         string
	AlertID    string
	ActionType string
	Status     string
	Output     string
	Timestamp  time.Time
}

func (s *DB) InsertResponseHistory(r *ResponseExecutionRecord) error {
	_, err := s.db.Exec(`
		INSERT INTO response_history (id, alert_id, action_type, status, output, timestamp)
		VALUES (?, ?, ?, ?, ?, ?)`,
		r.ID, r.AlertID, r.ActionType, r.Status, r.Output, r.Timestamp.Unix(),
	)
	return err
}

func (s *DB) GetResponseHistoryByAlert(alertID string) ([]*ResponseExecutionRecord, error) {
	rows, err := s.db.Query(`SELECT id, alert_id, action_type, status, output, timestamp FROM response_history WHERE alert_id = ?`, alertID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*ResponseExecutionRecord
	for rows.Next() {
		var r ResponseExecutionRecord
		var ts int64
		if err := rows.Scan(&r.ID, &r.AlertID, &r.ActionType, &r.Status, &r.Output, &ts); err != nil {
			return nil, err
		}
		r.Timestamp = time.Unix(ts, 0)
		results = append(results, &r)
	}
	return results, rows.Err()
}

// ─── FIM ─────────────────────────────────────────────────────────────────────

type FimWatchItem struct {
	Path        string
	Description string
	Recursive   bool
	CreatedAt   time.Time
}

func (s *DB) InsertFimWatch(item *FimWatchItem) error {
	rec := 0
	if item.Recursive {
		rec = 1
	}
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO fim_watchlist (path, description, recursive, created_at)
		VALUES (?, ?, ?, ?)`,
		item.Path, item.Description, rec, item.CreatedAt.Unix(),
	)
	return err
}

func (s *DB) ListFimWatchlist() ([]*FimWatchItem, error) {
	rows, err := s.db.Query(`SELECT path, description, recursive, created_at FROM fim_watchlist`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*FimWatchItem
	for rows.Next() {
		var item FimWatchItem
		var rec int
		var ts int64
		if err := rows.Scan(&item.Path, &item.Description, &rec, &ts); err != nil {
			return nil, err
		}
		item.Recursive = rec == 1
		item.CreatedAt = time.Unix(ts, 0)
		list = append(list, &item)
	}
	return list, rows.Err()
}

func (s *DB) DeleteFimWatch(path string) error {
	_, err := s.db.Exec(`DELETE FROM fim_watchlist WHERE path = ?`, path)
	return err
}

// UpsertFimBaseline stores or updates the known-good hash for a path.
func (s *DB) UpsertFimBaseline(path, hash string) error {
	_, err := s.db.Exec(
		`INSERT OR REPLACE INTO fim_baselines (path, hash, updated_at) VALUES (?, ?, ?)`,
		path, hash, time.Now().Unix(),
	)
	return err
}

// GetFimBaseline retrieves the stored baseline hash for a path.
// Returns empty string if not found.
func (s *DB) GetFimBaseline(path string) (string, error) {
	var hash string
	err := s.db.QueryRow(`SELECT hash FROM fim_baselines WHERE path = ?`, path).Scan(&hash)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return hash, err
}

// ─── FORENSICS & EVIDENCE ───────────────────────────────────────────────────

type EvidenceRecord struct {
	ID         string
	CaseID     string
	EventID    string
	RecordedBy string
	Reason     string
	RawHash    string
	Signature  string
	CreatedAt  time.Time
}

func (s *DB) InsertEvidence(e *EvidenceRecord) error {
	_, err := s.db.Exec(`
		INSERT INTO evidence (id, case_id, event_id, recorded_by, reason, raw_hash, signature, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		e.ID, e.CaseID, e.EventID, e.RecordedBy, e.Reason, e.RawHash, e.Signature, e.CreatedAt.Unix(),
	)
	return err
}

func (s *DB) GetEvidenceForCase(caseID string) ([]*EvidenceRecord, error) {
	rows, err := s.db.Query(`SELECT id, case_id, event_id, recorded_by, reason, raw_hash, signature, created_at FROM evidence WHERE case_id = ?`, caseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var evidence []*EvidenceRecord
	for rows.Next() {
		var e EvidenceRecord
		var created int64
		if err := rows.Scan(&e.ID, &e.CaseID, &e.EventID, &e.RecordedBy, &e.Reason, &e.RawHash, &e.Signature, &created); err != nil {
			return nil, err
		}
		e.CreatedAt = time.Unix(created, 0)
		evidence = append(evidence, &e)
	}
	return evidence, rows.Err()
}

type AuditRecord struct {
	ID         string
	UserID     string
	Action     string
	TargetType string
	TargetID   string
	Details    string
	Timestamp  time.Time
}

func (s *DB) InsertAuditLog(a *AuditRecord) error {
	_, err := s.db.Exec(`
		INSERT INTO audit_log (id, user_id, action, target_type, target_id, details, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		a.ID, a.UserID, a.Action, a.TargetType, a.TargetID, a.Details, a.Timestamp.Unix(),
	)
	return err
}

func (s *DB) ListAuditLogs(limit int) ([]*AuditRecord, error) {
	rows, err := s.db.Query(`SELECT id, user_id, action, target_type, target_id, details, timestamp FROM audit_log ORDER BY timestamp DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*AuditRecord
	for rows.Next() {
		var a AuditRecord
		var ts int64
		if err := rows.Scan(&a.ID, &a.UserID, &a.Action, &a.TargetType, &a.TargetID, &a.Details, &ts); err != nil {
			return nil, err
		}
		a.Timestamp = time.Unix(ts, 0)
		logs = append(logs, &a)
	}
	return logs, rows.Err()
}

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

// Close closes the underlying database connection.
func (s *DB) Close() error {
	return s.db.Close()
}

func (s *DB) InsertSavedSearch(id, name, query, user string, created int64) error {
	_, err := s.db.Exec(`INSERT INTO saved_searches (id, name, query, created_by, created_at) VALUES (?, ?, ?, ?, ?)`,
		id, name, query, user, created)
	return err
}

func (s *DB) ListSavedSearches() ([]*models.SavedSearch, error) {
	rows, err := s.db.Query(`SELECT id, name, query, created_by, created_at FROM saved_searches ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*models.SavedSearch
	for rows.Next() {
		var s models.SavedSearch
		var t int64
		if err := rows.Scan(&s.ID, &s.Name, &s.Query, &s.CreatedBy, &t); err != nil {
			return nil, err
		}
		s.CreatedAt = time.Unix(t, 0)
		results = append(results, &s)
	}
	return results, rows.Err()
}

// ─── SCAN HELPERS ─────────────────────────────────────────────────────────────

func scanAlert(row *sql.Row) (*models.Alert, error) {
	var a models.Alert
	var ts int64
	var meta string
	if err := row.Scan(&a.ID, &a.EventID, &a.RuleID, &ts,
		(*string)(&a.Severity), &a.Title, &a.Summary, &a.Status, &a.Assignee, &a.Host, &meta); err != nil {
		return nil, err
	}
	a.Timestamp = time.Unix(ts, 0)
	a.Metadata = parseMetadata(meta)
	return &a, nil
}

func scanAlerts(rows *sql.Rows) ([]*models.Alert, error) {
	var alerts []*models.Alert
	for rows.Next() {
		var a models.Alert
		var ts int64
		var meta string
		if err := rows.Scan(&a.ID, &a.EventID, &a.RuleID, &ts,
			(*string)(&a.Severity), &a.Title, &a.Summary, &a.Status, &a.Assignee, &a.Host, &meta); err != nil {
			return nil, err
		}
		a.Timestamp = time.Unix(ts, 0)
		a.Metadata = parseMetadata(meta)
		alerts = append(alerts, &a)
	}
	return alerts, rows.Err()
}

func serializeMetadata(m map[string]string) string {
	if m == nil {
		return ""
	}
	b, _ := json.Marshal(m)
	return string(b)
}

func parseMetadata(s string) map[string]string {
	m := make(map[string]string)
	if s == "" {
		return m
	}
	_ = json.Unmarshal([]byte(s), &m)
	return m
}
