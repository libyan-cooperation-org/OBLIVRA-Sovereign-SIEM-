package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/rbac"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
)

// Middleware provides HTTP-level security features.
type Middleware struct {
	manager *Manager
	rbac    *rbac.RBACManager
}

func NewMiddleware(m *Manager, r *rbac.RBACManager) *Middleware {
	return &Middleware{manager: m, rbac: r}
}

// UserContextKey is used to store the user in the request context.
type UserContextKey struct{}

// RequireAuth enforces token validation.
func (mw *Middleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized: invalid header format", http.StatusUnauthorized)
			return
		}

		user, err := mw.manager.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Store user in context
		ctx := context.WithValue(r.Context(), UserContextKey{}, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole enforces specific RBAC roles (legacy).
func (mw *Middleware) RequireRole(role string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(UserContextKey{}).(*sqlitestore.UserRecord)
		if !ok || user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if user.Role != "admin" && user.Role != role {
			http.Error(w, "Forbidden: insufficient permissions", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RequirePermission enforces granular permissions.
func (mw *Middleware) RequirePermission(perm string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(UserContextKey{}).(*sqlitestore.UserRecord)
		if !ok || user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		has, err := mw.rbac.HasPermission(r.Context(), user.ID, perm)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if !has {
			http.Error(w, "Forbidden: missing permission "+perm, http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
