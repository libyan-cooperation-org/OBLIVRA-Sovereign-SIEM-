import { For, createSignal, onMount } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Box, Lock, Download, FileArchive, Search, ShieldCheck, ClipboardList } from "lucide-solid";
import { forensicsStore } from "../../stores/forensics.store";

export default function EvidenceLocker() {
    const { evidence, auditLog, loadAuditLog, loading } = forensicsStore;
    const [search, setSearch] = createSignal("");
    const [view, setView] = createSignal<"evidence" | "audit">("evidence");

    onMount(() => loadAuditLog(200));

    const filteredEvidence = () => (evidence?.() || []).filter(e =>
        e.eventId.toLowerCase().includes(search().toLowerCase()) ||
        e.reason.toLowerCase().includes(search().toLowerCase()) ||
        e.recordedBy.toLowerCase().includes(search().toLowerCase())
    );

    const filteredAudit = () => auditLog().filter(a =>
        a.action.toLowerCase().includes(search().toLowerCase()) ||
        a.userId.toLowerCase().includes(search().toLowerCase())
    );

    return (
        <div class="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Evidence Locker</h1>
                    <p class="text-sm text-muted mt-0.5">Secure storage and chain of custody for SIEM artifacts</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Search size={16} class="mr-2" /> Global Audit
                    </Button>
                    <Button variant="primary" size="sm">
                        <Lock size={16} class="mr-2" /> Seal Collection
                    </Button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card class="md:col-span-1 p-4 flex flex-col items-center justify-center space-y-2 border-dashed border-white/20">
                    <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                        <Box size={24} />
                    </div>
                    <p class="text-xs font-medium text-muted">New Evidence Bundle</p>
                    <Button variant="outline" size="sm" class="mt-2">Upload Files</Button>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-accent/10 text-accent"><ShieldCheck size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-medium uppercase tracking-wider">Verified Items</p>
                        <p class="text-2xl font-bold font-mono text-white">42</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-amber-500/10 text-amber-400"><Lock size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-medium uppercase tracking-wider">Unsealed Bundles</p>
                        <p class="text-2xl font-bold font-mono text-white">3</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-blue-500/10 text-blue-400"><FileArchive size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-medium uppercase tracking-wider">Storage Usage</p>
                        <p class="text-2xl font-bold font-mono text-white">12.4 GB</p>
                    </div>
                </Card>
            </div>

            {/* View toggle */}
            <div class="flex items-center gap-2 border-b border-white/5 pb-2">
                <button onClick={() => setView("evidence")}
                    class={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        view() === "evidence" ? "bg-accent/10 text-accent" : "text-muted hover:text-white"
                    }`}>
                    <Box size={14} /> Evidence
                </button>
                <button onClick={() => setView("audit")}
                    class={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        view() === "audit" ? "bg-accent/10 text-accent" : "text-muted hover:text-white"
                    }`}>
                    <ClipboardList size={14} /> Audit Log
                </button>
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5">
                    <div class="relative w-full md:w-96">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder={view() === "evidence" ? "Search by event ID or reason..." : "Search by action or user..."}
                            value={search()}
                            onInput={(e) => setSearch(e.currentTarget.value)}
                            class="w-full bg-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                        />
                    </div>
                </div>

                {/* Evidence table */}
                {view() === "evidence" && (
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">ID</th>
                                    <th class="px-6 py-4">Event ID</th>
                                    <th class="px-6 py-4">Recorded By</th>
                                    <th class="px-6 py-4">Reason</th>
                                    <th class="px-6 py-4">SHA-256</th>
                                    <th class="px-6 py-4">Captured At</th>
                                    <th class="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={filteredEvidence()} fallback={
                                    <tr><td colspan="7" class="px-6 py-12 text-center text-muted text-sm">No evidence captured yet.</td></tr>
                                }>
                                    {(item) => (
                                        <tr class="hover:bg-white/5 transition-colors">
                                            <td class="px-6 py-4 font-mono text-[11px] text-accent">{item.id.slice(0, 8)}…</td>
                                            <td class="px-6 py-4 font-mono text-xs text-secondary">{item.eventId.slice(0, 12)}…</td>
                                            <td class="px-6 py-4 text-white">{item.recordedBy}</td>
                                            <td class="px-6 py-4 text-secondary">{item.reason}</td>
                                            <td class="px-6 py-4 font-mono text-[10px] text-muted">{item.rawHash.slice(0, 16)}…</td>
                                            <td class="px-6 py-4 text-muted text-xs">{item.createdAt.toLocaleString()}</td>
                                            <td class="px-6 py-4 text-right">
                                                <button class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                                                    <Download size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Audit log table */}
                {view() === "audit" && (
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">Timestamp</th>
                                    <th class="px-6 py-4">User</th>
                                    <th class="px-6 py-4">Action</th>
                                    <th class="px-6 py-4">Target</th>
                                    <th class="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={filteredAudit()} fallback={
                                    <tr><td colspan="5" class="px-6 py-12 text-center text-muted text-sm">No audit log entries yet.</td></tr>
                                }>
                                    {(entry) => (
                                        <tr class="hover:bg-white/5 transition-colors">
                                            <td class="px-6 py-4 text-xs font-mono text-muted">{entry.timestamp.toLocaleString()}</td>
                                            <td class="px-6 py-4 text-white font-medium">{entry.userId}</td>
                                            <td class="px-6 py-4"><Badge variant="info">{entry.action}</Badge></td>
                                            <td class="px-6 py-4 text-secondary text-xs font-mono">{entry.targetType}/{entry.targetId.slice(0, 8)}…</td>
                                            <td class="px-6 py-4 text-muted text-xs">{entry.details}</td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
