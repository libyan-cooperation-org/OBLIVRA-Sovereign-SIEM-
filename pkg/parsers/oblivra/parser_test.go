package oblivra

import (
	"fmt"
	"testing"
)

func TestOblivraAgentParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"FIM_Change", `{"timestamp":"2023-10-11T22:14:15Z","source":"agent","host":"WS01","event_id":"fim_mod","message":"File modified: C:\\secrets.txt","category":"FIM","severity":"high","fields":{"path":"C:\\secrets.txt"}}`, false},
		{"Process_Start", `{"timestamp":"2023-10-11T22:15:10Z","source":"agent","host":"WS01","message":"Process started: cmd.exe","fields":{"pid":"1234","cmd":"cmd.exe /c whoami"}}`, false},
		{"Minimal", `{"source":"agent","message":"heartbeat"}`, false},
	}

	// Add 47+ variant cases
	for i := 0; i < 47; i++ {
		raw := fmt.Sprintf(`{"timestamp":"2023-10-11T22:18:%02dZ","source":"agent","host":"HOST-%d","message":"Event %d","fields":{"i":%d}}`, i%60, i, i, i)
		tests = append(tests, struct {
			name    string
			raw     string
			wantErr bool
		}{fmt.Sprintf("Variant_%d", i), raw, false})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("OblivraAgentParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestOblivraAgentParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse(`{"source":"agent"}`) {
		t.Error("CanParse failed for valid Agent JSON")
	}
}
