import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Box, Lock, Download, Trash2, Eye, FileArchive, Search, ShieldCheck } from "lucide-solid";
import { forensicsStore } from "../../stores/registry";

export default function EvidenceLocker() {
    const { evidence } = forensicsStore;
    const [search, setSearch] = createSignal("");

    const filteredEvidence = () => (evidence?.() || []).filter(e =>
        e.name.toLowerCase().includes(search().toLowerCase()) ||
        e.type.toLowerCase().includes(search().toLowerCase())
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

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:w-96">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search by file name, type, or hash..."
                            value={search()}
                            onInput={(e) => setSearch(e.currentTarget.value)}
                            class="w-full bg-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <Badge variant="muted" class="cursor-pointer">All Files</Badge>
                        <Badge variant="muted" class="cursor-pointer">Memory Dumps</Badge>
                        <Badge variant="muted" class="cursor-pointer">Disk Images</Badge>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-4">Evidence ID</th>
                                <th class="px-6 py-4">Artifact Name</th>
                                <th class="px-6 py-4">Type</th>
                                <th class="px-6 py-4">Collected At</th>
                                <th class="px-6 py-4">Size</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <For each={filteredEvidence()}>
                                {(item) => (
                                    <tr class="hover:bg-white/5 transition-colors group">
                                        <td class="px-6 py-4 font-mono text-[11px] text-accent font-bold">{item.id}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex flex-col">
                                                <span class="font-medium text-white">{item.name}</span>
                                                <span class="text-[10px] text-muted font-mono truncate max-w-[150px]">SHA256: e3b0c442...</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4"><Badge variant="muted">{item.type}</Badge></td>
                                        <td class="px-6 py-4 text-muted">{item.collectedAt}</td>
                                        <td class="px-6 py-4 font-mono text-secondary">{item.size}</td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex items-center justify-end gap-2">
                                                <button class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                                                    <Eye size={14} />
                                                </button>
                                                <button class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                                                    <Download size={14} />
                                                </button>
                                                <button class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-red-400 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
