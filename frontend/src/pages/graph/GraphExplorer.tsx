import { createSignal, For, onMount } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { GitGraph, Search, Maximize2, RefreshCw, ZoomIn, ZoomOut, Save } from "lucide-solid";

export default function GraphExplorer() {
    const [loading, setLoading] = createSignal(true);

    onMount(() => {
        setTimeout(() => setLoading(false), 1500);
    });

    const mockNodes = [
        { id: "1", type: "Host", label: "SRV-DC-01", color: "text-blue-400" },
        { id: "2", type: "User", label: "svc_admin", color: "text-emerald-400" },
        { id: "3", type: "Process", label: "lsass.exe", color: "text-amber-400" },
        { id: "4", type: "Network", label: "10.0.0.12", color: "text-purple-400" },
        { id: "5", type: "Host", label: "WS-FIN-08", color: "text-blue-400" },
    ];

    return (
        <div class="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
            <div class="flex items-center justify-between shrink-0">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Graph Explorer</h1>
                    <p class="text-sm text-muted mt-0.5">Relational analysis of SIEM entities and lateral movement paths</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm"><RefreshCw size={14} class="mr-2" /> Redraw</Button>
                    <Button variant="primary" size="sm"><Save size={14} class="mr-2" /> Save Layout</Button>
                </div>
            </div>

            <div class="flex-1 flex gap-4 overflow-hidden">
                <Card class="flex-1 bg-black/40 border-dashed border-white/10 relative p-0 overflow-hidden flex items-center justify-center cursor-crosshair">
                    <div class="absolute inset-0 pointer-events-none opacity-5" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 20px 20px;" />

                    {loading() ? (
                        <div class="flex flex-col items-center gap-4">
                            <RefreshCw size={32} class="animate-spin text-accent" />
                            <p class="text-xs text-muted font-mono animate-pulse">Computing graph topology...</p>
                        </div>
                    ) : (
                        <div class="relative w-full h-full">
                            {/* SVG Graph Simulation Mockup */}
                            <svg class="w-full h-full">
                                <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
                                <line x1="80%" y1="20%" x2="50%" y2="50%" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
                                <line x1="30%" y1="70%" x2="50%" y2="50%" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
                                <line x1="70%" y1="80%" x2="50%" y2="50%" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
                            </svg>

                            <div class="absolute top-[30%] left-[20%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div class="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                                    <GitGraph size={20} />
                                </div>
                                <span class="absolute top-14 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white whitespace-nowrap bg-black/60 px-2 py-0.5 rounded border border-white/10">SRV-DC-01</span>
                            </div>

                            <div class="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div class="w-16 h-16 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">
                                    <Search size={24} />
                                </div>
                                <span class="absolute top-18 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white whitespace-nowrap bg-black/60 px-2 py-0.5 rounded border border-white/10">CORE ENTITY</span>
                            </div>

                            <div class="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                <div class="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Maximize2 size={16} />
                                </div>
                                <span class="absolute top-12 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white whitespace-nowrap">svc_admin</span>
                            </div>
                        </div>
                    )}

                    <div class="absolute bottom-6 left-6 flex flex-col gap-2">
                        <button class="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-secondary hover:text-white transition-colors hover:bg-black/80"><ZoomIn size={18} /></button>
                        <button class="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-secondary hover:text-white transition-colors hover:bg-black/80"><ZoomOut size={18} /></button>
                    </div>

                    <div class="absolute top-6 right-6 p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md w-64">
                        <h4 class="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Graph Legend</h4>
                        <div class="space-y-2">
                            {mockNodes.map(n => (
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <div class={`w-2 h-2 rounded-full bg-current ${n.color}`} />
                                        <span class="text-[11px] text-secondary">{n.type}</span>
                                    </div>
                                    <span class="text-[11px] font-mono text-white">{n.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card class="w-80 p-0 flex flex-col overflow-hidden shrink-0">
                    <div class="p-4 border-b border-white/5 bg-white/2">
                        <h3 class="font-semibold text-sm">Entity Context</h3>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 space-y-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-muted uppercase">Query Analysis</label>
                            <div class="relative">
                                <Search size={14} class="absolute left-3 top-2.5 text-muted" />
                                <input class="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-accent" placeholder="Search for nodes..." />
                            </div>
                        </div>

                        <div class="space-y-3">
                            <label class="text-[10px] font-bold text-muted uppercase">Shortest Path</label>
                            <div class="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                <div class="flex items-center gap-2 text-red-400 mb-1">
                                    <AlertTriangle size={14} />
                                    <span class="text-[11px] font-bold uppercase">Critical Path</span>
                                </div>
                                <p class="text-[10px] text-secondary leading-relaxed">3 hops to Domain Admin from source IP 192.168.10.42</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <label class="text-[10px] font-bold text-muted uppercase">Recent Connections</label>
                            <For each={[1, 2, 3, 4]}>
                                {() => (
                                    <div class="flex items-center justify-between group">
                                        <div class="flex items-center gap-3">
                                            <div class="w-1 h-8 bg-accent/40 rounded-full" />
                                            <div>
                                                <p class="text-[11px] font-bold text-white">Kerberos TGS Request</p>
                                                <p class="text-[9px] text-muted font-mono">2s ago • 10.0.0.12</p>
                                            </div>
                                        </div>
                                        <Badge variant="muted">RAW</Badge>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                    <div class="p-4 border-t border-white/5">
                        <Button variant="outline" class="w-full font-bold text-[11px]">View Full Evidence Table</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

import { AlertTriangle } from "lucide-solid";
