import { createSignal } from "solid-js";

// ─── Alert Store ───────────────────────────────────────────────
export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export interface Alert {
  id: string;
  title: string;
  source: string;
  severity: AlertSeverity;
  timestamp: string;
  status: "open" | "investigating" | "resolved" | "false_positive";
  mitre: string;
  count: number;
}

const [alerts, setAlerts] = createSignal<Alert[]>([
  { id: "a1", title: "SSH Brute Force Detected", source: "10.0.0.45", severity: "critical", timestamp: new Date(Date.now() - 120000).toISOString(), status: "open", mitre: "T1110", count: 247 },
  { id: "a2", title: "Privilege Escalation Attempt", source: "srv-dc-01", severity: "high", timestamp: new Date(Date.now() - 300000).toISOString(), status: "investigating", mitre: "T1068", count: 3 },
  { id: "a3", title: "Lateral Movement Detected", source: "ws-finance-12", severity: "high", timestamp: new Date(Date.now() - 600000).toISOString(), status: "open", mitre: "T1021", count: 12 },
  { id: "a4", title: "Unusual Login Hours", source: "user:admin_bk", severity: "medium", timestamp: new Date(Date.now() - 900000).toISOString(), status: "open", mitre: "T1078", count: 1 },
  { id: "a5", title: "Beaconing Pattern Found", source: "192.168.1.201", severity: "high", timestamp: new Date(Date.now() - 1800000).toISOString(), status: "open", mitre: "T1071", count: 88 },
  { id: "a6", title: "File Integrity Violation", source: "/etc/passwd", severity: "critical", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "resolved", mitre: "T1565", count: 1 },
  { id: "a7", title: "DNS Tunneling Suspected", source: "8.8.4.4", severity: "medium", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "open", mitre: "T1572", count: 34 },
  { id: "a8", title: "New Admin Account Created", source: "srv-ad-01", severity: "low", timestamp: new Date(Date.now() - 14400000).toISOString(), status: "resolved", mitre: "T1136", count: 1 },
]);
const [alertFilter, setAlertFilter] = createSignal<"all" | AlertSeverity | "open" | "resolved">("all");
export const alertStore = { alerts, setAlerts, alertFilter, setAlertFilter };

// ─── Case Store ────────────────────────────────────────────────
export interface Case {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: "open" | "in_progress" | "resolved" | "closed";
  assignee: string;
  created: string;
  updated: string;
  alertCount: number;
  description: string;
}

const [cases, setCases] = createSignal<Case[]>([
  { id: "c1", title: "APT Campaign - Finance Segment", severity: "critical", status: "in_progress", assignee: "Sanad Ali", created: new Date(Date.now() - 86400000).toISOString(), updated: new Date(Date.now() - 3600000).toISOString(), alertCount: 14, description: "Suspected APT group targeting finance department workstations." },
  { id: "c2", title: "SSH Brute Force Wave", severity: "high", status: "open", assignee: "Unassigned", created: new Date(Date.now() - 7200000).toISOString(), updated: new Date(Date.now() - 120000).toISOString(), alertCount: 3, description: "Coordinated brute force against multiple SSH endpoints." },
  { id: "c3", title: "Insider Threat Investigation", severity: "medium", status: "in_progress", assignee: "SOC Lead", created: new Date(Date.now() - 172800000).toISOString(), updated: new Date(Date.now() - 86400000).toISOString(), alertCount: 6, description: "Anomalous data access patterns from privileged account." },
  { id: "c4", title: "Malware Containment - WS-08", severity: "critical", status: "resolved", assignee: "Sanad Ali", created: new Date(Date.now() - 259200000).toISOString(), updated: new Date(Date.now() - 172800000).toISOString(), alertCount: 22, description: "Ransomware variant contained on workstation WS-08." },
]);
export const caseStore = { cases, setCases };

// ─── Agent Store ───────────────────────────────────────────────
export interface Agent {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  status: "online" | "offline" | "throttled";
  version: string;
  eps: number;
  lastSeen: string;
  protocol: "grpc" | "http";
}

