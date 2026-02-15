import { createSignal } from "solid-js";
import { api } from "../services/api";

export interface ThreatFeedItem {
  id: string;
  type: "ip" | "domain" | "hash" | "cve";
  indicator: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: Date;
  description: string;
}

export interface GeoEvent {
  lat: number;
  lng: number;
  country: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
}

// ─── Static display data (no backend yet) ─────────────────────────────────────
export const threatFeed: ThreatFeedItem[] = [
  { id: "t1", type: "ip", indicator: "45.33.32.156", source: "OTX", severity: "critical", timestamp: new Date(Date.now() - 60000), description: "Active C2 server, Cobalt Strike" },
  { id: "t2", type: "domain", indicator: "update-cdn-secure.net", source: "VirusTotal", severity: "high", timestamp: new Date(Date.now() - 300000), description: "Malware distribution domain" },
  { id: "t3", type: "hash", indicator: "d41d8cd98f00b204...", source: "Internal", severity: "medium", timestamp: new Date(Date.now() - 600000), description: "Ransomware sample" },
  { id: "t4", type: "cve", indicator: "CVE-2025-1234", source: "NVD", severity: "critical", timestamp: new Date(Date.now() - 900000), description: "RCE in OpenSSL 3.x" },
  { id: "t5", type: "ip", indicator: "203.0.113.42", source: "STIX", severity: "high", timestamp: new Date(Date.now() - 1200000), description: "Known APT infrastructure" },
];

export const geoEvents: GeoEvent[] = [
  { lat: 55.7558, lng: 37.6173, country: "Russia", count: 847, severity: "critical" },
  { lat: 39.9042, lng: 116.4074, country: "China", count: 423, severity: "high" },
  { lat: 38.9072, lng: -77.0369, country: "USA", count: 201, severity: "low" },
  { lat: 51.5074, lng: -0.1278, country: "UK", count: 89, severity: "medium" },
  { lat: 35.6762, lng: 139.6503, country: "Japan", count: 34, severity: "low" },
  { lat: 32.8872, lng: 13.1913, country: "Libya", count: 12, severity: "low" },
];

// ─── Live signals ─────────────────────────────────────────────────────────────
const [epsHistory, setEpsHistory] = createSignal<number[]>(
  Array.from({ length: 60 }, () => Math.floor(Math.random() * 8000 + 2000))
);
const [riskScore, setRiskScore] = createSignal(73);
const [alertCounts, setAlertCounts] = createSignal<Record<string, number>>({});
const [mitreMatrix, setMitreMatrix] = createSignal<Array<{ tactic: string; covered: number }>>([]);

// Simulated live EPS (replaced with real ingestion telemetry when that lands)
setInterval(() => {
  setEpsHistory(prev => [...prev.slice(1), Math.floor(Math.random() * 8000 + 2000)]);
}, 2000);

// ─── Load from backend ────────────────────────────────────────────────────────
const load = async () => {
  try {
    const counts = await api.getAlertCounts();
    setAlertCounts(counts);

    // Derive a simple risk score from open critical + high counts
    const crit = counts["CRITICAL"] ?? 0;
    const high = counts["HIGH"] ?? 0;
    const score = Math.min(100, 40 + crit * 15 + high * 5);
    setRiskScore(score);
  } catch { /* use defaults */ }

  try {
    const coverage = await api.getComplianceCoverage();
    setMitreMatrix(
      Object.entries(coverage).map(([tactic, covered]) => ({ tactic, covered: covered as number }))
    );
  } catch { /* use defaults */ }
};

export const dashboardStore = {
  epsHistory,
  riskScore,
  alertCounts,
  mitreMatrix,
  threatFeed,
  geoEvents,
  load,
};
