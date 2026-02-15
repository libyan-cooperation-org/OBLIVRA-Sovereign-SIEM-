/**
 * api.ts — Wails IPC bridge for OBLIVRA Sovereign SIEM
 *
 * All backend calls go through this file. In Wails, Go methods are exposed
 * on `window.go.app.App.*`. We import the generated bindings directly for
 * type-safety, and fall back gracefully when running outside Wails (e.g.
 * plain browser dev server with `vite dev`).
 *
 * Shape rule: this file owns the raw backend types. Stores normalise them
 * into UI-friendly shapes via `fromBackend()` functions.
 */

import * as WailsApp from "../wailsjs/go/app/App";
import type {
  models,
  sqlitestore,
  storage,
  graph,
} from "../wailsjs/go/models";

// ─── Re-exported backend shapes (used by stores as `BackendX`) ───────────────

export type BackendEvent  = models.Event;
export type BackendAlert  = models.Alert;
export type BackendSavedSearch = models.SavedSearch;

export type BackendCase   = sqlitestore.CaseRecord;
export type BackendAgent  = sqlitestore.AgentRecord;
export type BackendAsset  = sqlitestore.AssetRecord;
export type BackendRule   = sqlitestore.RuleRecord;
export type BackendAudit  = sqlitestore.AuditRecord;
export type BackendUser   = sqlitestore.UserRecord;

export type BackendStorageStats = storage.StorageStats;
export type BackendGraph  = graph.Graph;

// Types for new backend methods (not in auto-generated models yet)
export interface BackendFIMWatch {
  path: string;
  description: string;
  recursive: boolean;
  created_at: string | Date;
}

export interface BackendHoneytoken {
  id: string;
  type: string;
  value: string;
  description: string;
  created_at: string | Date;
}

export interface BackendIntegrityBlock {
  id: number;
  root_hash: string;
  prev_hash: string;
  event_count: number;
  timestamp: string | Date;
  signature: string;
}

export interface BackendNetflowFlow {
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  bytes: number;
  packets: number;
}

// ─── API Surface ─────────────────────────────────────────────────────────────