const [agents, setAgents] = createSignal<Agent[]>([
  { id: "ag1", hostname: "srv-dc-01", ip: "10.0.0.10", os: "Windows Server 2022", status: "online", version: "2.1.4", eps: 1240, lastSeen: new Date().toISOString(), protocol: "grpc" },
  { id: "ag2", hostname: "srv-web-02", ip: "10.0.0.11", os: "Ubuntu 22.04", status: "online", version: "2.1.4", eps: 340, lastSeen: new Date().toISOString(), protocol: "grpc" },
  { id: "ag3", hostname: "ws-finance-12", ip: "192.168.10.42", os: "Windows 11", status: "throttled", version: "2.0.9", eps: 12, lastSeen: new Date(Date.now() - 60000).toISOString(), protocol: "grpc" },
  { id: "ag4", hostname: "fw-perimeter", ip: "10.0.0.1", os: "FortiOS 7.4", status: "online", version: "2.1.3", eps: 890, lastSeen: new Date().toISOString(), protocol: "http" },
  { id: "ag5", hostname: "srv-db-03", ip: "10.0.0.20", os: "RHEL 9", status: "offline", version: "2.0.1", eps: 0, lastSeen: new Date(Date.now() - 3600000).toISOString(), protocol: "grpc" },
]);
export const agentStore = { agents, setAgents };

// ─── Search Store ──────────────────────────────────────────────
export interface LogEvent {
  id: string;
  timestamp: string;
  source: string;
  level: "CRITICAL" | "ERROR" | "WARN" | "INFO" | "DEBUG";
  message: string;
  host: string;
  fields: Record<string, string>;
}

const [searchQuery, setSearchQuery] = createSignal("");
const [searchResults, setSearchResults] = createSignal<LogEvent[]>([]);
const [searchLoading, setSearchLoading] = createSignal(false);
const [timeRange, setTimeRange] = createSignal("1h");
export const searchStore = { searchQuery, setSearchQuery, searchResults, setSearchResults, searchLoading, setSearchLoading, timeRange, setTimeRange };

// ─── Dashboard Store ───────────────────────────────────────────
const [epsHistory, setEpsHistory] = createSignal<number[]>([1200, 1450, 1100, 1800, 2100, 1600, 1900, 2400, 2200, 1800, 2600, 3100, 2800, 2400, 2900]);
const [totalEvents, setTotalEvents] = createSignal(4827341);
const [activeAlertCount, setActiveAlertCount] = createSignal(6);
const [riskScore, setRiskScore] = createSignal(73);
export const dashboardStore = { epsHistory, setEpsHistory, totalEvents, setTotalEvents, riskScore, setRiskScore, activeAlertCount, setActiveAlertCount };

// ─── Asset Store ───────────────────────────────────────────────
export interface Asset {
  id: string;
  hostname: string;
  ip: string;
  type: "server" | "workstation" | "firewall" | "router" | "iot";
  criticality: "crown_jewel" | "high" | "medium" | "low";
  os: string;
  owner: string;
  lastSeen: string;
}

const [assets, setAssets] = createSignal<Asset[]>([
  { id: "as1", hostname: "srv-dc-01", ip: "10.0.0.10", type: "server", criticality: "crown_jewel", os: "Windows Server 2022", owner: "IT Infrastructure", lastSeen: new Date().toISOString() },
  { id: "as2", hostname: "srv-db-03", ip: "10.0.0.20", type: "server", criticality: "crown_jewel", os: "RHEL 9", owner: "Database Team", lastSeen: new Date().toISOString() },
  { id: "as3", hostname: "fw-perimeter", ip: "10.0.0.1", type: "firewall", criticality: "high", os: "FortiOS 7.4", owner: "Network Team", lastSeen: new Date().toISOString() },
  { id: "as4", hostname: "ws-finance-12", ip: "192.168.10.42", type: "workstation", criticality: "high", os: "Windows 11", owner: "Finance", lastSeen: new Date(Date.now() - 60000).toISOString() },
  { id: "as5", hostname: "iot-cam-01", ip: "192.168.20.5", type: "iot", criticality: "low", os: "Embedded Linux", owner: "Physical Security", lastSeen: new Date(Date.now() - 3600000).toISOString() },
]);
export const assetStore = { assets, setAssets };

