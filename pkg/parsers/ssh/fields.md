# SSH Log Field Mappings

| Log Segment | OBLIVRA Field | Description |
|-------------|---------------|-------------|
| timestamp | Timestamp | Extracted from BSD syslog header |
| host | Host | Source hostname from header |
| user | User | Authenticating user |
| action | Fields["action"] | accepted, failed, or closed |
| method | Fields["method"] | password, publickey, etc. |
| source_ip | Fields["source_ip"] | Client IP address |
| port | Fields["port"] | Source port |
| proto | Fields["proto"] | ssh2, etc. |
| tag | Fields["tag"] | Typically 'sshd' |

## Severity Mapping

| Action | OBLIVRA Severity |
|--------|------------------|
| accepted | LOW |
| failed | HIGH |
| closed | INFO |
| invalid user | HIGH |