function guard<T>(call: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return call().catch((err) => {
      console.warn("[api] call failed:", err);
      return fallback;
    });
  } catch {
    return Promise.resolve(fallback);
  }
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────
  login: (username: string, password: string): Promise<boolean> =>
    guard(() => WailsApp.Login(username, password), false),

  logout: (): Promise<void> =>
    guard(() => WailsApp.Logout(), undefined as void),

  getCurrentUser: (): Promise<BackendUser | null> =>
    guard(() => WailsApp.GetCurrentUser() as Promise<BackendUser>, null as any),

  // ── Events / Search ─────────────────────────────────────────────────────
  searchEvents: (
    text: string,
    source: string,
    host: string,
    severity: string,
    startNano: number,
    endNano: number,
    limit: number
  ): Promise<BackendEvent[]> =>
    guard(
      () => WailsApp.SearchEvents(text, source, host, severity, startNano, endNano, limit) as Promise<BackendEvent[]>,
      []
    ),

  // ── Alerts ──────────────────────────────────────────────────────────────
  listAlerts: (status: string, severity: string, limit: number): Promise<BackendAlert[]> =>
    guard(() => WailsApp.ListAlerts(status, severity, limit) as Promise<BackendAlert[]>, []),

  updateAlertStatus: (id: string, status: string, assignee: string): Promise<void> =>
    guard(() => WailsApp.UpdateAlertStatus(id, status, assignee), undefined as void),

  getAlertCounts: (): Promise<Record<string, number>> =>
    guard(() => WailsApp.GetAlertCounts() as Promise<Record<string, number>>, {}),

  getAlertGraph: (alertId: string): Promise<BackendGraph> =>
    guard(() => WailsApp.GetAlertGraph(alertId) as Promise<BackendGraph>, { nodes: [], edges: [] } as BackendGraph),

  // ── Cases ────────────────────────────────────────────────────────────────
  listCases: (status: string, limit: number): Promise<BackendCase[]> =>
    guard(() => WailsApp.ListCases(status, limit) as Promise<BackendCase[]>, []),

  updateCaseStatus: (id: string, status: string): Promise<void> =>
    guard(() => WailsApp.UpdateCaseStatus(id, status), undefined as void),

  // ── Assets ───────────────────────────────────────────────────────────────
  listAssets: (limit: number): Promise<BackendAsset[]> =>
    guard(() => WailsApp.ListAssets(limit) as Promise<BackendAsset[]>, []),

  // ── Agents ───────────────────────────────────────────────────────────────
  listAgents: (): Promise<BackendAgent[]> =>
    guard(() => WailsApp.ListAgents() as Promise<BackendAgent[]>, []),

  // ── Rules ────────────────────────────────────────────────────────────────
  listRules: (enabledOnly: boolean): Promise<BackendRule[]> =>
    guard(() => WailsApp.ListRules(enabledOnly) as Promise<BackendRule[]>, []),

  // ── Forensics ────────────────────────────────────────────────────────────
  addEvidence: (caseId: string, eventId: string, reason: string): Promise<void> =>
    guard(() => WailsApp.AddEvidence(caseId, eventId, reason), undefined as void),

  generateReport: (caseId: string): Promise<string> =>
    guard(() => WailsApp.GenerateReport(caseId), ""),

  listAuditLogs: (limit: number): Promise<BackendAudit[]> =>
    guard(() => WailsApp.ListAuditLogs(limit) as Promise<BackendAudit[]>, []),

  // ── Hunting ──────────────────────────────────────────────────────────────
  listSavedSearches: (): Promise<BackendSavedSearch[]> =>
    guard(() => WailsApp.ListSavedSearches() as Promise<BackendSavedSearch[]>, []),

  saveSearch: (name: string, query: string): Promise<BackendSavedSearch> =>
    guard(
      () => WailsApp.SaveSearch(name, query) as Promise<BackendSavedSearch>,
      { id: "", name, query, created_by: "", created_at: new Date() } as BackendSavedSearch
    ),

  // ── Compliance ───────────────────────────────────────────────────────────
  getComplianceCoverage: (): Promise<Record<string, number>> =>
    guard(() => WailsApp.GetComplianceCoverage() as Promise<Record<string, number>>, {}),

  // ── FIM ──────────────────────────────────────────────────────────────────
  listFIMWatchlist: (): Promise<BackendFIMWatch[]> =>
    guard(() => (WailsApp as any).ListFIMWatchlist() as Promise<BackendFIMWatch[]>, []),

  addFIMWatch: (path: string, description: string, recursive: boolean): Promise<void> =>
    guard(() => (WailsApp as any).AddFIMWatch(path, description, recursive), undefined as void),

  removeFIMWatch: (path: string): Promise<void> =>
    guard(() => (WailsApp as any).RemoveFIMWatch(path), undefined as void),

  listFIMEvents: (limit: number): Promise<BackendAlert[]> =>
    guard(() => (WailsApp as any).ListFIMEvents(limit) as Promise<BackendAlert[]>, []),

  // ── Deception ────────────────────────────────────────────────────────────
  listHoneytokens: (): Promise<BackendHoneytoken[]> =>
    guard(() => (WailsApp as any).ListHoneytokens() as Promise<BackendHoneytoken[]>, []),

  addHoneytoken: (tokenType: string, value: string, description: string): Promise<void> =>
    guard(() => (WailsApp as any).AddHoneytoken(tokenType, value, description), undefined as void),

  deleteHoneytoken: (id: string): Promise<void> =>
    guard(() => (WailsApp as any).DeleteHoneytoken(id), undefined as void),

  listDeceptionAlerts: (limit: number): Promise<BackendAlert[]> =>
    guard(() => (WailsApp as any).ListDeceptionAlerts(limit) as Promise<BackendAlert[]>, []),

  // ── Merkle / Integrity ───────────────────────────────────────────────────
  listIntegrityBlocks: (limit: number): Promise<BackendIntegrityBlock[]> =>
    guard(() => (WailsApp as any).ListIntegrityBlocks(limit) as Promise<BackendIntegrityBlock[]>, []),

  // ── Netflow ──────────────────────────────────────────────────────────────
  getNetflowStats: (): Promise<Record<string, number>> =>
    guard(() => (WailsApp as any).GetNetflowStats() as Promise<Record<string, number>>, {}),

  listNetflowTopTalkers: (limit: number): Promise<BackendNetflowFlow[]> =>
    guard(() => (WailsApp as any).ListNetflowTopTalkers(limit) as Promise<BackendNetflowFlow[]>, []),

  // ── Rules management ──────────────────────────────────────────────────────
  toggleRule: (id: string, enabled: boolean): Promise<void> =>
    guard(() => (WailsApp as any).ToggleRule(id, enabled), undefined as void),

  // ── Notifications settings ────────────────────────────────────────────────
  getNotificationSettings: (): Promise<any> =>
    guard(() => (WailsApp as any).GetNotificationSettings(), null),

  updateNotificationSettings: (cfg: any): Promise<void> =>
    guard(() => (WailsApp as any).UpdateNotificationSettings(cfg), undefined as void),

  // ── Forensics public key ──────────────────────────────────────────────────
  getForensicsPublicKey: (): Promise<string> =>
    guard(() => (WailsApp as any).GetForensicsPublicKey(), ""),

  // ── System ───────────────────────────────────────────────────────────────
  getStorageStats: (): Promise<BackendStorageStats> =>
    guard(() => WailsApp.GetStorageStats() as Promise<BackendStorageStats>, {
      badger_lsm_bytes: 0,
      badger_vlog_bytes: 0,
      sqlite_path: "",
    } as BackendStorageStats),

  getConfig: () =>
    guard(() => WailsApp.GetConfig(), null),
};
