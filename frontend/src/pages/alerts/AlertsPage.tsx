import { createSignal, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { alertStore, addToast } from "../../stores/registry";
import type { Alert, AlertSeverity } from "../../stores/registry";
import { AlertTriangle, Plus, Filter, RefreshCw, Eye, CheckCircle, XCircle } from "lucide-solid";
import { Modal } from "../../design-system/components/Modal";
import { Tabs } from "../../design-system/components/Tabs";

const sevColor = (s: AlertSeverity) => ({ critical: "error", high: "warning", medium: "warning", low: "success", info: "info" } as any)[s];
const statusColor = (s: string) => ({ open: "error", investigating: "warning", resolved: "success", false_positive: "muted" } as any)[s];

export default function AlertsPage() {
  const { alerts, setAlerts } = alertStore;
  const [tab, setTab] = createSignal("all");
  const [selected, setSelected] = createSignal<Alert | null>(null);

  const filtered = () => {
    const t = tab();
    if (t === "all") return alerts();
    if (t === "open") return alerts().filter(a => a.status === "open");
    if (t === "investigating") return alerts().filter(a => a.status === "investigating");
    if (t === "resolved") return alerts().filter(a => a.status === "resolved" || a.status === "false_positive");
    return alerts();
  };

  const resolve = (id: string) => {
    setAlerts(a => a.map(x => x.id === id ? { ...x, status: "resolved" as const } : x));
    addToast({ type: "success", message: "Alert marked as resolved." });
    setSelected(null);
  };

  const fp = (id: string) => {
    setAlerts(a => a.map(x => x.id === id ? { ...x, status: "false_positive" as const } : x));
    addToast({ type: "info", message: "Alert marked as false positive." });
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
          <Button variant="outline" size="sm"><RefreshCw size={14} class="mr-1.5" />Refresh</Button>
          <Button size="sm"><Plus size={14} class="mr-1.5" />Create Rule</Button>
        </div>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([["critical", "Critical"] as const, ["high", "High"] as const, ["medium", "Medium"] as const, ["low", "Low"] as const]).map(([sev, label]) => (
          <Card class="text-center p-4">
            <p class={`text-3xl font-bold font-mono`} style={{ color: { critical: "#ef4444", high: "#f97316", medium: "#facc15", low: "#22c55e" }[sev] }}>
              {alerts().filter(a => a.severity === sev && a.status === "open").length}
            </p>
            <p class="text-xs text-muted mt-1 uppercase tracking-wider">{label}</p>
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
            onChange={setTab}
          />
        </div>

        <div class="divide-y divide-white/5">
          <For each={filtered()}>
            {(alert) => (
              <div
                class="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setSelected(alert)}
              >
                <div class="w-1.5 h-12 rounded-full shrink-0" style={{ background: { critical: "#ef4444", high: "#f97316", medium: "#facc15", low: "#22c55e", info: "#3b82f6" }[alert.severity] }} />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-medium text-white">{alert.title}</p>
                    <Badge variant={sevColor(alert.severity)}>{alert.severity}</Badge>
                    <Badge variant={statusColor(alert.status)} class="ml-1">{alert.status.replace("_", " ")}</Badge>
                  </div>
                  <p class="text-sm text-muted">{alert.source} • <span class="font-mono text-xs">{alert.mitre}</span> • {alert.count} occurrences</p>
                </div>
                <span class="text-xs text-muted font-mono shrink-0">{new Date(alert.timestamp).toLocaleString()}</span>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(alert); }}>
                  <Eye size={16} />
                </Button>
              </div>
            )}
          </For>
        </div>
      </Card>

      {/* Detail Modal */}
      <Show when={selected()}>
        {(alert) => (
          <Modal open={true} onClose={() => setSelected(null)} title={alert().title} class="max-w-2xl">
            <div class="space-y-4">
              <div class="flex gap-2 flex-wrap">
                <Badge variant={sevColor(alert().severity)}>{alert().severity}</Badge>
                <Badge variant={statusColor(alert().status)}>{alert().status}</Badge>
                <Badge variant="muted">{alert().mitre}</Badge>
              </div>
              <div class="grid grid-cols-2 gap-4">
                {[["Source", alert().source], ["Occurrences", alert().count], ["First Seen", new Date(alert().timestamp).toLocaleString()], ["MITRE Technique", alert().mitre]].map(([k, v]) => (
                  <div class="p-3 rounded-lg bg-white/5">
                    <p class="text-[10px] text-muted uppercase tracking-wider mb-1">{k}</p>
                    <p class="text-sm font-mono text-white">{v}</p>
                  </div>
                ))}
              </div>
              <div class="p-3 rounded-lg bg-white/5 border border-white/10">
                <p class="text-xs text-muted mb-1">Description</p>
                <p class="text-sm text-secondary">Automated detection triggered by rule engine. Pattern matched against baseline behavior and MITRE ATT&amp;CK technique {alert().mitre}. Immediate investigation recommended.</p>
              </div>
              <div class="flex gap-3 pt-2">
                <Button variant="outline" class="flex-1" onClick={() => setSelected(null)}>Investigate</Button>
                <Button variant="secondary" class="flex-1" onClick={() => fp(alert().id)}>
                  <XCircle size={14} class="mr-1.5" /> False Positive
                </Button>
                <Button class="flex-1" onClick={() => resolve(alert().id)}>
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
