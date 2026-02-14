# Nginx Parser Coverage

## Supported Formats
- [x] Nginx Access (Combined Log Format)
- [x] Nginx Error (Standard Format)

## Validated Scenarios
- [x] 200 OK / 404 Not Found / 500 Internal Server Error
- [x] Custom User Agents (Scanners, Bots, Mobile)
- [x] Empty fields (hyphen `-` handling)
- [x] Malformed request lines
- [x] Error logs with/without client/request info
- [x] Adversarial injection in User-Agent and Referer
- [x] Multi-line error logs (partial support)

## Tested Versions
- Nginx 1.18.x
- Nginx 1.2x (Mainline)
- OpenResty variants
