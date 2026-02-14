package app

import (
	"context"

	"github.com/Mr-Naps/oblivra/internal/config"
)

// App struct
type App struct {
	ctx    context.Context
	config *config.Config
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		config: config.DefaultConfig(),
	}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// GetConfig returns the current configuration
func (a *App) GetConfig() *config.Config {
	return a.config
}
