import { createSignal, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { caseStore, addToast } from "../../stores/registry";
import type { Case } from "../../stores/registry";
import { FileText, Plus, Clock, User, AlertTriangle, CheckCircle } from "lucide-solid";
import { Modal } from "../../design-system/components/Modal";

const sevColor = (s: string) => ({ critical: "error", high: "warning", medium: "warning", low: "success" } as any)[s] ?? "muted";
const statColor = (s: string) => ({ open: "error", in_progress: "warning", resolved: "success", closed: "muted" } as any)[s] ?? "muted";

export default function CasesPage() {
  const { cases, setCases } = caseStore;
  const [selected, setSelected] = createSignal<Case | null>(null);
  const [creating, setCreating] = createSignal(false);
  const [newTitle, setNewTitle] = createSignal("");

  const createCase = () => {
    if (!newTitle()) return;
    const nc: Case = {
      id: `c${Date.now()}`, title: newTitle(), severity: "medium", status: "open",
      assignee: "Unassigned", created: new Date().toISOString(), updated: new Date().toISOString(),
      alertCount: 0, description: "New case created."
    };
    setCases(c => [nc, ...c]);
    setCreating(false);
    setNewTitle("");
    addToast({ type: "success", message: "Case created successfully." });
  };

  return (
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gradient">Case Management</h1>
          <p class="text-sm text-muted">Structured incident investigation workflow</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={14} class="mr-1.5" /> New Case</Button>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["open", "Open"], ["in_progress", "In Progress"], ["resolved", "Resolved"], ["closed", "Closed"]].map(([st, label]) => (
          <Card class="text-center p-4">
            <p class="text-3xl font-bold font-mono text-white">{cases().filter(c => c.status === st).length}</p>
            <p class="text-xs text-muted mt-1 uppercase tracking-wider">{label}</p>
          </Card>
        ))}
      </div>

      <div class="grid gap-4">
        <For each={cases()}>
          {(c) => (
            <Card class="hover:bg-white/[0.08] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
              <div class="flex items-start gap-4">
                <div class={`p-2.5 rounded-xl shrink-0`} style={{ background: { critical: "rgba(239,68,68,0.1)", high: "rgba(249,115,22,0.1)", medium: "rgba(99,102,241,0.1)", low: "rgba(34,197,94,0.1)" }[c.severity] }}>
                  <FileText size={20} class={{ critical: "text-red-400", high: "text-amber-400", medium: "text-accent", low: "text-emerald-400" }[c.severity]} />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 class="font-semibold text-white">{c.title}</h3>
                    <Badge variant={sevColor(c.severity)}>{c.severity}</Badge>
                    <Badge variant={statColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                  </div>
                  <p class="text-sm text-muted line-clamp-1">{c.description}</p>
                  <div class="flex items-center gap-4 mt-2 text-xs text-muted">
                    <span class="flex items-center gap-1"><User size={11} />{c.assignee}</span>
                    <span class="flex items-center gap-1"><AlertTriangle size={11} />{c.alertCount} alerts</span>
                    <span class="flex items-center gap-1"><Clock size={11} />Updated {new Date(c.updated).toLocaleDateString()}</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs text-muted">Created</p>
                  <p class="text-sm font-mono text-secondary">{new Date(c.created).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          )}
        </For>
      </div>

      {/* Case Detail Modal */}
      <Show when={selected()}>
        {(c) => (
          <Modal open={true} onClose={() => setSelected(null)} title={c().title} class="max-w-2xl">
            <div class="space-y-4">
              <div class="flex gap-2">
                <Badge variant={sevColor(c().severity)}>{c().severity}</Badge>
                <Badge variant={statColor(c().status)}>{c().status.replace("_", " ")}</Badge>
              </div>
              <p class="text-sm text-secondary">{c().description}</p>
              <div class="grid grid-cols-2 gap-3">
                {[["Assignee", c().assignee], ["Alert Count", c().alertCount], ["Created", new Date(c().created).toLocaleString()], ["Last Updated", new Date(c().updated).toLocaleString()]].map(([k, v]) => (
                  <div class="p-3 rounded-lg bg-white/5">
                    <p class="text-[10px] text-muted uppercase tracking-wider mb-1">{k}</p>
                    <p class="text-sm font-mono text-white">{v}</p>
                  </div>
                ))}
              </div>
              {/* Timeline stub */}
              <div class="p-4 rounded-lg bg-white/5 border border-white/10">
                <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">Investigation Timeline</p>
                <div class="space-y-3">
                  {["Case opened — alert correlation initiated.", "Assigned to investigator.", "Initial log review completed. Suspicious lateral movement pattern found."].map((ev, i) => (
                    <div class="flex gap-3">
                      <div class="flex flex-col items-center">
                        <div class="w-2 h-2 rounded-full bg-accent mt-1" />
                        {i < 2 && <div class="w-px flex-1 bg-white/10 mt-1" />}
                      </div>
                      <p class="text-sm text-secondary pb-3">{ev}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div class="flex gap-3">
                <Button variant="outline" class="flex-1">Add Evidence</Button>
                <Button variant="outline" class="flex-1">Export PDF</Button>
                <Button class="flex-1" onClick={() => { setCases(cs => cs.map(x => x.id === c().id ? { ...x, status: "resolved" as const } : x)); setSelected(null); addToast({ type: "success", message: "Case resolved." }); }}>
                  <CheckCircle size={14} class="mr-1.5" />Resolve
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </Show>

      {/* Create Case Modal */}
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
          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
            <Button class="flex-1" onClick={createCase}>Create Case</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
