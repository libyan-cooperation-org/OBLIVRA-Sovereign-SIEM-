package response

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// BlockIPAction simulates blocking an IP address.
type BlockIPAction struct{}

func (a *BlockIPAction) Type() string { return "block_ip" }
func (a *BlockIPAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	// In a real SOAR, this would call a firewall API or EDR
	target := params["ip"]
	if target == "" {
		return "", fmt.Errorf("block_ip: missing 'ip' parameter")
	}

	return fmt.Sprintf("Successfully blocked IP %s via Sovereign Firewall connector", target), nil
}

// DisableUserAction simulates disabling a user account.
type DisableUserAction struct{}

func (a *DisableUserAction) Type() string { return "disable_user" }
func (a *DisableUserAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	user := params["user"]
	if user == "" {
		return "", fmt.Errorf("disable_user: missing 'user' parameter")
	}

	return fmt.Sprintf("Successfully disabled user account %s in Active Directory", user), nil
}

// WebhookAction sends the alert payload to an external URL.
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
		return "", fmt.Errorf("webhook failed with status: %s", resp.Status)
	}

	return fmt.Sprintf("Alert sent to webhook %s (Status: %s)", url, resp.Status), nil
}

// NotifyAction just logs a notification.
type NotifyAction struct{}

func (a *NotifyAction) Type() string { return "notify" }
func (a *NotifyAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	return fmt.Sprintf("Notification sent: %s", params["message"]), nil
}

// IsolateHostAction sends a command to Sentinel to isolate the host.
type IsolateHostAction struct{}

func (a *IsolateHostAction) Type() string { return "isolate_host" }
func (a *IsolateHostAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	// In a real system, this would find the agent and send a Control message
	host := alert.Host
	if host == "" {
		host = params["host"]
	}
	if host == "" {
		return "", fmt.Errorf("isolate_host: no host identified")
	}

	return fmt.Sprintf("Sent ISOLATE_NETWORK command to Sentinel agent on %s", host), nil
}

// KillProcessAction sends a command to Sentinel to kill a process.
type KillProcessAction struct{}

func (a *KillProcessAction) Type() string { return "kill_process" }
func (a *KillProcessAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	pid := params["pid"]
	if pid == "" {
		return "", fmt.Errorf("kill_process: missing 'pid' parameter")
	}

	return fmt.Sprintf("Sent KILL_PROCESS (%s) command to Sentinel agent on %s", pid, alert.Host), nil
}
