import { createSignal, createMemo } from "solid-js";
import { api, type BackendAlert } from "../services/api";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type AlertStatus = "open" | "acknowledged" | "resolved" | "false_positive" | "investigating";

// Normalise the backend shape to what the UI expects
export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  host: string;
  mitre: string;
  timestamp: Date;
  assignee: string;
}

function fromBackend(a: BackendAlert): Alert {
  return {
    id: a.id,
    title: a.title,
    description: a.summary,
    severity: (a.severity?.toUpperCase() ?? "INFO") as Severity,
    status: (a.status as AlertStatus) ?? "open",
    source: a.rule_id,
    host: a.host,
    mitre: a.metadata?.mitre_id ?? "",
    timestamp: new Date(a.timestamp),
    assignee: a.assignee ?? "",
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [alerts, setAlerts] = createSignal<Alert[]>([]);
const [loading, setLoading] = createSignal(false);
const [filter, setFilter] = createSignal<Severity | "all">("all");
const [statusFilter, setStatusFilter] = createSignal<AlertStatus | "all">("all");
const [selected, setSelected] = createSignal<string | null>(null);

// ─── Derived ──────────────────────────────────────────────────────────────────
const filteredAlerts = createMemo(() =>
  alerts().filter(a => {
    const sevOk = filter() === "all" || a.severity === filter();
    const stOk = statusFilter() === "all" || a.status === statusFilter();
    return sevOk && stOk;
  })
);

// ─── Actions ──────────────────────────────────────────────────────────────────
const load = async (status = "", severity = "") => {
  setLoading(true);
  try {
    const raw = await api.listAlerts(status, severity, 200);
    setAlerts(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

const acknowledge = async (id: string) => {
  await api.updateAlertStatus(id, "acknowledged", "");
  setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "acknowledged" } : a));
};

const resolve = async (id: string) => {
  await api.updateAlertStatus(id, "resolved", "");
  setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));
};

const assign = async (id: string, assignee: string) => {
  const a = alerts().find(x => x.id === id);
  if (!a) return;
  await api.updateAlertStatus(id, a.status, assignee);
  setAlerts(prev => prev.map(x => x.id === id ? { ...x, assignee } : x));
};

export const alertsStore = {
  alerts,
  filteredAlerts,
  loading,
  filter, setFilter,
  statusFilter, setStatusFilter,
  selected, setSelected,
  load,
  acknowledge,
  resolve,
  assign,
};
