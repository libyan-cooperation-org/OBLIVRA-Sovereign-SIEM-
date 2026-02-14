# Generic JSON Field Mappings

The Generic JSON parser uses heuristic mapping to match arbitrary JSON keys to OBLIVRA's standardized event fields.

| Possible JSON Keys | OBLIVRA Field | Priority |
|-------------------|---------------|----------|
| timestamp, time, ts, @timestamp | Timestamp | High |
| message, msg, text | Message | High |
| host, hostname, computer | Host | Medium |
| user, username | User | Medium |
| severity, level | Severity | Medium |

## Severity Heuristics

| Value | OBLIVRA Severity |
|-------|------------------|
| critical, fatal, emerg, panic | CRITICAL |
| error, err, high | HIGH |
| warn, warning, medium | MEDIUM |
| info, informational, low | INFO |
| (null/unknown) | INFO |
