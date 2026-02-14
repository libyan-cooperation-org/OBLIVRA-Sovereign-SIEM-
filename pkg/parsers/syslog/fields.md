# Linux Syslog Field Mappings

| Syslog Field | OBLIVRA Field | Description |
|--------------|---------------|-------------|
| PRI | Fields["pri"] | Raw priority value |
| Facility | Fields["facility"] | Syslog facility (PRI / 8) |
| Level | Fields["level"] | Syslog level (PRI % 8) |
| Hostname | Host | The source host |
| Tag/App-Name | Fields["tag"] / Fields["app"] | Application or tag |
| Message | Message | The log message |
| Timestamp | Timestamp | Parsed ISO8601 or RFC3164 timestamp |
| PID | Fields["pid"] | Process ID (RFC5424 only) |
| MSGID | Fields["msgid"] | Message ID (RFC5424 only) |

## Severity Mapping

| Syslog Level | OBLIVRA Severity |
|--------------|------------------|
| 0 (Emergency) | CRITICAL |
| 1 (Alert) | CRITICAL |
| 2 (Critical) | HIGH |
| 3 (Error) | HIGH |
| 4 (Warning) | MEDIUM |
| 5 (Notice) | INFO |
| 6 (Informational)| INFO |
| 7 (Debug) | LOW |
