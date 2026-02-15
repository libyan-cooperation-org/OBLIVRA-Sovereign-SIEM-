import { createSignal } from "solid-js";
import { api, type BackendEvent } from "../services/api";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface SearchResult {
  id: string;
  timestamp: Date;
  source: string;
  level: LogLevel;
  host: string;
  user: string;
  message: string;
  fields: Record<string, any>;
}

function fromBackend(e: BackendEvent): SearchResult {
  return {
    id: e.id,
    timestamp: new Date(e.timestamp),
    source: e.source,
    level: (e.severity?.toUpperCase() ?? "INFO") as LogLevel,
    host: e.host,
    user: e.user,
    message: e.message,
    fields: e.fields ?? {},
  };
}

// Predefined time ranges → nanosecond offsets from now
const TIME_RANGES: Record<string, number> = {
  "15m": 15 * 60,
  "1h":  60 * 60,
  "6h":  6 * 60 * 60,
  "24h": 24 * 60 * 60,
  "7d":  7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
};

// ─── State ────────────────────────────────────────────────────────────────────
const [query, setQuery] = createSignal("");
const [results, setResults] = createSignal<SearchResult[]>([]);
const [loading, setLoading] = createSignal(false);
const [selectedResult, setSelectedResult] = createSignal<string | null>(null);
const [timeRange, setTimeRange] = createSignal("1h");
const [sourceFilter, setSourceFilter] = createSignal("");
const [hostFilter, setHostFilter] = createSignal("");
const [severityFilter, setSeverityFilter] = createSignal("");

// ─── Actions ──────────────────────────────────────────────────────────────────
const executeSearch = async (q?: string) => {
  const text = q ?? query();
  setLoading(true);
  try {
    const nowNs = Date.now() * 1_000_000;
    const rangeSeconds = TIME_RANGES[timeRange()] ?? 3600;
    const startNs = (Date.now() - rangeSeconds * 1000) * 1_000_000;

    const raw = await api.searchEvents(
      text,
      sourceFilter(),
      hostFilter(),
      severityFilter(),
      startNs,
      nowNs,
      500
    );
    setResults(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

export const searchStore = {
  query, setQuery,
  results,
  loading,
  selectedResult, setSelectedResult,
  timeRange, setTimeRange,
  sourceFilter, setSourceFilter,
  hostFilter, setHostFilter,
  severityFilter, setSeverityFilter,
  executeSearch,
};