// ─── Settings Store ────────────────────────────────────────────
const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
const [notificationsEnabled, setNotificationsEnabled] = createSignal(true);
const [currentLang, setCurrentLang] = createSignal<"en" | "ar">("en");
export const settingsStore = { sidebarCollapsed, setSidebarCollapsed, notificationsEnabled, setNotificationsEnabled, currentLang, setCurrentLang };

// ─── Live Tail Store ───────────────────────────────────────────
const [liveLogs, setLiveLogs] = createSignal<LogEvent[]>([]);
const [liveRunning, setLiveRunning] = createSignal(false);
export const liveTailStore = { liveLogs, setLiveLogs, liveRunning, setLiveRunning };

// ─── Hunting Store ─────────────────────────────────────────────
export interface Hypothesis {
  id: string;
  title: string;
  status: "open" | "proven" | "disproven";
  created: string;
  query: string;
}
const [hypotheses, setHypotheses] = createSignal<Hypothesis[]>([
  { id: "h1", title: "Attacker using LOLBins for persistence", status: "open", created: new Date(Date.now() - 86400000).toISOString(), query: 'process="powershell.exe" args="*-EncodedCommand*"' },
  { id: "h2", title: "Lateral movement via WMI", status: "proven", created: new Date(Date.now() - 172800000).toISOString(), query: 'event_id=4624 logon_type=3 src_ip!="10.0.0.*"' },
]);
export const huntingStore = { hypotheses, setHypotheses };

// ─── Forensics Store ───────────────────────────────────────────
export interface Evidence {
  id: string;
  name: string;
  type: string;
  collectedAt: string;
  size: string;
  hash: string;
}
const [evidence, setEvidence] = createSignal<Evidence[]>([
  { id: "EV-9921", name: "memdump_svc_host_312.raw", type: "Memory Dump", collectedAt: "2024-02-14 10:22", size: "2.4 GB", hash: "SHA256: e3b0c442..." },
  { id: "EV-8842", name: "disk_img_ws_finance_12.vhdx", type: "Disk Image", collectedAt: "2024-02-13 15:44", size: "8.1 GB", hash: "SHA256: a4f8...d921" },
]);
const [merkleRoot, setMerkleRoot] = createSignal("0x7f8821aa9901bc22d109f7a8b6c5d4e3d82d5d6d");
export const forensicsStore = { evidence, setEvidence, merkleRoot, setMerkleRoot };

// ─── Netflow Store ─────────────────────────────────────────────
export interface Flow {
  id: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  bytes: number;
  packets: number;
  timestamp: string;
}
const [flows, setFlows] = createSignal<Flow[]>([
  { id: "f1", srcIp: "10.0.0.45", dstIp: "185.220.101.34", srcPort: 54321, dstPort: 443, protocol: "TCP", bytes: 2457600, packets: 1820, timestamp: new Date().toISOString() },
  { id: "f2", srcIp: "10.0.0.10", dstIp: "10.0.0.20", srcPort: 1433, dstPort: 1433, protocol: "TCP", bytes: 8192000, packets: 5600, timestamp: new Date().toISOString() },
]);
export const netflowStore = { flows, setFlows };

// ─── Global notification store ────────────────────────────────
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}
const [toasts, setToasts] = createSignal<Toast[]>([]);
export const addToast = (toast: Omit<Toast, "id">) => {
  const id = Math.random().toString(36).slice(2);
  setToasts(t => [...t, { ...toast, id }]);
  setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
};
export const toastStore = { toasts, setToasts, addToast };
