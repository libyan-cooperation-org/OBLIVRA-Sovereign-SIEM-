import { createSignal } from "solid-js";

export type AgentStatus = "online" | "offline" | "throttled" | "updating";

export interface Agent {
  id: string;
  name: string;
  host: string;
  ip: string;
  os: "windows" | "linux" | "macos";
  status: AgentStatus;
  version: string;
  eps: number;
  queueDepth: number;
  lastSeen: Date;
  protocol: "grpc" | "syslog" | "hec";
  tags: string[];
}

const mockAgents: Agent[] = [
  { id: "ag1", name: "DC-01-Collector", host: "dc-01.corp.local", ip: "10.0.0.10", os: "windows", status: "online", version: "2.4.1", eps: 847, queueDepth: 12, lastSeen: new Date(), protocol: "grpc", tags: ["domain-controller", "critical"] },
  { id: "ag2", name: "Web-Nginx-01", host: "web-01.corp.local", ip: "10.0.1.5", os: "linux", status: "online", version: "2.4.1", eps: 1203, queueDepth: 0, lastSeen: new Date(), protocol: "grpc", tags: ["web", "dmz"] },
  { id: "ag3", name: "DB-Postgres-02", host: "db-02.corp.local", ip: "10.0.2.12", os: "linux", status: "throttled", version: "2.3.8", eps: 342, queueDepth: 89, lastSeen: new Date(Date.now() - 30000), protocol: "grpc", tags: ["database", "sensitive"] },
  { id: "ag4", name: "FW-Edge-Collector", host: "fw-edge.corp.local", ip: "10.0.0.1", os: "linux", status: "online", version: "2.4.1", eps: 5621, queueDepth: 3, lastSeen: new Date(), protocol: "syslog", tags: ["firewall", "critical"] },
  { id: "ag5", name: "WS-Sales-Batch", host: "ws-sales-01.corp.local", ip: "192.168.10.42", os: "windows", status: "offline", version: "2.2.0", eps: 0, queueDepth: 0, lastSeen: new Date(Date.now() - 900000), protocol: "grpc", tags: ["workstation"] },
  { id: "ag6", name: "Mail-Exchange-01", host: "mail.corp.local", ip: "10.0.3.7", os: "windows", status: "updating", version: "2.4.0", eps: 0, queueDepth: 245, lastSeen: new Date(Date.now() - 60000), protocol: "grpc", tags: ["mail", "critical"] },
];

const [agents, setAgents] = createSignal<Agent[]>(mockAgents);
const [selectedAgent, setSelectedAgent] = createSignal<string | null>(null);

const totalEPS = () => agents().reduce((sum, a) => sum + a.eps, 0);
const onlineCount = () => agents().filter(a => a.status === "online").length;
const offlineCount = () => agents().filter(a => a.status === "offline").length;

export const agentsStore = { agents, setAgents, selectedAgent, setSelectedAgent, totalEPS, onlineCount, offlineCount };
