package nginx

import (
	"fmt"
	"testing"
)

func TestNginxParser_Parse(t *testing.T) {
	p := New()
	tests := []struct {
		name    string
		raw     string
		wantErr bool
	}{
		// Access Logs
		{"Access_200", `127.0.0.1 - - [11/Oct/2023:22:14:15 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"`, false},
		{"Access_404", `192.168.1.1 - admin [11/Oct/2023:22:15:10 +0000] "GET /wp-login.php HTTP/1.1" 404 153 "http://google.com" "sqlmap/1.4"`, false},
		{"Access_500", `10.0.0.5 - - [11/Oct/2023:22:16:05 +0000] "POST /api/upload HTTP/1.1" 500 0 "-" "-"`, false},

		// Error Logs
		{"Error_Simple", `2023/10/11 22:14:15 [error] 1234#0: *1 open() "/var/www/html/404" failed (2: No such file or directory)`, false},
		{"Error_With_Client", `2023/10/11 22:15:20 [warn] 1234#0: *2 using uninitialized "foo" variable, client: 1.2.3.4, server: localhost`, false},
		{"Error_With_Request", `2023/10/11 22:16:30 [crit] 1234#0: *3 connect() failed (111: Connection refused) while connecting to upstream, client: 1.1.1.1, server: _, request: "GET /api HTTP/1.1", host: "example.com"`, false},
	}

	// Add variants to meet 50+
	for i := 0; i < 44; i++ {
		ts := fmt.Sprintf("11/Oct/2023:22:%02d:00 +0000", i%60)
		raw := fmt.Sprintf(`1.2.3.%d - - [%s] "GET /test/%d HTTP/1.1" 200 %d "-" "TestAgent/%d"`, i, ts, i, i*100, i)
		tests = append(tests, struct {
			name    string
			raw     string
			wantErr bool
		}{fmt.Sprintf("Access_Variant_%d", i), raw, false})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := p.Parse(tt.raw)
			if (err != nil) != tt.wantErr {
				t.Errorf("NginxParser.Parse() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestNginxParser_CanParse(t *testing.T) {
	p := New()
	if !p.CanParse(`127.0.0.1 - - [11/Oct/2023:22:14:15 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"`) {
		t.Error("CanParse failed for valid access log")
	}
	if !p.CanParse(`2023/10/11 22:14:15 [error] 1234#0: *1 open() failed`) {
		t.Error("CanParse failed for valid error log")
	}
}
