# Windows Sysmon Field Mappings

| Sysmon XML Data Name | OBLIVRA Field | Description |
|----------------------|---------------|-------------|
| Image | Fields["Image"] | Full path of the process image |
| CommandLine | Fields["CommandLine"] | Full command line for process events |
| SourceIp | Fields["SourceIp"] | Source IP for network events |
| DestinationIp | Fields["DestinationIp"] | Destination IP for network events |
| DestinationPort | Fields["DestinationPort"] | Target port |
| User | User | User who initiated the event |
| QueryName | Fields["QueryName"] | DNS query name |
| QueryResults | Fields["QueryResults"] | DNS query results |

## Sysmon Event IDs

| ID | Category | Message Format |
|----|----------|----------------|
| 1 | PROCESS | Process Created: [Image] |
| 3 | NETWORK | Network Connect: [Src] -> [Dst]:[Port] |
| 7 | IMAGE_LOAD | Image Loaded: [ImageLoaded] into [Image] |
| 8 | THREAD_INJECTION | CreateRemoteThread: [SourceImage] -> [TargetImage] |
| 10 | PROCESS_ACCESS | Process Access: [SourceImage] -> [TargetImage] |
| 11 | FILE | File Created: [TargetFilename] |
| 22 | DNS | DNS Query: [QueryName] -> [Results] |
