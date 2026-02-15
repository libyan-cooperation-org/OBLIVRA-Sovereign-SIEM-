package ingestion

// Netflow ingestion is handled by the dedicated internal/netflow.Collector,
// which listens on UDP port 2055 and feeds events directly into the ingestion
// pipeline via Manager.Ingest. This file is intentionally empty — StartNetflowServer
// was removed to avoid binding port 2055 twice.
