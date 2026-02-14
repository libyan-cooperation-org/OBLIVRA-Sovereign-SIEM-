# Cisco ASA Parser Coverage

## Supported Formats
- [x] Cisco ASA Standard Syslog (%ASA-X-YYYYYY)

## Validated Scenarios
- [x] TCP/UDP Connection Build/Teardown (302013, 302014)
- [x] Deny by Access-Group (106023)
- [x] User Authentication events
- [x] Wrapped in standard Syslog headers
- [x] IP/Port extraction logic
- [x] Malformed mnemonic detection
- [x] Adversarial message injection
- [x] High-volume traffic logging

## Tested Versions
- Cisco ASA 9.x
- Cisco Firepower (with ASA engine)
