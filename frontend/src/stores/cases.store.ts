import { createSignal, createMemo } from "solid-js";

export type CaseStatus = "open" | "investigating" | "resolved" | "closed";
export type CasePriority = "p1" | "p2" | "p3" | "p4";

export interface CaseEvidence {
  id: string;
  type: "log" | "pcap" | "file" | "screenshot" | "note";
  name: string;
  hash: string;
  timestamp: Date;
  addedBy: string;
}

export interface CaseEntry {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  alertIds: string[];
  evidence: CaseEvidence[];
  tags: string[];
  tlp: "red" | "amber" | "green" | "white";
}

const mockCases: CaseEntry[] = [
  {
    id: "c1", title: "APT Campaign – C2 Infrastructure", description: "Coordinated C2 beaconing detected across 3 hosts. Suspected nation-state actor.", status: "investigating", priority: "p1",
    assignee: "analyst01", createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 3600000), alertIds: ["a4", "a5"], tlp: "red",
    evidence: [
      { id: "e1", type: "pcap", name: "beacon_capture_2025.pcap", hash: "sha256:ab3f7e21...", timestamp: new Date(Date.now() - 7200000), addedBy: "analyst01" },
      { id: "e2", type: "log", name: "netflow_export.json", hash: "sha256:9c1d4f88...", timestamp: new Date(Date.now() - 5400000), addedBy: "analyst01" },
    ],
    tags: ["apt", "c2", "beaconing"]
  },
  {
    id: "c2", title: "Insider Threat – Privilege Abuse", description: "Dev account accessed production secrets outside normal hours.", status: "open", priority: "p2",
    assignee: "analyst02", createdAt: new Date(Date.now() - 172800000), updatedAt: new Date(Date.now() - 14400000), alertIds: ["a2", "a3"], tlp: "amber",
    evidence: [], tags: ["insider", "privilege"]
  },
  {
    id: "c3", title: "Honeytoken Triggered – Credential Theft", description: "Fake svc_backup credentials used. Active intruder on LAN.", status: "investigating", priority: "p1",
    assignee: "analyst01", createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(Date.now() - 1800000), alertIds: ["a7"], tlp: "red",
    evidence: [], tags: ["honeytoken", "credential-theft"]
  },
  {
    id: "c4", title: "SSH Brute Force – External IP", description: "Sustained brute force from known Shodan-indexed IP.", status: "resolved", priority: "p3",
    assignee: "analyst03", createdAt: new Date(Date.now() - 259200000), updatedAt: new Date(Date.now() - 86400000), alertIds: ["a1"], tlp: "green",
    evidence: [], tags: ["brute-force", "external"]
  },
];

const [cases, setCases] = createSignal<CaseEntry[]>(mockCases);
const [selectedCase, setSelectedCase] = createSignal<string | null>(null);
const [statusFilter, setStatusFilter] = createSignal<CaseStatus | "all">("all");

const filteredCases = createMemo(() => {
  return cases().filter(c => statusFilter() === "all" || c.status === statusFilter());
});

const getCase = (id: string) => cases().find(c => c.id === id);

export const casesStore = { cases, setCases, filteredCases, selectedCase, setSelectedCase, statusFilter, setStatusFilter, getCase };
