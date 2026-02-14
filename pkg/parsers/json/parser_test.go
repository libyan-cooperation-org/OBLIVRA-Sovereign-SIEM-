package json

import (
	"fmt"
	"testing"
)

func TestGenericJSONParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		{"Basic", `{"message": "Hello world", "host": "srv1", "timestamp": "2023-10-11T22:14:15Z"}`, false},
		{"Case_Insensitive", `{"MESSAGE": "Alert", "HOST": "srv2", "TIME": "2023-10-11T22:15:10Z", "LEVEL": "high"}`, false},
		{"Nested", `{"msg": "Nested event", "fields": {"sub": "val", "arr": [1,2,3]}}`, false},
		{"Minimal", `{"key": "value"}`, false},
		{"Malformed", `{"key": "value"`, true},
	}

	// Add 45+ variant cases
	for i := 0; i < 45; i++ {
		raw := fmt.Sprintf(`{"msg": "Test event %d", "id": %d, "timestamp": "2023-10-11T22:18:%02dZ"}`, i, i, i%60)
		tests = append(tests, struct {
			name    string
			raw     string
			wantErr bool
		}{fmt.Sprintf("Variant_%d", i), raw, false})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ev, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenericJSONParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && ev == nil {
				t.Error("Event is nil")
			}
		})
	}
}

func TestGenericJSONParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse(` {"key": "value"} `) {
		t.Error("CanParse failed for valid JSON")
	}
	if p.CanParse(`Not JSON`) {
		t.Error("CanParse passed for non-JSON")
	}
}
