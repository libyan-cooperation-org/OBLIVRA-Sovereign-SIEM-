package parsers

import (
	"fmt"
	"sync"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

// Parser is the interface that all log parsers must implement
type Parser interface {
	// Name returns the unique name of the parser
	Name() string
	// Description returns a short description of the parser
	Description() string
	// Parse takes a raw log string and returns an OBLIVRA Event
	Parse(raw string) (*models.Event, error)
	// CanParse returns true if the parser thinks it can handle this log format
	CanParse(raw string) bool
}

var (
	registry = make(map[string]Parser)
	mu       sync.RWMutex
)

// Register adds a parser to the global registry
func Register(p Parser) {
	mu.Lock()
	defer mu.Unlock()
	registry[p.Name()] = p
}

// Get finds a parser by name
func Get(name string) (Parser, bool) {
	mu.RLock()
	defer mu.RUnlock()
	p, ok := registry[name]
	return p, ok
}

// All returns all registered parsers
func All() []Parser {
	mu.RLock()
	defer mu.RUnlock()
	all := make([]Parser, 0, len(registry))
	for _, p := range registry {
		all = append(all, p)
	}
	return all
}

// Detect attempted to find the best parser for a log line
func Detect(raw string) Parser {
	mu.RLock()
	defer mu.RUnlock()
	for _, p := range registry {
		if p.CanParse(raw) {
			return p
		}
	}
	return nil
}

type ParsingError struct {
	Parser  string
	Message string
	Raw     string
}

func (e *ParsingError) Error() string {
	return fmt.Sprintf("parser [%s] error: %s", e.Parser, e.Message)
}
