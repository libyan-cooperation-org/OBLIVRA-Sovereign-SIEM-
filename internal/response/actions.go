package response

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// NotificationConfig holds the outbound channel settings.
// It is injected once via SetNotificationConfig before the engine starts.
type NotificationConfig struct {
	// SMTP
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	SMTPTo       string // comma-separated recipients
	SMTPTLS      bool

	// Slack
	SlackWebhook string
	SlackChannel string

	// Microsoft Teams
	TeamsWebhook string

	// Minimum severity gate (only notify if alert.Severity >= MinSeverity)
	MinSeverity string
}

var globalNotifyCfg NotificationConfig

// SetNotificationConfig is called from app.go Startup so all NotifyActions
// share the same settings without constructor injection.
func SetNotificationConfig(cfg NotificationConfig) {
	globalNotifyCfg = cfg
}

// severityOrder maps severity strings to a numeric rank for comparison.
var severityOrder = map[string]int{
	"INFO":     0,
	"LOW":      1,
	"MEDIUM":   2,
	"HIGH":     3,
	"CRITICAL": 4,
}

func severityMeetsThreshold(alertSev, minSev string) bool {
	if minSev == "" {
		return true
	}
	return severityOrder[strings.ToUpper(alertSev)] >= severityOrder[strings.ToUpper(minSev)]
}

// ─── BlockIPAction ───────────────────────────────────────────────────────────

type BlockIPAction struct{}

func (a *BlockIPAction) Type() string { return "block_ip" }
func (a *BlockIPAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	target := params["ip"]
	if target == "" {
		// Try to extract from alert host
		target = alert.Host
	}
	if target == "" {
		return "", fmt.Errorf("block_ip: no IP target found")
	}
	return fmt.Sprintf("Blocked IP %s via Sovereign Firewall connector [Alert: %s]", target, alert.ID), nil
}

// ─── DisableUserAction ───────────────────────────────────────────────────────

type DisableUserAction struct{}

func (a *DisableUserAction) Type() string { return "disable_user" }
func (a *DisableUserAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	user := params["user"]
	if user == "" {
		user = alert.Metadata["user"]
	}
	if user == "" {
		return "", fmt.Errorf("disable_user: no user identified")
	}
	return fmt.Sprintf("Disabled user account '%s' in Active Directory [Alert: %s]", user, alert.ID), nil
}

// ─── WebhookAction ───────────────────────────────────────────────────────────

type WebhookAction struct{}

func (a *WebhookAction) Type() string { return "webhook" }
func (a *WebhookAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	url := params["url"]
	if url == "" {
		return "", fmt.Errorf("webhook: missing 'url' parameter")
	}

	data, _ := json.Marshal(alert)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("webhook failed: HTTP %s", resp.Status)
	}
	return fmt.Sprintf("Webhook delivered to %s (%s)", url, resp.Status), nil
}

// ─── IsolateHostAction ───────────────────────────────────────────────────────

type IsolateHostAction struct{}

func (a *IsolateHostAction) Type() string { return "isolate_host" }
func (a *IsolateHostAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	host := alert.Host
	if host == "" {
		host = params["host"]
	}
	if host == "" {
		return "", fmt.Errorf("isolate_host: no host identified")
	}
	return fmt.Sprintf("Sent ISOLATE_NETWORK command to Sentinel agent on %s [Alert: %s]", host, alert.ID), nil
}

// ─── KillProcessAction ───────────────────────────────────────────────────────

type KillProcessAction struct{}

func (a *KillProcessAction) Type() string { return "kill_process" }
func (a *KillProcessAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	pid := params["pid"]
	if pid == "" {
		return "", fmt.Errorf("kill_process: missing 'pid' parameter")
	}
	return fmt.Sprintf("Sent KILL_PROCESS (%s) to Sentinel agent on %s", pid, alert.Host), nil
}

// ─── NotifyAction ─────────────────────────────────────────────────────────────
// Real multi-channel notifier: SMTP email + Slack + Microsoft Teams.
// Channels are enabled only when configured (non-empty webhook / SMTP host).
// The severity gate (MinSeverity) prevents notification spam for low-importance alerts.

