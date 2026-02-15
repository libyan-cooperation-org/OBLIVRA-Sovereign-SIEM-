import { createSignal, createMemo } from "solid-js";
import { api, type BackendAgent } from "../services/api";

export type AgentStatus = "online" | "offline" | "throttled" | "updating";

export interface Agent {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  version: string;
  status: AgentStatus;
  eps: number;
  protocol: string;
  lastSeen: Date;
}

function fromBackend(a: BackendAgent): Agent {
  return {
    id: a.ID,
    hostname: a.Hostname,
    ip: a.IP,
    os: a.OS,
    version: a.Version,
    status: (a.Status as AgentStatus) ?? "offline",
    eps: a.EPS ?? 0,
    protocol: a.Protocol ?? "grpc",
    lastSeen: new Date(a.LastSeen),
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [agents, setAgents] = createSignal<Agent[]>([]);
const [loading, setLoading] = createSignal(false);
const [selectedAgent, setSelectedAgent] = createSignal<string | null>(null);

// ─── Derived ──────────────────────────────────────────────────────────────────
const totalEPS = createMemo(() => agents().reduce((s, a) => s + a.eps, 0));
const onlineCount = createMemo(() => agents().filter(a => a.status === "online").length);
const offlineCount = createMemo(() => agents().filter(a => a.status === "offline").length);

// ─── Actions ──────────────────────────────────────────────────────────────────
const load = async () => {
  setLoading(true);
  try {
    const raw = await api.listAgents();
    setAgents(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

export const agentsStore = {
  agents,
  loading,
  selectedAgent, setSelectedAgent,
  totalEPS,
  onlineCount,
  offlineCount,
  load,
};
