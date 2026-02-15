import { createSignal } from "solid-js";
import { api, type BackendSavedSearch } from "../services/api";

export interface HuntingQuery {
  id: string;
  name: string;
  query: string;
  createdBy: string;
  createdAt: Date;
}

function fromBackend(s: BackendSavedSearch): HuntingQuery {
  return {
    id: s.id,
    name: s.name,
    query: s.query,
    createdBy: s.created_by,
    createdAt: new Date(s.created_at as any),
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [queries, setQueries] = createSignal<HuntingQuery[]>([]);
const [loading, setLoading] = createSignal(false);
const [activeQuery, setActiveQuery] = createSignal<string | null>(null);
const [saving, setSaving] = createSignal(false);

// ─── Actions ─────────────────────────────────────────────────────────────────
const load = async () => {
  setLoading(true);
  try {
    const raw = await api.listSavedSearches();
    setQueries(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

const save = async (name: string, query: string): Promise<HuntingQuery | null> => {
  setSaving(true);
  try {
    const raw = await api.saveSearch(name, query);
    const entry = fromBackend(raw);
    setQueries(prev => [entry, ...prev]);
    return entry;
  } finally {
    setSaving(false);
  }
};

export const huntingStore = {
  queries,
  loading,
  saving,
  activeQuery, setActiveQuery,
  load,
  save,
};
