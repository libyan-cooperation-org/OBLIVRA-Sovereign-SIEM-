import { createSignal, createMemo } from "solid-js";
import { api, type BackendRule } from "../services/api";

export interface SIEMRule {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  mitre: string;
  condition: string;
  threshold: number;
  window: number;
  responseAction: string;
  createdAt: Date;
  updatedAt: Date;
}

function fromBackend(r: BackendRule): SIEMRule {
  return {
    id: r.ID,
    name: r.Name,
    description: r.Description,
    severity: (r.Severity?.toLowerCase() ?? "medium") as SIEMRule["severity"],
    enabled: r.Enabled,
    mitre: r.MITRE ?? "",
    condition: r.Condition,
    threshold: r.Threshold ?? 1,
    window: r.Window ?? 60,
    responseAction: r.ResponseAction ?? "",
    createdAt: new Date(r.CreatedAt as any),
    updatedAt: new Date(r.UpdatedAt as any),
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [rules, setRules] = createSignal<SIEMRule[]>([]);
const [loading, setLoading] = createSignal(false);
const [filterEnabled, setFilterEnabled] = createSignal<boolean | "all">("all");

// ─── Derived ─────────────────────────────────────────────────────────────────
const filteredRules = createMemo(() =>
  filterEnabled() === "all"
    ? rules()
    : rules().filter(r => r.enabled === filterEnabled())
);

const enabledCount = createMemo(() => rules().filter(r => r.enabled).length);

// ─── Actions ─────────────────────────────────────────────────────────────────
const load = async (enabledOnly = false) => {
  setLoading(true);
  try {
    const raw = await api.listRules(enabledOnly);
    setRules(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

// Toggle a rule on/off — optimistically updates UI then persists to backend.
const toggleRule = async (id: string) => {
  // Optimistic update so the UI feels instant
  let nextEnabled = false;
  setRules(prev => prev.map(r => {
    if (r.id === id) {
      nextEnabled = !r.enabled;
      return { ...r, enabled: nextEnabled };
    }
    return r;
  }));
  // Persist to backend (hot-reloads detection engine automatically)
  try {
    await api.toggleRule(id, nextEnabled);
  } catch (err) {
    // Roll back on failure
    console.error("[rules] toggleRule failed:", err);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }
};

export const rulesStore = {
  rules,
  filteredRules,
  loading,
  filterEnabled, setFilterEnabled,
  enabledCount,
  load,
  toggleRule,
};
