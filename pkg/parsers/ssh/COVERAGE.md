# SSH Parser Coverage

## Supported Formats
- [x] OpenSSH Authentication Logs (BSD Syslog Wrapped)
- [x] OpenSSH Direct Messages

## Validated Scenarios
- [x] Successful Password Login
- [x] Successful PublicKey Login
- [x] Failed Password Login (existing user)
- [x] Failed Password Login (invalid user)
- [x] Connection Closed by Remote
- [x] Discovery/Banner Probe (preauth closure)
- [x] Malformed Headers
- [x] Adversarial Usernames (Injection attempts)
- [x] Multiversion (Legacy vs Modern OpenSSH strings)

## Tested Versions
- OpenSSH 7.x / 8.x / 9.x
- various distros (Debian, RHEL, Ubuntu, Alpine)
