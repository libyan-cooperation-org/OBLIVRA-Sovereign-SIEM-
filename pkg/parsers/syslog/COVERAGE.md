# Linux Syslog Parser Coverage

## Supported Formats
- [x] RFC3164 (BSD Syslog)
- [x] RFC5424 (Modern Syslog)

## Validated Scenarios
- [x] Standard BSD syslog from Ubuntu/CentOS
- [x] RFC5424 logs from modern systemd/rsyslog
- [x] Missing year in RFC3164 (current year assumption)
- [x] Malformed headers (graceful error handling)
- [x] Adversarial injection attempts in message section
- [x] Null byte in logs
- [x] Multi-line (partial support, base line parsing)

## Tested Versions
- rsyslog 8.x
- syslog-ng 3.x
- systemd-journald forward
