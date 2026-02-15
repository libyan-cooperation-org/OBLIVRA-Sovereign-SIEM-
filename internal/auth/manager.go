package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/internal/storage/sqlitestore"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUnauthorized = errors.New("auth: unauthorized")
	ErrExpired      = errors.New("auth: token expired")
)

type Manager struct {
	store *sqlitestore.DB
}

func NewManager(store *sqlitestore.DB) *Manager {
	return &Manager{
		store: store,
	}
}

// HashPassword generates a bcrypt hash for a password.
func (m *Manager) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

// Authenticate verifies username and password, returning the user if successful.
func (m *Manager) Authenticate(username, password string) (*sqlitestore.UserRecord, error) {
	u, err := m.store.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, ErrUnauthorized
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, ErrUnauthorized
	}

	return u, nil
}

// CreateToken generates a new API token for a user.
func (m *Manager) CreateToken(userID string, duration time.Duration) (*sqlitestore.TokenRecord, error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, err
	}
	tokenStr := hex.EncodeToString(tokenBytes)

	t := &sqlitestore.TokenRecord{
		ID:        uuid.NewString(),
		UserID:    userID,
		Token:     tokenStr,
		ExpiresAt: time.Now().Add(duration),
		CreatedAt: time.Now(),
	}

	if err := m.store.InsertToken(t); err != nil {
		return nil, err
	}

	return t, nil
}

// ValidateToken checks if a token is valid and returns the associated user.
func (m *Manager) ValidateToken(tokenStr string) (*sqlitestore.UserRecord, error) {
	t, err := m.store.GetToken(tokenStr)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, ErrUnauthorized
	}

	if time.Now().After(t.ExpiresAt) {
		return nil, ErrExpired
	}

	return m.store.GetUserByID(t.UserID)
}

// CreateUser is a helper to hash password and insert user.
func (m *Manager) CreateUser(username, password, role string) (*sqlitestore.UserRecord, error) {
	hash, err := m.HashPassword(password)
	if err != nil {
		return nil, err
	}

	u := &sqlitestore.UserRecord{
		ID:           uuid.NewString(),
		Username:     username,
		PasswordHash: hash,
		Role:         role,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := m.store.InsertUser(u); err != nil {
		return nil, err
	}

	return u, nil
}
