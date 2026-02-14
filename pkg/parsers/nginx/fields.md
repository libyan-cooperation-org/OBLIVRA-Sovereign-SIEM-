# Nginx Log Field Mappings

## Access Logs (Combined)

| Log Field | OBLIVRA Field | Description |
|-----------|---------------|-------------|
| $remote_addr | Host | Client IP address |
| $remote_user | User | Remote authenticated user (-) |
| $time_local | Timestamp | Local server time |
| $request | Fields["request"] | Full HTTP request line |
| $status | Fields["status"] | HTTP response status code |
| $body_bytes_sent | Fields["bytes"] | Response size in bytes |
| $http_referer | Fields["referer"] | Referer header |
| $http_user_agent | Fields["agent"] | User agent string |

## Error Logs

| Log Field | OBLIVRA Field | Description |
|-----------|---------------|-------------|
| timestamp | Timestamp | Error timestamp |
| level | Fields["level"] | Error level (error, warn, etc.) |
| pid/tid | Fields["pid"] / Fields["tid"] | Process and Thread IDs |
| message | Message | Detailed error message |
| client | Fields["client"] | Client IP address |
| request | Fields["request"] | Related HTTP request |
