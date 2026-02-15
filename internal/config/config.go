package config

import (
	"os"
	"path/filepath"
)

// Config represents the global application configuration
type Config struct {
	Ingestion     IngestionConfig     `yaml:"ingestion" json:"ingestion"`
	Storage       StorageConfig       `yaml:"storage" json:"storage"`
	UI            UIConfig            `yaml:"ui" json:"ui"`
	Forensics     ForensicsConfig     `yaml:"forensics" json:"forensics"`
	Notifications NotificationConfig  `yaml:"notifications" json:"notifications"`
}

type IngestionConfig struct {
	SyslogPort int    `yaml:"syslog_port" json:"syslog_port"`
	HECPort    int    `yaml:"hec_port" json:"hec_port"`
	HECToken   string `yaml:"hec_token" json:"hec_token"`
	GRPCPort   int    `yaml:"grpc_port" json:"grpc_port"`
}

type StorageConfig struct {
	BasePath  string `yaml:"base_path" json:"base_path"`
	Retention int    `yaml:"retention_days" json:"retention_days"`
}

type UIConfig struct {
	Port  int    `yaml:"port" json:"port"`
	Theme string `yaml:"theme" json:"theme"`
}

type ForensicsConfig struct {
	EnableMerkle bool `yaml:"enable_merkle" json:"enable_merkle"`
}

type NotificationConfig struct {
	// SMTP
	SMTPHost     string `yaml:"smtp_host" json:"smtp_host"`
	SMTPPort     int    `yaml:"smtp_port" json:"smtp_port"`
	SMTPUser     string `yaml:"smtp_user" json:"smtp_user"`
	SMTPPassword string `yaml:"smtp_password" json:"smtp_password"`
	SMTPFrom     string `yaml:"smtp_from" json:"smtp_from"`
	SMTPTo       string `yaml:"smtp_to" json:"smtp_to"` // comma-separated
	SMTPTLS      bool   `yaml:"smtp_tls" json:"smtp_tls"`
	// Slack
	SlackWebhook string `yaml:"slack_webhook" json:"slack_webhook"`
	SlackChannel string `yaml:"slack_channel" json:"slack_channel"`
	// Microsoft Teams
	TeamsWebhook string `yaml:"teams_webhook" json:"teams_webhook"`
	// Minimum severity to notify (INFO | LOW | MEDIUM | HIGH | CRITICAL)
	MinSeverity string `yaml:"min_severity" json:"min_severity"`
}

// DefaultConfig returns a configuration with sensible defaults
func DefaultConfig() *Config {
	home, _ := os.UserHomeDir()
	basePath := filepath.Join(home, ".oblivra")

	return &Config{
		Ingestion: IngestionConfig{
			SyslogPort: 514,
			HECPort:    8088,
			HECToken:   "oblivra-token-123",
			GRPCPort:   50051,
		},
		Storage: StorageConfig{
			BasePath:  basePath,
			Retention: 30,
		},
		UI: UIConfig{
			Port:  34115,
			Theme: "oblivra-black",
		},
		Forensics: ForensicsConfig{
			EnableMerkle: true,
		},
		Notifications: NotificationConfig{
			SMTPPort:    587,
			SMTPTLS:     true,
			MinSeverity: "HIGH",
		},
	}
}
