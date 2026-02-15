import { createSignal, For, Show, onMount } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { alertsStore } from "../../stores/alerts.store";
import type { Alert } from "../../stores/alerts.store";
import { addToast } from "../../stores/registry";
import { Plus, Filter, RefreshCw, Eye, CheckCircle, XCircle } from "lucide-solid";
import { Modal } from "../../design-system/components/Modal";
import { Tabs } from "../../design-system/components/Tabs";

const sevColor = (s: string) => ({ CRITICAL: "error", HIGH: "warning", MEDIUM: "warning", LOW: "success", INFO: "info" } as any)[s] ?? "muted";
const statusColor = (s: string) => ({ open: "error", investigating: "warning", acknowledged: "warning", resolved: "success", false_positive: "muted" } as any)[s] ?? "muted";
const sevHex = (s: string) => ({ CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#facc15", LOW: "#22c55e", INFO: "#3b82f6" } as any)[s] ?? "#6366f1";

export default function AlertsPage() {
  const { alerts, filteredAlerts, loading, load, resolve, acknowledge, setStatusFilter } = alertsStore;
  const [tab, setTab] = createSignal("all");
  const [selected, setSelected] = createSignal<Alert | null>(null);

  onMount(() => load());

  const handleTabChange = (t: string) => {
    setTab(t);
    setStatusFilter(t === "all" ? "all" : t as any);
  };

  const handleResolve = async (id: string) => {
    await resolve(id);
    addToast({ type: "success", message: "Alert marked as resolved." });
    setSelected(null);
  };

  const handleFP = async (id: string) => {
    await alertsStore.updateAlertStatus?.(id, "false_positive", "");
    addToast({ type: "info", message: "Alert marked as false positive." });
    setSelected(null);
  };

  const handleAck = async (id: string) => {
    await acknowledge(id);
    addToast({ type: "info", message: "Alert acknowledged." });
    setSelected(null);
  };

  return (
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gradient">Alerts</h1>
          <p class="text-sm text-muted">Real-time threat detections and rule matches</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm"><Filter size={14} class="mr-1.5" />Filter</Button>
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw size={14} class={`mr-1.5 ${loading() ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button size="sm"><Plus size={14} class="mr-1.5" />Create Rule</Button>
        </div>
      </div>

      {/* Severity stats */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(sev => (
          <Card class="text-center p-4">
            <p class="text-3xl font-bold font-mono" style={{ color: sevHex(sev) }}>
              {alerts().filter(a => a.severity === sev && a.status === "open").length}
            </p>
            <p class="text-xs text-muted mt-1 uppercase tracking-wider">{sev.toLowerCase()}</p>
          </Card>
        ))}
      </div>

      <Card class="p-0 overflow-hidden">
        <div class="px-6 pt-4">
          <Tabs
            tabs={[
              { label: `All (${alerts().length})`, value: "all" },
              { label: `Open (${alerts().filter(a => a.status === "open").length})`, value: "open" },
              { label: "Investigating", value: "investigating" },
              { label: "Resolved", value: "resolved" },
            ]}
            active={tab()}
            onChange={handleTabChange}
          />
        </div>

        <Show when={loading()}>
          <div class="flex items-center justify-center py-12 text-muted text-sm gap-3">
            <RefreshCw size={16} class="animate-spin" /> Loading alerts…
          </div>
        </Show>

        <Show when={!loading()}>
          <div class="divide-y divide-white/5">
            <For each={filteredAlerts()} fallback={
              <div class="text-center py-12 text-muted text-sm">No alerts match the current filter.</div>
            }>
              {(alert) => (
                <div
                  class="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setSelected(alert)}
                >
                  <div class="w-1.5 h-12 rounded-full shrink-0" style={{ background: sevHex(alert.severity) }} />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <p class="font-medium text-white">{alert.title}</p>
                      <Badge variant={sevColor(alert.severity)}>{alert.severity}</Badge>
                      <Badge variant={statusColor(alert.status)}>{alert.status.replace("_", " ")}</Badge>
                    </div>
                    <p class="text-sm text-muted truncate">
                      {alert.host}
                      {alert.mitre && <> • <span class="font-mono text-xs">{alert.mitre}</span></>}
                    </p>
                  </div>
                  <span class="text-xs text-muted font-mono shrink-0">{alert.timestamp.toLocaleString()}</span>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(alert); }}>
                    <Eye size={16} />
                  </Button>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Card>

      {/* Detail Modal */}
      <Show when={selected()}>
        {(alert) => (
          <Modal open={true} onClose={() => setSelected(null)} title={alert().title} class="max-w-2xl">
            <div class="space-y-4">
              <div class="flex gap-2 flex-wrap">
                <Badge variant={sevColor(alert().severity)}>{alert().severity}</Badge>
                <Badge variant={statusColor(alert().status)}>{alert().status.replace("_", " ")}</Badge>
                {alert().mitre && <Badge variant="muted">{alert().mitre}</Badge>}
              </div>
              <div class="grid grid-cols-2 gap-4">
                {([
                  ["Host", alert().host],
                  ["Source Rule", alert().source],
                  ["Detected At", alert().timestamp.toLocaleString()],
                  ["Assignee", alert().assignee || "Unassigned"],
                ] as [string, any][]).map(([k, v]) => (
                  <div class="p-3 rounded-lg bg-white/5">
                    <p class="text-[10px] text-muted uppercase tracking-wider mb-1">{k}</p>
                    <p class="text-sm font-mono text-white">{v}</p>
                  </div>
                ))}
              </div>
              <div class="p-3 rounded-lg bg-white/5 border border-white/10">
                <p class="text-xs text-muted mb-1">Description</p>
                <p class="text-sm text-secondary">{alert().description}</p>
              </div>
              <div class="flex gap-3 pt-2">
                <Button variant="outline" class="flex-1" onClick={() => handleAck(alert().id)}>
                  Acknowledge
                </Button>
                <Button variant="secondary" class="flex-1" onClick={() => handleFP(alert().id)}>
                  <XCircle size={14} class="mr-1.5" /> False Positive
                </Button>
                <Button class="flex-1" onClick={() => handleResolve(alert().id)}>
                  <CheckCircle size={14} class="mr-1.5" /> Resolve
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </Show>
    </div>
  );
}
