# Palo Alto Log Field Mappings

| CSV Index | OBLIVRA Field | Description |
|-----------|---------------|-------------|
| 2 | Host | Serial number of the device |
| 3 | Fields["log_type"] | TRAFFIC, THREAT, SYSTEM, CONFIG |
| 6 | Timestamp | Event generation time |
| 7 | Fields["src_ip"] | Source IP address |
| 8 | Fields["dst_ip"] | Destination IP address |
| 11 | Fields["rule"] | Security rule name |
| 27 | Fields["threat"] | Threat name (Threat logs only) |
| 28 | Fields["threat_id"] | Threat ID (Threat logs only) |
| 29 | Severity | Threat severity (Critical, High, etc.) |

## Log Type Mapping

| PAN-OS Type | OBLIVRA Category |
|-------------|-------------------|
| TRAFFIC | FIREWALL |
| THREAT | SECURITY |
| SYSTEM | SYSTEM |
| CONFIG | AUDIT |
