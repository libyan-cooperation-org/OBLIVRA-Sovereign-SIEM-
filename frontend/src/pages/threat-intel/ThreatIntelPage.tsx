import { createSignal, onMount, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Globe, Shield, AlertTriangle, Plus, Search, Trash2, RefreshCw, ShieldCheck } from "lucide-solid";
import { api, type BackendHoneytoken } from "../../services/api";
import { addToast } from "../../stores/registry";

const IOC_TYPES = ["ip", "domain", "hash", "url", "email"];

export default function ThreatIntelPage() {
    const [tokens, setTokens] = createSignal<BackendHoneytoken[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [search, setSearch] = createSignal("");

    // Add IOC modal
    const [showAdd, setShowAdd] = createSignal(false);
    const [newType, setNewType] = createSignal("ip");
    const [newValue, setNewValue] = createSignal("");
    const [newDesc, setNewDesc] = createSignal("");
    const [adding, setAdding] = createSignal(false);

    const load = async () => {
        setLoading(true);
        const data = await api.listHoneytokens();
        setTokens(data ?? []);
        setLoading(false);
    };

    onMount(load);

    const addIOC = async () => {
        if (!newValue()) return;
        setAdding(true);
        try {
            await api.addHoneytoken(newType(), newValue(), newDesc() || `IOC: ${newType()} indicator`);
            addToast({ type: "success", message: `IOC added to detection engine: ${newValue()}` });
            setNewValue(""); setNewDesc(""); setShowAdd(false);
            await load();
        } catch {
            addToast({ type: "error", message: "Failed to add IOC" });
        } finally {
            setAdding(false);
        }
    };

    const deleteIOC = async (id: string) => {
        await api.deleteHoneytoken(id);
        addToast({ type: "success", message: "IOC removed" });
        setTokens(t => t.filter(x => x.id !== id));
    };

    const filtered = () => {
        const q = search().toLowerCase();
        if (!q) return tokens();
        return tokens().filter(t =>
            t.value.toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            (t.description ?? "").toLowerCase().includes(q)
        );
    };

    const fmtTime = (ts: string | Date) =>
        new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const typeColor = (t: string): string => {
        const m: Record<string, string> = {
            ip: "bg-red-500/10 text-red-400 border-red-500/20",
            domain: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            hash: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            url: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            email: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            credential: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        };
        return m[t] ?? "bg-white/5 text-muted border-white/10";
    };

    const ipCount   = () => tokens().filter(t => t.type === "ip").length;
    const domCount  = () => tokens().filter(t => t.type === "domain").length;
    const hashCount = () => tokens().filter(t => t.type === "hash" || t.type === "api_key" || t.type === "credential").length;

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Threat Intelligence</h1>
                    <p class="text-sm text-muted mt-0.5">IOC blacklist — any matching event auto-escalates to HIGH severity</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onClick={load} class="p-2 rounded-lg bg-white/5 border border-white/5 text-muted hover:text-white transition-colors">
                        <RefreshCw size={16} class={loading() ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={16} /> Add IOC
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 rounded-lg bg-red-500/20 text-red-500"><AlertTriangle size={24} /></div>
                        <h3 class="font-bold text-white">Malicious IPs</h3>
                    </div>
                    <p class="text-3xl font-bold font-mono text-white">{ipCount()}</p>
                    <p class="text-xs text-muted mt-1">blocked in enrichment pipeline</p>
                </Card>
                <Card class="p-6 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 rounded-lg bg-accent/20 text-accent"><Shield size={24} /></div>
                        <h3 class="font-bold text-white">Malicious Domains</h3>
                    </div>
                    <p class="text-3xl font-bold font-mono text-white">{domCount()}</p>
                    <p class="text-xs text-muted mt-1">sinkholed in DNS enrichment</p>
                </Card>
                <Card class="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 rounded-lg bg-blue-500/20 text-blue-400"><ShieldCheck size={24} /></div>
                        <h3 class="font-bold text-white">Credentials &amp; Hashes</h3>
                    </div>
                    <p class="text-3xl font-bold font-mono text-white">{hashCount()}</p>
                    <p class="text-xs text-muted mt-1">honeytoken + hash indicators</p>
                </Card>
            </div>

            {/* IOC Table */}
            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h3 class="font-semibold text-sm flex items-center gap-2">
                        <Globe size={16} class="text-accent" /> IOC Library
                        <Badge variant="muted">{tokens().length} indicators</Badge>
                    </h3>
                    <div class="relative w-full md:w-80">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Filter by type, value, or description..."
                            class="w-full bg-base border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent transition-all"
                            value={search()}
                            onInput={e => setSearch(e.currentTarget.value)}
                        />
                    </div>
                </div>

                <Show when={!loading() && tokens().length === 0}>
                    <div class="p-8 text-center text-muted text-sm">
                        No IOCs in the blacklist yet. Add indicators to automatically escalate matching events.
                    </div>
                </Show>

                <Show when={filtered().length > 0}>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Type</th>
                                    <th class="px-6 py-3">Value</th>
                                    <th class="px-6 py-3">Description</th>
                                    <th class="px-6 py-3">Added</th>
                                    <th class="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={filtered()}>
                                    {(ioc) => (
                                        <tr class="hover:bg-white/5 transition-colors group">
                                            <td class="px-6 py-4">
                                                <span class={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${typeColor(ioc.type)}`}>
                                                    {ioc.type}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 font-mono text-white max-w-[200px] truncate">{ioc.value}</td>
                                            <td class="px-6 py-4 text-secondary">{ioc.description || "—"}</td>
                                            <td class="px-6 py-4 text-muted font-mono">{fmtTime(ioc.created_at)}</td>
                                            <td class="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteIOC(ioc.id)}
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

            {/* Add IOC Modal */}
            <Show when={showAdd()}>
                <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card class="w-full max-w-md space-y-4 p-6">
                        <h3 class="font-bold text-white flex items-center gap-2"><Shield size={18} class="text-accent" /> Add IOC to Blacklist</h3>
                        <p class="text-xs text-muted">Any event containing this value will be automatically flagged as HIGH severity and trigger the threat detection rule.</p>
                        <div class="space-y-3">
                            <div>
                                <label class="text-xs text-muted mb-1 block">Indicator Type</label>
                                <select
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={newType()}
                                    onChange={e => setNewType(e.currentTarget.value)}
                                >
                                    <For each={IOC_TYPES}>
                                        {(t) => <option value={t}>{t.toUpperCase()}</option>}
                                    </For>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs text-muted mb-1 block">Value</label>
                                <input
                                    type="text"
                                    placeholder="185.220.101.34 or evil.domain.com"
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
                                    value={newValue()}
                                    onInput={e => setNewValue(e.currentTarget.value)}
                                />
                            </div>
                            <div>
                                <label class="text-xs text-muted mb-1 block">Source / Campaign (optional)</label>
                                <input
                                    type="text"
                                    placeholder="AlienVault OTX, manual, etc."
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={newDesc()}
                                    onInput={e => setNewDesc(e.currentTarget.value)}
                                />
                            </div>
                        </div>
                        <div class="flex gap-2 pt-2">
                            <button onClick={() => setShowAdd(false)} class="flex-1 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors">Cancel</button>
                            <button
                                onClick={addIOC}
                                disabled={adding() || !newValue()}
                                class="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-50 hover:scale-[1.02] transition-all"
                            >
                                {adding() ? "Adding…" : "Add to Blacklist"}
                            </button>
                        </div>
                    </Card>
                </div>
            </Show>
        </div>
    );
}
