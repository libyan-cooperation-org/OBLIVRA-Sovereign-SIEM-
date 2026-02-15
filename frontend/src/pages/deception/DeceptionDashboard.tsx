import { createSignal, onMount, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Ghost, AlertTriangle, Target, Plus, Trash2, RefreshCw, ShieldAlert } from "lucide-solid";
import { api, type BackendHoneytoken, type BackendAlert } from "../../services/api";
import { addToast } from "../../stores/registry";

const TOKEN_TYPES = ["credential", "file", "domain", "ip", "hash", "api_key"];

export default function DeceptionDashboard() {
    const [tokens, setTokens] = createSignal<BackendHoneytoken[]>([]);
    const [alerts, setAlerts] = createSignal<BackendAlert[]>([]);
    const [loading, setLoading] = createSignal(true);

    // Add modal
    const [showAdd, setShowAdd] = createSignal(false);
    const [newType, setNewType] = createSignal("credential");
    const [newValue, setNewValue] = createSignal("");
    const [newDesc, setNewDesc] = createSignal("");
    const [adding, setAdding] = createSignal(false);

    const load = async () => {
        setLoading(true);
        const [tok, alts] = await Promise.all([
            api.listHoneytokens(),
            api.listDeceptionAlerts(50),
        ]);
        setTokens(tok ?? []);
        setAlerts(alts ?? []);
        setLoading(false);
    };

    onMount(load);

    const addToken = async () => {
        if (!newValue()) return;
        setAdding(true);
        try {
            await api.addHoneytoken(newType(), newValue(), newDesc());
            addToast({ type: "success", message: `Honeytoken deployed: ${newValue()}` });
            setNewValue(""); setNewDesc(""); setShowAdd(false);
            await load();
        } catch {
            addToast({ type: "error", message: "Failed to deploy honeytoken" });
        } finally {
            setAdding(false);
        }
    };

    const deleteToken = async (id: string, value: string) => {
        await api.deleteHoneytoken(id);
        addToast({ type: "success", message: `Removed: ${value}` });
        setTokens(t => t.filter(x => x.id !== id));
    };

    const fmtTime = (ts: string | Date) =>
        new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

    const typeColor = (t: string) => {
        const m: Record<string, string> = {
            credential: "text-red-400", file: "text-amber-400",
            domain: "text-blue-400", ip: "text-emerald-400",
            hash: "text-purple-400", api_key: "text-orange-400",
        };
        return m[t] ?? "text-muted";
    };

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Deception Workspace</h1>
                    <p class="text-sm text-muted mt-0.5">Deploy honeytokens and monitor adversary interactions</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onClick={load} class="p-2 rounded-lg bg-white/5 border border-white/5 text-muted hover:text-white transition-colors">
                        <RefreshCw size={16} class={loading() ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={16} /> Deploy Honeytoken
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-accent/10 text-accent"><Ghost size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Active Tokens</p>
                        <p class="text-2xl font-bold font-mono text-white">{tokens().length}</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-red-500/10 text-red-400"><AlertTriangle size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Triggered Alerts</p>
                        <p class="text-2xl font-bold font-mono text-white">{alerts().length}</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-amber-500/10 text-amber-400"><Target size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Open Incidents</p>
                        <p class="text-2xl font-bold font-mono text-white">{alerts().filter(a => a.status === "open").length}</p>
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Token list */}
                <Card class="lg:col-span-2 p-0 overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 class="font-semibold text-sm flex items-center gap-2">
                            <Ghost size={16} class="text-accent" /> Deployed Honeytokens
                        </h3>
                        <Badge variant="muted">{tokens().length} tokens</Badge>
                    </div>

                    <Show when={!loading() && tokens().length === 0}>
                        <div class="p-8 text-center text-muted text-sm">
                            No honeytokens deployed. Click "Deploy Honeytoken" to create your first trap.
                        </div>
                    </Show>

                    <Show when={tokens().length > 0}>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th class="px-6 py-4">Type</th>
                                        <th class="px-6 py-4">Value</th>
                                        <th class="px-6 py-4">Description</th>
                                        <th class="px-6 py-4">Deployed</th>
                                        <th class="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    <For each={tokens()}>
                                        {(token) => (
                                            <tr class="hover:bg-accent/[0.03] transition-colors group">
                                                <td class="px-6 py-4">
                                                    <span class={`font-mono text-xs font-bold uppercase ${typeColor(token.type)}`}>{token.type}</span>
                                                </td>
                                                <td class="px-6 py-4 font-mono text-white max-w-[160px] truncate">{token.value}</td>
                                                <td class="px-6 py-4 text-secondary text-xs">{token.description || "—"}</td>
                                                <td class="px-6 py-4 text-muted text-xs font-mono">{fmtTime(token.created_at)}</td>
                                                <td class="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteToken(token.id, token.value)}
                                                        class="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </Card>

                {/* Recent triggers */}
                <div class="space-y-4">
                    <Card class="p-6 bg-gradient-to-br from-indigo-900/40 to-black border-accent/20">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldAlert size={18} class="text-red-400" /> Recent Triggers
                        </h3>

                        <Show when={alerts().length === 0}>
                            <p class="text-xs text-muted text-center py-4">No honeytoken triggers yet. Any access will appear here instantly.</p>
                        </Show>

                        <div class="space-y-3 max-h-80 overflow-y-auto">
                            <For each={alerts().slice(0, 10)}>
                                {(al) => (
                                    <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <p class="text-[11px] text-red-400 font-bold mb-1">{al.title}</p>
                                        <p class="text-[10px] text-muted leading-relaxed">{al.summary}</p>
                                        <span class="text-[9px] text-muted mt-2 block font-mono">{fmtTime(al.timestamp)}</span>
                                    </div>
                                )}
                            </For>
                        </div>

                        <Button variant="outline" size="sm" class="w-full mt-4 border-accent/20 text-accent hover:bg-accent/10">
                            View All Deception Alerts
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Add Honeytoken Modal */}
            <Show when={showAdd()}>
                <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card class="w-full max-w-md space-y-4 p-6">
                        <h3 class="font-bold text-white flex items-center gap-2"><Ghost size={18} class="text-accent" /> Deploy Honeytoken</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="text-xs text-muted mb-1 block">Token Type</label>
                                <select
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={newType()}
                                    onChange={e => setNewType(e.currentTarget.value)}
                                >
                                    <For each={TOKEN_TYPES}>
                                        {(t) => <option value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>}
                                    </For>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs text-muted mb-1 block">Value (the fake credential / token / domain)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. admin:SuperSecret123! or evil.internal.corp"
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
                                    value={newValue()}
                                    onInput={e => setNewValue(e.currentTarget.value)}
                                />
                            </div>
                            <div>
                                <label class="text-xs text-muted mb-1 block">Description</label>
                                <input
                                    type="text"
                                    placeholder="Fake finance DB password"
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={newDesc()}
                                    onInput={e => setNewDesc(e.currentTarget.value)}
                                />
                            </div>
                        </div>
                        <div class="flex gap-2 pt-2">
                            <button onClick={() => setShowAdd(false)} class="flex-1 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors">Cancel</button>
                            <button
                                onClick={addToken}
                                disabled={adding() || !newValue()}
                                class="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-50 hover:scale-[1.02] transition-all"
                            >
                                {adding() ? "Deploying…" : "Deploy"}
                            </button>
                        </div>
                    </Card>
                </div>
            </Show>
        </div>
    );
}
