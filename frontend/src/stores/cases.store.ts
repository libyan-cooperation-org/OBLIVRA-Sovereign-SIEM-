import { createSignal, createMemo } from "solid-js";
import { api, type BackendCase } from "../services/api";

export type CaseStatus = "open" | "in_progress" | "resolved" | "closed" | "investigating";

export interface CaseEntry {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  severity: string;
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  alertCount: number;
}

function fromBackend(c: BackendCase): CaseEntry {
  return {
    id: c.ID,
    title: c.Title,
    description: c.Description,
    status: (c.Status as CaseStatus) ?? "open",
    severity: c.Severity ?? "medium",
    assignee: c.Assignee ?? "",
    createdAt: new Date(c.CreatedAt),
    updatedAt: new Date(c.UpdatedAt),
    alertCount: c.AlertCount ?? 0,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [cases, setCases] = createSignal<CaseEntry[]>([]);
const [loading, setLoading] = createSignal(false);
const [selectedCase, setSelectedCase] = createSignal<string | null>(null);
const [statusFilter, setStatusFilter] = createSignal<CaseStatus | "all">("all");

// ─── Derived ──────────────────────────────────────────────────────────────────
const filteredCases = createMemo(() =>
  cases().filter(c => statusFilter() === "all" || c.status === statusFilter())
);

const getCase = (id: string) => cases().find(c => c.id === id);

// ─── Actions ──────────────────────────────────────────────────────────────────
const load = async (status = "") => {
  setLoading(true);
  try {
    const raw = await api.listCases(status, 200);
    setCases(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

const updateStatus = async (id: string, status: string) => {
  await api.updateCaseStatus(id, status);
  setCases(prev => prev.map(c => c.id === id ? { ...c, status: status as CaseStatus } : c));
};

export const casesStore = {
  cases,
  filteredCases,
  loading,
  selectedCase, setSelectedCase,
  statusFilter, setStatusFilter,
  getCase,
  load,
  updateStatus,
};
