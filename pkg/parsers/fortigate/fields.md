# FortiGate Log Field Mappings

| FortiGate KV Key | OBLIVRA Field | Description |
|------------------|---------------|-------------|
| date | Timestamp (Date) | Log date (YYYY-MM-DD) |
| time | Timestamp (Time) | Log time (HH:MM:SS) |
| devname | Host | Device name |
| devid | Fields["devid"] | Device ID |
| logid | Fields["logid"] | Unique log entry ID |
| type | Category | Log type (traffic, event, utm) |
| subtype | Fields["subtype"] | Log subtype |
| level | Severity | Log level (mapped to OBLIVRA) |
| srcip | Fields["srcip"] | Source IP address |
| dstip | Fields["dstip"] | Destination IP address |
| srcport | Fields["srcport"] | Source port |
| dstport | Fields["dstport"] | Destination port |
| policyid | Fields["policyid"] | Firewall policy ID |
| action | Fields["action"] | Result (accept, deny, block) |

## Severity Mapping

| Level | OBLIVRA Severity |
|-------|------------------|
| emergency | CRITICAL |
| alert | CRITICAL |
| critical | CRITICAL |
| error | HIGH |
| warning | MEDIUM |
| notice | INFO |
| information | INFO |
| debug | LOW |
| (other) | LOW |
