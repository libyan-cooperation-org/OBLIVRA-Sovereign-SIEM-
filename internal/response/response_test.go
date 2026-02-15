package response

import (
	"context"
	"testing"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func TestResponseExecution(t *testing.T) {
	// Mock store is not easily usable here without mocking the whole DB,
	// but we can test the logic units.

	m := &Manager{
		actions: make(map[string]Action),
	}

	mockAction := &mockSOARAction{t: t}
	m.RegisterAction(mockAction)

	alert := &models.Alert{
		ID:      "test_alert",
		RuleID:  "test_rule",
		Summary: "Test Summary",
	}

	t.Run("Action Execution", func(t *testing.T) {
		mockAction.executed = false
		// Force action type selection for test since we aren't using the DB lookup here
		action := m.actions["mock"]
		_, err := action.Execute(context.Background(), alert, nil)
		if err != nil {
			t.Fatalf("Action execution failed: %v", err)
		}
		if !mockAction.executed {
			t.Error("Mock action was not marked as executed")
		}
	})
}

type mockSOARAction struct {
	t        *testing.T
	executed bool
}

func (a *mockSOARAction) Type() string { return "mock" }
func (a *mockSOARAction) Execute(ctx context.Context, alert *models.Alert, params map[string]string) (string, error) {
	a.executed = true
	return "Mock success", nil
}

func TestBuiltinActions(t *testing.T) {
	ctx := context.Background()
	alert := &models.Alert{ID: "alert1"}

	t.Run("BlockIP", func(t *testing.T) {
		a := &BlockIPAction{}
		params := map[string]string{"ip": "1.1.1.1"}
		out, err := a.Execute(ctx, alert, params)
		if err != nil || out == "" {
			t.Errorf("BlockIP failed: %v", err)
		}
	})

	t.Run("DisableUser", func(t *testing.T) {
		a := &DisableUserAction{}
		params := map[string]string{"user": "testuser"}
		out, err := a.Execute(ctx, alert, params)
		if err != nil || out == "" {
			t.Errorf("DisableUser failed: %v", err)
		}
	})
}
