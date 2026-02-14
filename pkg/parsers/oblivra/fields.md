# OBLIVRA Agent Field Mappings

The OBLIVRA Agent format is a direct JSON representation of the `models.Event` struct, allowing for zero-overhead ingestion.

| JSON Key | OBLIVRA Field | Description |
|----------|---------------|-------------|
| timestamp | Timestamp | ISO8601/RFC3339 timestamp |
| source | Source | Always "agent" or "oblivra" |
| host | Host | Originating computer name |
| user | User | Relevant user SID or name |
| severity | Severity | critical, high, medium, low, info |
| category | Category | Event category (FIM, PROCESS, etc.) |
| message | Message | Human-readable event description |
| fields | Fields | Arbitrary KV pairs for enrichment |

## Native Security Event Categories

| Category | Description |
|----------|-------------|
| FIM | File Integrity Monitoring |
| PROCESS | Process behavior monitoring |
| NETWORK | Socket and connection events |
| REGISTRY | Windows Registry modifications |
| CHAOS | Chaos Engineering drill events |
