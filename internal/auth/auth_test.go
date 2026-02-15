package auth

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
)

func TestAuthManager(t *testing.T) {
	tmpDir, _ := os.MkdirTemp("", "auth_test")
	defer os.RemoveAll(tmpDir)
	dbPath := filepath.Join(tmpDir, "oblivra.db")

	store, err := sqlitestore.Open(dbPath)
	if err != nil {
		t.Fatalf("failed to open store: %v", err)
	}
	defer store.Close()

	m := NewManager(store)

	t.Run("Create and Authenticate User", func(t *testing.T) {
		_, err := m.CreateUser("testuser", "password123", "analyst")
		if err != nil {
			t.Fatalf("failed to create user: %v", err)
		}

		u, err := m.Authenticate("testuser", "password123")
		if err != nil {
			t.Fatalf("failed to authenticate: %v", err)
		}
		if u.Username != "testuser" {
			t.Errorf("expected username testuser, got %s", u.Username)
		}
		if u.Role != "analyst" {
			t.Errorf("expected role analyst, got %s", u.Role)
		}

		_, err = m.Authenticate("testuser", "wrongpassword")
		if err != ErrUnauthorized {
			t.Errorf("expected unauthorized error, got %v", err)
		}
	})

	t.Run("Tokens", func(t *testing.T) {
		u, _ := m.Authenticate("testuser", "password123")

		token, err := m.CreateToken(u.ID, 1*time.Hour)
		if err != nil {
			t.Fatalf("failed to create token: %v", err)
		}

		u2, err := m.ValidateToken(token.Token)
		if err != nil {
			t.Fatalf("failed to validate token: %v", err)
		}
		if u2.ID != u.ID {
			t.Errorf("expected user ID %s, got %s", u.ID, u2.ID)
		}

		// Test expired token
		expiredToken, _ := m.CreateToken(u.ID, -1*time.Hour)
		_, err = m.ValidateToken(expiredToken.Token)
		if err != ErrExpired {
			t.Errorf("expected expired error, got %v", err)
		}
	})
}
