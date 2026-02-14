package config

import (
	"os"
	"path/filepath"
)

// Config represents the global application configuration
type Config struct {
	Ingestion IngestionConfig `yaml:"ingestion" json:"ingestion"`
	Storage   StorageConfig   `yaml:"storage" json:"storage"`
	UI        UIConfig        `yaml:"ui" json:"ui"`
	Forensics ForensicsConfig `yaml:"forensics" json:"forensics"`
}

type IngestionConfig struct {
	SyslogPort int `yaml:"syslog_port" json:"syslog_port"`
	HECPort    int `yaml:"hec_port" json:"hec_port"`
	GRPCPort   int `yaml:"grpc_port" json:"grpc_port"`
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

// DefaultConfig returns a configuration with sensible defaults
func DefaultConfig() *Config {
	home, _ := os.UserHomeDir()
	basePath := filepath.Join(home, ".oblivra")

	return &Config{
		Ingestion: IngestionConfig{
			SyslogPort: 514,
			HECPort:    8088,
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
	}
}
