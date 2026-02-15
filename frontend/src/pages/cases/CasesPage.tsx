import { createSignal, For, Show, onMount } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { casesStore } from "../../stores/cases.store";
import type { CaseEntry } from "../../stores/cases.store";
import { addToast } from "../../stores/registry";
import { api } from "../../services/api";
import { FileText, Plus, Clock, User, AlertTriangle, CheckCircle, RefreshCw } from "lucide-solid";
import { Modal } from "../../design-system/components/Modal";

const sevColor = (s: string) => ({ critical: "error", high: "warning", medium: "warning", low: "success", info: "info" } as any)[s] ?? "muted";
const statColor = (s: string) => ({ open: "error", in_progress: "warning", investigating: "warning", resolved: "success", closed: "muted" } as any)[s] ?? "muted";

export default function CasesPage() {
  const { cases, filteredCases, loading, load, updateStatus } = casesStore;
  const [selected, setSelected] = createSignal<CaseEntry | null>(null);
  const [creating, setCreating] = createSignal(false);
  const [newTitle, setNewTitle] = createSignal("");
  const [reportContent, setReportContent] = createSignal("");
  const [reportLoading, setReportLoading] = createSignal(false);

  onMount(() => load());

  const handleResolve = async (id: string) => {
    await updateStatus(id, "resolved");
    addToast({ type: "success", message: "Case resolved." });
    setSelected(null);
  };

  const handleExportReport = async (id: string) => {
    setReportLoading(true);
    try {
      const md = await api.generateReport(id);
      setReportContent(md);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gradient">Case Management</h1>
          <p class="text-sm text-muted">Structured incident investigation workflow</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw size={14} class={`mr-1.5 ${loading() ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button onClick={() => setCreating(true)}><Plus size={14} class="mr-1.5" /> New Case</Button>
        </div>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["open", "in_progress", "resolved", "closed"] as const).map(st => (
          <Card class="text-center p-4">
            <p class="text-3xl font-bold font-mono text-white">
              {cases().filter(c => c.status === st).length}
            </p>
            <p class="text-xs text-muted mt-1 uppercase tracking-wider">{st.replace("_", " ")}</p>
          </Card>
        ))}
      </div>

      <Show when={loading()}>
        <div class="flex items-center justify-center py-12 text-muted text-sm gap-3">
          <RefreshCw size={16} class="animate-spin" /> Loading cases…
        </div>
      </Show>

      <Show when={!loading()}>
        <div class="grid gap-4">
          <For each={filteredCases()} fallback={
            <Card class="text-center py-12 text-muted text-sm">No cases found.</Card>
          }>
            {(c) => (
              <div onClick={() => setSelected(c)}>
                <Card class="hover:bg-white/[0.08] transition-colors cursor-pointer">
                  <div class="flex items-start gap-4">
                    <div class="p-2.5 rounded-xl shrink-0 bg-accent/10">
                      <FileText size={20} class="text-accent" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 class="font-semibold text-white">{c.title}</h3>
                        <Badge variant={sevColor(c.severity)}>{c.severity}</Badge>
                        <Badge variant={statColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                      </div>
                      <p class="text-sm text-muted line-clamp-1">{c.description}</p>
                      <div class="flex items-center gap-4 mt-2 text-xs text-muted">
                        <span class="flex items-center gap-1"><User size={11} />{c.assignee || "Unassigned"}</span>
                        <span class="flex items-center gap-1"><AlertTriangle size={11} />{c.alertCount} alerts</span>
                        <span class="flex items-center gap-1"><Clock size={11} />Updated {c.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-xs text-muted">Created</p>
                      <p class="text-sm font-mono text-secondary">{c.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Case Detail Modal */}
      <Show when={selected()}>
        {(c) => (
          <Modal open={true} onClose={() => { setSelected(null); setReportContent(""); }} title={c().title} class="max-w-2xl">
            <div class="space-y-4">
              <div class="flex gap-2">
                <Badge variant={sevColor(c().severity)}>{c().severity}</Badge>
                <Badge variant={statColor(c().status)}>{c().status.replace("_", " ")}</Badge>
              </div>
              <p class="text-sm text-secondary">{c().description}</p>
              <div class="grid grid-cols-2 gap-3">
                {([
                  ["Assignee", c().assignee || "Unassigned"],
                  ["Alert Count", c().alertCount],
                  ["Created", c().createdAt.toLocaleString()],
                  ["Last Updated", c().updatedAt.toLocaleString()],
                ] as [string, any][]).map(([k, v]) => (
                  <div class="p-3 rounded-lg bg-white/5">
                    <p class="text-[10px] text-muted uppercase tracking-wider mb-1">{k}</p>
                    <p class="text-sm font-mono text-white">{v}</p>
                  </div>
                ))}
              </div>

              {/* Generated report section */}
              <Show when={reportContent()}>
                <div class="p-4 rounded-lg bg-white/5 border border-white/10 max-h-60 overflow-y-auto">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted mb-2">Investigation Report</p>
                  <pre class="text-xs text-secondary whitespace-pre-wrap font-mono">{reportContent()}</pre>
                </div>
              </Show>

              <div class="flex gap-3 pt-2">
                <Button
                  variant="outline" class="flex-1"
                  disabled={reportLoading()}
                  onClick={() => handleExportReport(c().id)}
                >
                  {reportLoading() ? <RefreshCw size={14} class="mr-1.5 animate-spin" /> : null}
                  {reportContent() ? "Regenerate Report" : "Export Report"}
                </Button>
                <Button class="flex-1" onClick={() => handleResolve(c().id)}>
                  <CheckCircle size={14} class="mr-1.5" />Resolve
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </Show>

      {/* Create Modal */}
      <Modal open={creating()} onClose={() => setCreating(false)} title="New Case">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-secondary">Case Title</label>
            <input
              value={newTitle()}
              onInput={(e) => setNewTitle(e.currentTarget.value)}
              placeholder="Describe the incident..."
              class="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          <p class="text-xs text-muted">Case creation is currently UI-only. Backend integration coming in the next sprint.</p>
          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
            <Button class="flex-1" onClick={() => { setCreating(false); setNewTitle(""); addToast({ type: "info", message: "Case creation requires backend integration." }); }}>
              Create Case
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
