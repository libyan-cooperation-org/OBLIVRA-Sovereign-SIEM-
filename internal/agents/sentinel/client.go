package sentinel

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Client represents the Sentinel agent on the host.
type Client struct {
	ID        string
	Hostname  string
	ServerURL string
	Token     string
	client    *http.Client
}

// NewClient creates a new Sentinel agent client.
func NewClient(id, hostname, server, token string) *Client {
	return &Client{
		ID:        id,
		Hostname:  hostname,
		ServerURL: server,
		Token:     token,
		client:    &http.Client{Timeout: 10 * time.Second},
	}
}

// Start initiates the agent registration and heartbeat loop.
func (c *Client) Start(ctx context.Context) error {
	// 1. Initial Registration
	if err := c.register(); err != nil {
		return fmt.Errorf("initial registration failed: %w", err)
	}

	log.Printf("Agent %s registered successfully", c.ID)

	// 2. Heartbeat loop
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if err := c.sendHeartbeat(); err != nil {
				log.Printf("Heartbeat failed: %v", err)
			}
		}
	}
}

func (c *Client) register() error {
	// In a real implementation, this would be a POST request with agent metadata
	log.Printf("Simulating registration request to %s/api/v1/agents/register", c.ServerURL)
	return nil
}

func (c *Client) sendHeartbeat() error {
	// In a real implementation, this would be a POST/PUT request with status and EPS
	// The response would contain any pending remediation commands.
	log.Printf("Sending heartbeat for agent %s...", c.ID)

	// Simulate receiving a command (normally parsed from JSON response)
	// For demo: if a certain flag or random chance occurs, simulate a command
	return nil
}

// HandleCommand simulates the execution of a SOAR remediation action on the endpoint.
func (c *Client) HandleCommand(cmdType string, params map[string]string) {
	log.Printf("AGENT REMEDIATION: Received command [%s]", cmdType)

	switch cmdType {
	case "isolate_host":
		log.Printf("AGENT: Isolating host network interfaces via OS-level firewall...")
		// Simulate: exec.Command("netsh", "advfirewall", "set", "allprofiles", "state", "off")
	case "kill_process":
		pid := params["pid"]
		log.Printf("AGENT: Terminating process tree for PID %s...", pid)
		// Simulate: exec.Command("taskkill", "/F", "/PID", pid)
	default:
		log.Printf("AGENT: Unknown command type: %s", cmdType)
	}
}

// SendLog forwards a log entry to the central OBLIVRA server.
func (c *Client) SendLog(msg string) error {
	// Mock forwarding
	log.Printf("Forwarding log: %s", msg)
	return nil
}
