# Windows Sysmon Parser Coverage

## Supported Formats
- [x] Microsoft-Windows-Sysmon/Operational XML

## Validated Scenarios
- [x] Process Creation (ID 1)
- [x] Network Connection (ID 3)
- [x] Image Load (ID 7)
- [x] CreateRemoteThread (ID 8) - critical for memory injection detection
- [x] Process Access (ID 10) - LSASS dump attempts
- [x] File Creation (ID 11)
- [x] DNS Query (ID 22) - C2 domain detection
- [x] Multi-SDID and large XML
- [x] Adversarial XML payloads

## Tested Sysmon Versions
- Sysmon v13.x
- Sysmon v14.x
- Sysmon v15.x
