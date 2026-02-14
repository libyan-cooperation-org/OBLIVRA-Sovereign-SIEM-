# Windows Event Log Parser Coverage

## Supported Formats
- [x] Standard Windows Event XML (EVT/EVTX Rendered XML)

## Validated Scenarios
- [x] Successful Logon (4624) - interactive and network
- [x] Failed Logon (4625)
- [x] Process Creation (4688) with Command Line
- [x] Special Privilege Logon (4672)
- [x] Service Install/Start/Stop
- [x] Audit Log Clearing (1102)
- [x] Malformed XML (graceful failure)
- [x] Adversarial XML (Injection attempts)
- [x] Large EventData blocks

## Tested Windows Versions
- Windows Server 2016/2019/2022
- Windows 10/11
