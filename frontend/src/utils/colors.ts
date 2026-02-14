import type { AlertSeverity } from "../stores/registry";

export const severityColor = (s: AlertSeverity | string): "error" | "warning" | "success" | "info" | "muted" => {
  const map: Record<string, any> = {
    critical: "error", high: "warning", medium: "warning", low: "success", info: "info",
  };
  return map[s] ?? "muted";
};

export const severityHex = (s: AlertSeverity | string): string => ({
  critical: "#ef4444", high: "#f97316", medium: "#facc15", low: "#22c55e", info: "#3b82f6",
} as any)[s] ?? "#64748b";

export const statusColor = (s: string): "error" | "warning" | "success" | "info" | "muted" => {
  const map: Record<string, any> = {
    open: "error", investigating: "warning", resolved: "success",
    false_positive: "muted", online: "success", offline: "muted", throttled: "warning",
    in_progress: "warning", closed: "muted",
  };
  return map[s] ?? "muted";
};

export const levelColor = (l: string): string => ({
  CRITICAL: "#ef4444", ERROR: "#f97316", WARN: "#facc15", INFO: "#3b82f6", DEBUG: "#64748b",
} as any)[l] ?? "#64748b";