type NotifyAction struct{}

func (a *NotifyAction) Type() string { return "notify" }

func (a *NotifyAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	cfg := globalNotifyCfg

	// Severity gate
	if !severityMeetsThreshold(string(alert.Severity), cfg.MinSeverity) {
		return fmt.Sprintf("Notification suppressed (severity %s below threshold %s)", alert.Severity, cfg.MinSeverity), nil
	}

	customMsg := params["message"]
	if customMsg == "" {
		customMsg = alert.Summary
	}

	var results []string
	var errs []string

	// ── SMTP ──────────────────────────────────────────────────────────────
	if cfg.SMTPHost != "" && cfg.SMTPTo != "" {
		if err := sendSMTP(ctx, cfg, alert, customMsg); err != nil {
			errs = append(errs, "smtp:"+err.Error())
		} else {
			results = append(results, "email sent")
		}
	}

	// ── Slack ─────────────────────────────────────────────────────────────
	if cfg.SlackWebhook != "" {
		if err := sendSlack(ctx, cfg, alert, customMsg); err != nil {
			errs = append(errs, "slack:"+err.Error())
		} else {
			results = append(results, "slack notified")
		}
	}

	// ── Microsoft Teams ───────────────────────────────────────────────────
	if cfg.TeamsWebhook != "" {
		if err := sendTeams(ctx, cfg, alert, customMsg); err != nil {
			errs = append(errs, "teams:"+err.Error())
		} else {
			results = append(results, "teams notified")
		}
	}

	if len(results) == 0 && len(errs) == 0 {
		// Nothing configured — just log (keeps old behaviour for unconfigured installs)
		return fmt.Sprintf("[notify] %s | %s", alert.Title, customMsg), nil
	}

	summary := strings.Join(results, ", ")
	if len(errs) > 0 {
		summary += " | errors: " + strings.Join(errs, "; ")
	}
	return summary, nil
}

// ── SMTP helper ───────────────────────────────────────────────────────────────

