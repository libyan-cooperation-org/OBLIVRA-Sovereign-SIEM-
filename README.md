OBLIVRA — Sovereign SIEM

Illuminate the Invisible.

OBLIVRA is an offline-capable, forensic-grade Security Information and Event Management (SIEM) platform designed for sovereign, government, and high-integrity environments.

It combines high-performance log ingestion with cryptographic chain-of-custody guarantees.

✨ Key Features

⚡ 50K+ events/sec ingestion (commodity hardware)

🔍 SPL-inspired search with real-time visualization

🔒 Merkle-based tamper-evident log integrity

🧾 Evidence locker with chain-of-custody tracking

🌍 Offline-first & air-gap compatible

🧠 Built-in detection rules + MITRE ATT&CK mapping

🪤 Honeytokens & deception detection

🌐 Arabic (RTL) native support

🛰 Netflow/IPFIX network traffic analysis

🏗 Architecture

Receivers → Parsers → Enrichment → Storage → Detection → UI

Backend

Go 1.24+

BadgerDB (raw logs)

Bluge (search indexing)

SQLite (metadata)

Frontend

SolidJS + TypeScript

High-density SOC dashboard

3D infrastructure constellation

🚀 Quick Start

Build:

go build ./cmd/oblivera


Initialize:

./oblivera --init


Run:

./oblivera


Default endpoints:

Syslog (UDP/TCP): 514

HEC-compatible endpoint: 8088

Web UI: http://localhost:34115

🛡 Sovereign Principles

OBLIVRA is built under hostile assumptions:

Logs may be legally scrutinized

The OS may be compromised

Administrators may attempt tampering

Internet access may not exist

Integrity is cryptographically verifiable.
Air-gapped deployments are fully supported.

📦 Deployment Modes

Desktop (Wails native app)

Headless server mode

Edge collector (lightweight agent)

Air-gapped isolated networks

📜 License

Apache License 2.0 — see LICENSE.

👤 Author

Sanad Ali AbuKhshaim
Libyan Cooperation Organization (LCO)
