# OBLIVRA Agent Parser Coverage

## Supported Formats
- [x] OBLIVRA Native Event JSON (RFC3339)

## Validated Scenarios
- [x] Full event ingestion (all fields present)
- [x] Missing non-essential fields (fallback logic)
- [x] Nested `Fields` object support
- [x] Large JSON payloads (100+ KV pairs)
- [x] Unicode and binary data in fields (Base64)
- [x] Adversarial JSON (Circular refs, depth limit)
- [x] Malformed JSON (Short-circuit error)

## Tested Platforms
- OBLIVRA Windows Agent
- OBLIVRA Linux Agent
- OBLIVRA Chaos Engine
