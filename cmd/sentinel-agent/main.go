package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/agents/sentinel"
)

func main() {
	serverURL := flag.String("server", "http://localhost:8080", "OBLIVRA Server URL")
	token := flag.String("token", "", "Authentication Token")
	flag.Parse()

	if *token == "" {
		fmt.Println("Error: --token is required")
		os.Exit(1)
	}

	fmt.Println("OBLIVRA Sentinel Agent starting...")

	// Generate a persistent ID (In a real app, this would be saved to disk)
	agentID := uuid.NewString()
	hostname, _ := os.Hostname()

	client := sentinel.NewClient(agentID, hostname, *serverURL, *token)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := client.Start(ctx); err != nil {
		log.Fatalf("Agent failed: %v", err)
	}

	fmt.Println("Agent stopped.")
}
