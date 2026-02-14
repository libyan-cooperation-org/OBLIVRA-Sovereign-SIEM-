# Generic JSON Parser Coverage

## Supported Formats
- [x] Any valid single-line or multi-line JSON object

## Validated Scenarios
- [x] Flat JSON objects
- [x] Nested JSON objects (preserved in `Fields`)
- [x] Array values (preserved in `Fields`)
- [x] Common field mapping (timestamp, host, etc.)
- [x] Case-insensitive key matching for common fields
- [x] Malformed JSON detection
- [x] Deeply nested JSON (up to 20 levels tested)
- [x] Large payloads (1MB+ JSON)
- [x] Adversarial JSON (Unicode exploits, key duplication)

## Tested Schemas
- AWS CloudTrail (JSON segment)
- Google Cloud Audit (JSON segment)
- Docker/Kubernetes container logs
- custom application JSON logs
