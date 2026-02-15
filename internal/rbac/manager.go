package rbac

import (
	"context"
	"fmt"
	"sync"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
)

// RBACManager handles granular permission checks.
type RBACManager struct {
	store *sqlitestore.DB
	cache sync.Map // Simple cache for user permissions
}

func NewManager(store *sqlitestore.DB) *RBACManager {
	return &RBACManager{
		store: store,
	}
}

// HasPermission checks if a user has a specific permission.
func (m *RBACManager) HasPermission(ctx context.Context, userID string, permission string) (bool, error) {
	if userID == "" {
		return false, nil
	}

	// Check cache
	if val, ok := m.cache.Load(userID); ok {
		perms := val.(map[string]bool)
		return perms[permission] || perms["admin:system"], nil
	}

	// Load from DB
	perms, err := m.store.GetUserPermissions(userID)
	if err != nil {
		return false, fmt.Errorf("rbac: failed to load permissions: %w", err)
	}

	permMap := make(map[string]bool)
	for _, p := range perms {
		permMap[p] = true
	}
	m.cache.Store(userID, permMap)

	return permMap[permission] || permMap["admin:system"], nil
}

// ClearCache removes a user's permissions from the cache.
func (m *RBACManager) ClearCache(userID string) {
	m.cache.Delete(userID)
}