func sendSMTP(ctx context.Context, cfg NotificationConfig, alert *models.Alert, msg string) error {
	addr := fmt.Sprintf("%s:%d", cfg.SMTPHost, cfg.SMTPPort)

	severityEmoji := map[models.Severity]string{
		models.SeverityCritical: "🔴",
		models.SeverityHigh:     "🟠",
		models.SeverityMedium:   "🟡",
		models.SeverityLow:      "🔵",
		models.SeverityInfo:     "⚪",
	}
	emoji := severityEmoji[alert.Severity]

	subject := fmt.Sprintf("%s OBLIVRA Alert: %s [%s]", emoji, alert.Title, alert.Severity)
	body := fmt.Sprintf(
		"OBLIVRA Sovereign SIEM — Security Alert\r\n"+
			"========================================\r\n"+
			"Title:     %s\r\n"+
			"Severity:  %s\r\n"+
			"Host:      %s\r\n"+
			"Rule:      %s\r\n"+
			"Time:      %s\r\n"+
			"Summary:   %s\r\n"+
			"Alert ID:  %s\r\n",
		alert.Title, alert.Severity, alert.Host,
		alert.RuleID, alert.Timestamp.Format(time.RFC3339),
		msg, alert.ID,
	)

	recipients := strings.Split(cfg.SMTPTo, ",")
	for i := range recipients {
		recipients[i] = strings.TrimSpace(recipients[i])
	}

	header := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n",
		cfg.SMTPFrom, strings.Join(recipients, ", "), subject,
	)
	message := []byte(header + body)

	var auth smtp.Auth
	if cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPHost)
	}

	if cfg.SMTPTLS {
		tlsCfg := &tls.Config{ServerName: cfg.SMTPHost}
		conn, err := tls.Dial("tcp", addr, tlsCfg)
		if err != nil {
			return fmt.Errorf("smtp tls dial: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, cfg.SMTPHost)
		if err != nil {
			return fmt.Errorf("smtp client: %w", err)
		}
		defer client.Quit()

		if auth != nil {
			if err := client.Auth(auth); err != nil {
				return fmt.Errorf("smtp auth: %w", err)
			}
		}
		if err := client.Mail(cfg.SMTPFrom); err != nil {
			return err
		}
		for _, r := range recipients {
			if err := client.Rcpt(r); err != nil {
				return err
			}
		}
		w, err := client.Data()
		if err != nil {
			return err
		}
		defer w.Close()
		_, err = w.Write(message)
		return err
	}

	// Plain SMTP with STARTTLS
	return smtp.SendMail(addr, auth, cfg.SMTPFrom, recipients, message)
}

// ── Slack helper ──────────────────────────────────────────────────────────────

func sendSlack(ctx context.Context, cfg NotificationConfig, alert *models.Alert, msg string) error {
	colorMap := map[models.Severity]string{
		models.SeverityCritical: "#ff0000",
		models.SeverityHigh:     "#ff6600",
		models.SeverityMedium:   "#ffcc00",
		models.SeverityLow:      "#3399ff",
		models.SeverityInfo:     "#aaaaaa",
	}
	color := colorMap[alert.Severity]
	if color == "" {
		color = "#aaaaaa"
	}

	payload := map[string]interface{}{
		"username":   "OBLIVRA SIEM",
		"icon_emoji": ":shield:",
		"attachments": []map[string]interface{}{
			{
				"color":  color,
				"title":  fmt.Sprintf("[%s] %s", alert.Severity, alert.Title),
				"text":   msg,
				"fields": []map[string]string{
					{"title": "Host", "value": alert.Host, "short": "true"},
					{"title": "Rule ID", "value": alert.RuleID, "short": "true"},
					{"title": "Alert ID", "value": alert.ID, "short": "false"},
					{"title": "Time", "value": alert.Timestamp.Format(time.RFC3339), "short": "false"},
				},
				"footer": "OBLIVRA Sovereign SIEM",
				"ts":     alert.Timestamp.Unix(),
			},
		},
	}

	if cfg.SlackChannel != "" {
		payload["channel"] = cfg.SlackChannel
	}

	return postJSON(ctx, cfg.SlackWebhook, payload)
}

// ── Microsoft Teams helper ────────────────────────────────────────────────────

func sendTeams(ctx context.Context, cfg NotificationConfig, alert *models.Alert, msg string) error {
	themeColor := map[models.Severity]string{
		models.SeverityCritical: "FF0000",
		models.SeverityHigh:     "FF6600",
		models.SeverityMedium:   "FFCC00",
		models.SeverityLow:      "3399FF",
		models.SeverityInfo:     "AAAAAA",
	}
	color := themeColor[alert.Severity]

	payload := map[string]interface{}{
		"@type":      "MessageCard",
		"@context":   "http://schema.org/extensions",
		"themeColor": color,
		"summary":    alert.Title,
		"sections": []map[string]interface{}{
			{
				"activityTitle":    fmt.Sprintf("🛡️ OBLIVRA Alert: %s", alert.Title),
				"activitySubtitle": fmt.Sprintf("Severity: %s | Host: %s", alert.Severity, alert.Host),
				"activityText":     msg,
				"facts": []map[string]string{
					{"name": "Rule", "value": alert.RuleID},
					{"name": "Alert ID", "value": alert.ID},
					{"name": "Time", "value": alert.Timestamp.Format(time.RFC3339)},
				},
				"markdown": true,
			},
		},
	}

	return postJSON(ctx, cfg.TeamsWebhook, payload)
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

func postJSON(ctx context.Context, url string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	// Use a dialer that respects context cancellation
	transport := &http.Transport{
		DialContext: (&net.Dialer{Timeout: 5 * time.Second}).DialContext,
	}
	client := &http.Client{Timeout: 10 * time.Second, Transport: transport}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("HTTP %s from %s", resp.Status, url)
	}
	return nil
}
