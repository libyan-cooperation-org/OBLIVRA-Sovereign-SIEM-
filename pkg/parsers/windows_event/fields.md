# Windows Event Log Field Mappings

| Windows XML Path | OBLIVRA Field | Description |
|------------------|---------------|-------------|
| System/EventID | Fields["event_id"] | Windows Event ID |
| System/Computer | Host | The computer name |
| System/Security/@UserID | User | Security ID (SID) |
| System/Level | Severity | Mapped severity level |
| System/Channel | Category | Log source (Security, System, etc.) |
| EventData/Data[@Name='SubjectUserName'] | Fields["SubjectUserName"] | Extracted from Data nodes |
| EventData/Data[@Name='TargetUserName'] | Fields["TargetUserName"] | Extracted from Data nodes |
| EventData/Data[@Name='ProcessName'] | Fields["ProcessName"] | Extracted from Data nodes |

## Common Event ID Mappings

| ID | Description |
|----|-------------|
| 4624 | Successful Logon |
| 4625 | Failed Logon |
| 4648 | Logon using explicit credentials |
| 4672 | Special privileges assigned to new logon |
| 4688 | A new process has been created |
| 1102 | Audit log was cleared |
| 4720 | A user account was created |
