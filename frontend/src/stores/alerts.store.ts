import { createSignal, createMemo } from "solid-js";

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "open" | "acknowledged" | "resolved" | "false_positive";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  mitre: string[];
  timestamp: Date;
  count: number;
  assignee?: string;
}

const mockAlerts: Alert[] = [
  { id: "a1", title: "SSH Brute Force Detected", description: "Multiple failed SSH login attempts from 45.33.32.156", severity: "critical", status: "open", source: "syslog", mitre: ["T1110"], timestamp: new Date(Date.now() - 120000), count: 47, assignee: undefined },
  { id: "a2", title: "Privilege Escalation Attempt", description: "User 'dev01' attempted sudo to root without authorization", severity: "high", status: "open", source: "windows-event", mitre: ["T1548"], timestamp: new Date(Date.now() - 300000), count: 3 },
  { id: "a3", title: "Lateral Movement Indicator", description: "Pass-the-hash attempt detected on WORKSTATION-14", severity: "high", status: "acknowledged", source: "sysmon", mitre: ["T1550"], timestamp: new Date(Date.now() - 600000), count: 1 },
  { id: "a4", title: "C2 Beaconing Pattern", description: "Regular 60s interval connections to 203.0.113.42:443", severity: "critical", status: "open", source: "netflow", mitre: ["T1071"], timestamp: new Date(Date.now() - 900000), count: 120 },
  { id: "a5", title: "Data Exfiltration Attempt", description: "Unusual outbound transfer of 2.3GB to unknown host", severity: "high", status: "open", source: "netflow", mitre: ["T1041"], timestamp: new Date(Date.now() - 1800000), count: 1 },
  { id: "a6", title: "Failed Login Spike", description: "14 failed logins for 'admin' account in 60 seconds", severity: "medium", status: "resolved", source: "auth-log", mitre: ["T1078"], timestamp: new Date(Date.now() - 3600000), count: 14 },
  { id: "a7", title: "Honeytoken Accessed", description: "Fake credential 'svc_backup_legacy' used from 10.0.0.55", severity: "critical", status: "open", source: "deception", mitre: ["T1078"], timestamp: new Date(Date.now() - 60000), count: 1 },
  { id: "a8", title: "File Integrity Violation", description: "/etc/passwd modified outside maintenance window", severity: "high", status: "open", source: "fim", mitre: ["T1565"], timestamp: new Date(Date.now() - 7200000), count: 1 },
];

const [alerts, setAlerts] = createSignal<Alert[]>(mockAlerts);
const [filter, setFilter] = createSignal<Severity | "all">("all");
const [statusFilter, setStatusFilter] = createSignal<AlertStatus | "all">("all");
const [selected, setSelected] = createSignal<string | null>(null);

const filteredAlerts = createMemo(() => {
  return alerts().filter(a => {
    const sevOk = filter() === "all" || a.severity === filter();
    const stOk = statusFilter() === "all" || a.status === statusFilter();
    return sevOk && stOk;
  });
});

const acknowledge = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "acknowledged" } : a));
const resolve = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));

export const alertsStore = { alerts, filteredAlerts, filter, setFilter, statusFilter, setStatusFilter, selected, setSelected, acknowledge, resolve };
