import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Boxes, Ghost, AlertTriangle, Target, Plus, Search, Activity, Trash2 } from "lucide-solid";
import { Button } from "../../design-system/components/Button";

export default function DeceptionDashboard() {
    const [traps] = createSignal([
        { id: "T-102", name: "srv-finance-bk", type: "SMB Honeypot", alerts: 14, status: "Active" },
        { id: "T-105", name: "login.oblivra.loc", type: "HTTP Decoy", alerts: 2, status: "Active" },
        { id: "T-108", name: "root-credentials.txt", type: "Honeyfile", alerts: 0, status: "Standby" },
    ]);

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Deception Workspace</h1>
                    <p class="text-sm text-muted mt-0.5">Deploying and monitoring deceptive assets and decoys</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2">
                        <Plus size={16} /> Deploy Decoy
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="flex flex-col items-center justify-center p-8 text-center space-y-4 border-dashed border-white/20 hover:border-accent/40 transition-all cursor-pointer group">
                    <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                        <Boxes size={32} />
                    </div>
                    <div>
                        <h4 class="font-bold text-white">Full-OS Emulation</h4>
                        <p class="text-xs text-muted mt-1">High-interaction honeypots with forensic redirection</p>
                    </div>
                </Card>
                <Card class="flex flex-col items-center justify-center p-8 text-center space-y-4 border-dashed border-white/20 hover:border-emerald-500/40 transition-all cursor-pointer group">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Ghost size={32} />
                    </div>
                    <div>
                        <h4 class="font-bold text-white">Shadow Credentials</h4>
                        <p class="text-xs text-muted mt-1">Inject fake tokens into active memory and LSASS</p>
                    </div>
                </Card>
                <Card class="flex flex-col items-center justify-center p-8 text-center space-y-4 border-dashed border-white/20 hover:border-amber-500/40 transition-all cursor-pointer group">
                    <div class="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Target size={32} />
                    </div>
                    <div>
                        <h4 class="font-bold text-white">Breadcrumbs</h4>
                        <p class="text-xs text-muted mt-1">Distribute honey-links and lure documents</p>
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card class="lg:col-span-2 p-0 overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 class="font-semibold text-sm flex items-center gap-2"><Activity size={16} class="text-emerald-400" /> Active Decoys</h3>
                        <Badge variant="muted">3 Assets Deployed</Badge>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">Decoy ID</th>
                                    <th class="px-6 py-4">Persona Name</th>
                                    <th class="px-6 py-4">Technology</th>
                                    <th class="px-6 py-4 text-center">Interactions</th>
                                    <th class="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={traps()}>
                                    {(trap) => (
                                        <tr class="hover:bg-accent/[0.03] transition-colors group">
                                            <td class="px-6 py-4 font-mono text-[11px] text-muted">{trap.id}</td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                                    <span class="font-medium text-white">{trap.name}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 text-secondary text-xs">{trap.type}</td>
                                            <td class="px-6 py-4 text-center">
                                                <div class={`inline-flex items-center gap-1.5 font-bold font-mono text-xs ${trap.alerts > 0 ? 'text-red-400 animate-pulse' : 'text-muted'}`}>
                                                    <AlertTriangle size={12} /> {trap.alerts}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 text-right">
                                                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button class="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all"><Search size={14} /></button>
                                                    <button class="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div class="space-y-4">
                    <Card class="p-6 bg-gradient-to-br from-indigo-900/40 to-black border-accent/20">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Ghost size={18} class="text-accent" /> Deception Intel</h3>
                        <div class="space-y-4">
                            <div class="p-3 rounded-lg bg-white/5 border border-white/5">
                                <p class="text-[11px] text-accent font-bold mb-1">New Interaction</p>
                                <p class="text-[10px] text-muted">A source IP <span class="text-white">10.0.0.142</span> attempted NTLM auth on decoy <span class="text-white">srv-finance-bk</span></p>
                                <span class="text-[9px] text-muted mt-2 block font-mono">12:12:04 UTC</span>
                            </div>
                            <div class="p-3 rounded-lg bg-white/5 border border-white/5 opacity-50">
                                <p class="text-[11px] text-secondary font-bold mb-1">Decoy Registered</p>
                                <p class="text-[10px] text-muted">HTTP Decoy "login.oblivra.loc" is now visible to the local network.</p>
                                <span class="text-[9px] text-muted mt-2 block font-mono">Yesterday 18:44</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" class="w-full mt-6 border-accent/20 text-accent hover:bg-accent/10">Full Traffic Trace</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
