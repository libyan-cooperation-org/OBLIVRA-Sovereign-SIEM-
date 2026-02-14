# Cisco ASA Log Field Mappings

| Log Fragment | OBLIVRA Field | Description |
|--------------|---------------|-------------|
| %ASA-X | Fields["severity_raw"] | Cisco severity digit |
| %ASA-X-YYYYYY | Fields["mnemonic"] | Cisco event mnemonic code |
| Message | Message | The descriptive event text |
| IP/Port | Fields["ip_0"], Fields["ip_0_port"] | Extracted source/destination IPs and ports |

## Common Cisco Mnemonic Mapping

| Mnemonic | Description | OBLIVRA Category |
|----------|-------------|-------------------|
| 302013 | Built outbound TCP connection | FIREWALL |
| 106023 | Deny tcp src/dst by access-group | SECURITY |
| 111008 | User login successful | AUTH |
| 305011 | Built dynamic (D)UDP translation | NETWORK |
| 605005 | Login permitted from IP | AUTH |

## Severity Mapping

| Cisco Level | OBLIVRA Severity |
|-------------|------------------|
| 0 (Emergency) | CRITICAL |
| 1 (Alert) | CRITICAL |
| 2 (Critical) | HIGH |
| 3 (Error) | HIGH |
| 4 (Warning) | MEDIUM |
| 5 (Notice) | INFO |
| 6 (Informational)| INFO |
| 7 (Debug) | LOW |
