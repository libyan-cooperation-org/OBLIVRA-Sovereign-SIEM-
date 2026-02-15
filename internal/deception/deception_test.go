package deception

import (
	"context"
	"testing"

	"github.com/libyan-cooperation-org/OBLIVRA-Sovereign-SIEM-/pkg/models"
)

func TestDeceptionMatching(t *testing.T) {
	var triggeredAlert *models.Alert
	handler := func(ctx context.Context, alert *models.Alert) error {
		triggeredAlert = alert
		return nil
	}

	m := NewManager(handler)
	m.tokens = map[string]*models.Honeytoken{
		"admin_honeypot": {
			ID:    "token1",
			Type:  models.HoneytokenUser,
			Value: "admin_honeypot",
		},
		"1.2.3.4": {
			ID:    "token2",
			Type:  models.HoneytokenIP,
			Value: "1.2.3.4",
		},
	}

	ctx := context.Background()

	t.Run("Match User Field", func(t *testing.T) {
		triggeredAlert = nil
		ev := &models.Event{User: "admin_honeypot"}
		m.ProcessEvent(ctx, ev)
		if triggeredAlert == nil {
			t.Error("Expected alert to be triggered for honey-user")
		}
	})

	t.Run("Match Message Field", func(t *testing.T) {
		triggeredAlert = nil
		ev := &models.Event{Message: "Login attempt from 1.2.3.4"}
		m.ProcessEvent(ctx, ev)
		if triggeredAlert == nil {
			t.Error("Expected alert to be triggered for honey-IP in message")
		}
	})

	t.Run("Match Dynamic Field", func(t *testing.T) {
		triggeredAlert = nil
		ev := &models.Event{
			Fields: map[string]interface{}{
				"src_ip": "1.2.3.4",
			},
		}
		m.ProcessEvent(ctx, ev)
		if triggeredAlert == nil {
			t.Error("Expected alert to be triggered for honey-IP in src_ip field")
		}
	})

	t.Run("No Match", func(t *testing.T) {
		triggeredAlert = nil
		ev := &models.Event{User: "normal_user", Message: "Nothing here"}
		m.ProcessEvent(ctx, ev)
		if triggeredAlert != nil {
			t.Error("Did not expect alert for normal user")
		}
	})
}
