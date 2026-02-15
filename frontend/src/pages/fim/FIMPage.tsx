import { createSignal, onMount, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Fingerprint, FileText, AlertTriangle, Shield, Search, RefreshCw, Plus, Trash2, HardDrive } from "lucide-solid";
import { api, type BackendFIMWatch, type BackendAlert } from "../../services/api";
import { addToast } from "../../stores/registry";

export default function FIMPage() {
    const [watchlist, setWatchlist] = createSignal<BackendFIMWatch[]>([]);
    const [events, setEvents] = createSignal<BackendAlert[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [search, setSearch] = createSignal("");

    // Add watch modal state
    const [showAdd, setShowAdd] = createSignal(false);
    const [newPath, setNewPath] = createSignal("");
    const [newDesc, setNewDesc] = createSignal("");
    const [newRecursive, setNewRecursive] = createSignal(false);
    const [adding, setAdding] = createSignal(false);

    const load = async () => {
        setLoading(true);
        const [wl, ev] = await Promise.all([
            api.listFIMWatchlist(),
            api.listFIMEvents(200),
        ]);
        setWatchlist(wl ?? []);
        setEvents(ev ?? []);
        setLoading(false);
    };

    onMount(load);

    const addWatch = async () => {
        if (!newPath()) return;
        setAdding(true);
        try {
            await api.addFIMWatch(newPath(), newDesc(), newRecursive());
            addToast({ type: "success", message: `Now watching: ${newPath()}` });
            setNewPath(""); setNewDesc(""); setNewRecursive(false); setShowAdd(false);
            await load();
        } catch {
            addToast({ type: "error", message: "Failed to add watch path" });
        } finally {
            setAdding(false);
        }
    };

    const removeWatch = async (path: string) => {
        await api.removeFIMWatch(path);
        addToast({ type: "success", message: "Watch removed" });
        setWatchlist(w => w.filter(x => x.path !== path));
    };

    const filteredEvents = () => {
        const q = search().toLowerCase();
        if (!q) return events();
        return events().filter(e =>
            e.title?.toLowerCase().includes(q) ||
            e.summary?.toLowerCase().includes(q) ||
            e.host?.toLowerCase().includes(q)
        );
    };

    const fmtTime = (ts: string | Date) =>
        new Date(ts).toLocaleTimeString("en-GB", { hour12: false });

    const severityVariant = (s: string) => {
        if (s === "CRITICAL") return "error";
        if (s === "HIGH") return "warning";
        return "info";
    };

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">File Integrity Monitor</h1>
                    <p class="text-sm text-muted mt-0.5">Real-time file system mutation tracking with SHA-256 baselines</p>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onClick={() => setShowAdd(true)}
                        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={16} /> Add Watch Path
                    </button>
                    <button
                        onClick={load}
                        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw size={16} class={loading() ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-accent/10 text-accent"><Shield size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Paths Watched</p>
                        <p class="text-2xl font-bold font-mono text-white">{watchlist().length}</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-red-500/10 text-red-400"><AlertTriangle size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Integrity Alerts</p>
                        <p class="text-2xl font-bold font-mono text-white">{events().filter(e => e.severity === "CRITICAL" || e.severity === "HIGH").length}</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><HardDrive size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Total Events</p>
                        <p class="text-2xl font-bold font-mono text-white">{events().length}</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Fingerprint size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Open Alerts</p>
                        <p class="text-2xl font-bold font-mono text-white">{events().filter(e => e.status === "open").length}</p>
                    </div>
                </Card>
            </div>

            {/* Watchlist */}
            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 class="font-semibold text-sm flex items-center gap-2"><FileText size={16} class="text-accent" /> Watched Paths</h3>
                    <Badge variant="muted">{watchlist().length} paths</Badge>
                </div>
                <Show when={watchlist().length === 0 && !loading()}>
                    <div class="p-8 text-center text-muted text-sm">
                        No paths monitored yet. Click "Add Watch Path" to start tracking files.
                    </div>
                </Show>
                <Show when={watchlist().length > 0}>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Path</th>
                                    <th class="px-6 py-3">Description</th>
                                    <th class="px-6 py-3">Recursive</th>
                                    <th class="px-6 py-3">Added</th>
                                    <th class="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={watchlist()}>
                                    {(item) => (
                                        <tr class="hover:bg-white/5 transition-colors group">
                                            <td class="px-6 py-4 font-mono text-blue-400 max-w-[240px] truncate">{item.path}</td>
                                            <td class="px-6 py-4 text-secondary">{item.description || "—"}</td>
                                            <td class="px-6 py-4">
                                                <Badge variant={item.recursive ? "success" : "muted"}>{item.recursive ? "Yes" : "No"}</Badge>
                                            </td>
                                            <td class="px-6 py-4 text-muted font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                                            <td class="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => removeWatch(item.path)}
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

            {/* Events table */}
            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h3 class="font-semibold text-sm">Recent Integrity Events</h3>
                    <div class="relative w-full md:w-80">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Filter by file path or host..."
                            class="w-full bg-base border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent transition-all"
                            value={search()}
                            onInput={(e) => setSearch(e.currentTarget.value)}
                        />
                    </div>
                </div>
                <Show when={filteredEvents().length === 0 && !loading()}>
                    <div class="p-8 text-center text-muted text-sm">
                        No FIM events yet. Add watch paths and file changes will appear here.
                    </div>
                </Show>
                <Show when={filteredEvents().length > 0}>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Time</th>
                                    <th class="px-6 py-3">Host</th>
                                    <th class="px-6 py-3">Severity</th>
                                    <th class="px-6 py-3">Event</th>
                                    <th class="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5 text-secondary">
                                <For each={filteredEvents().slice(0, 100)}>
                                    {(ev) => (
                                        <tr class="hover:bg-white/5 transition-colors">
                                            <td class="px-6 py-4 font-mono text-muted">{fmtTime(ev.timestamp)}</td>
                                            <td class="px-6 py-4 font-medium text-white">{ev.host || "localhost"}</td>
                                            <td class="px-6 py-4">
                                                <Badge variant={severityVariant(ev.severity) as any}>{ev.severity}</Badge>
                                            </td>
                                            <td class="px-6 py-4 max-w-[300px] truncate text-secondary">{ev.summary || ev.title}</td>
                                            <td class="px-6 py-4 text-right">
                                                <Badge variant={ev.status === "open" ? "warning" : "success"}>{ev.status}</Badge>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </Card>

            {/* Add Watch Modal */}
            <Show when={showAdd()}>
                <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card class="w-full max-w-md space-y-4 p-6">
                        <h3 class="font-bold text-white">Add Watch Path</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="text-xs text-muted mb-1 block">File / Directory Path</label>
                                <input
                                    type="text"
                                    placeholder="/etc/passwd or C:\Windows\System32"
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={newPath()}
                                    onInput={e => setNewPath(e.currentTarget.value)}
                                />
                            </div>
                            <div>
                                <label class="text-xs text-muted mb-1 block">Description (optional)</label>
                                <input
                                    type="text"
                                    placeholder="System config file"
                                    class="w-full bg-base border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={newDesc()}
                                    onInput={e => setNewDesc(e.currentTarget.value)}
                                />
                            </div>
                            <label class="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                                <input type="checkbox" checked={newRecursive()} onChange={e => setNewRecursive(e.currentTarget.checked)} />
                                Watch recursively (directories only)
                            </label>
                        </div>
                        <div class="flex gap-2 pt-2">
                            <button onClick={() => setShowAdd(false)} class="flex-1 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors">Cancel</button>
                            <button
                                onClick={addWatch}
                                disabled={adding() || !newPath()}
                                class="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-50 transition-all hover:scale-[1.02]"
                            >
                                {adding() ? "Adding…" : "Add Watch"}
                            </button>
                        </div>
                    </Card>
                </div>
            </Show>
        </div>
    );
}
