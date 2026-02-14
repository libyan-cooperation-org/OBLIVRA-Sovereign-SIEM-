import { For } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Activity, ArrowUpRight, ArrowDownLeft, Globe, Zap, Filter, Share2 } from "lucide-solid";
import { netflowStore } from "../../stores/registry";

export default function NetflowDashboard() {
    const { flows } = netflowStore;

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Netflow Analysis</h1>
                    <p class="text-sm text-muted mt-0.5">Real-time network traffic and session telemetry</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors border border-white/5">
                        <Share2 size={18} />
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20">
                        Capture Trace
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Ingress Traffic</p>
                    <div class="flex items-center gap-2">
                        <ArrowDownLeft class="text-emerald-400" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">12.4 MB/s</span>
                    </div>
                </Card>
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Egress Traffic</p>
                    <div class="flex items-center gap-2">
                        <ArrowUpRight class="text-blue-400" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">4.1 MB/s</span>
                    </div>
                </Card>
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Active Flows</p>
                    <div class="flex items-center gap-2">
                        <Activity class="text-accent" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">1,240</span>
                    </div>
                </Card>
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">External IPs</p>
                    <div class="flex items-center gap-2">
                        <Globe class="text-amber-400" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">84</span>
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card class="lg:col-span-2 p-0 overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 class="font-semibold text-sm flex items-center gap-2"><Zap size={16} class="text-amber-400" /> Top Talkers</h3>
                        <button class="text-[11px] text-accent hover:underline flex items-center gap-1">
                            <Filter size={12} /> Filter Protocol
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Source IP</th>
                                    <th class="px-6 py-3">Destination IP</th>
                                    <th class="px-6 py-3">Proto</th>
                                    <th class="px-6 py-3 text-right">Bytes</th>
                                    <th class="px-6 py-3 text-right">Packets</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={flows()}>
                                    {(flow) => (
                                        <tr class="hover:bg-white/5 transition-colors group">
                                            <td class="px-6 py-4 font-mono text-white">{flow.srcIp}:{flow.srcPort}</td>
                                            <td class="px-6 py-4 font-mono text-secondary">{flow.dstIp}:{flow.dstPort}</td>
                                            <td class="px-6 py-4"><Badge variant="muted">{flow.protocol}</Badge></td>
                                            <td class="px-6 py-4 text-right font-mono text-emerald-400">{(flow.bytes / 1024).toFixed(1)} KB</td>
                                            <td class="px-6 py-4 text-right font-mono text-muted">{flow.packets}</td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div class="space-y-4">
                    <Card class="p-4">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-4">Protocol Distribution</h3>
                        <div class="space-y-4">
                            {[
                                { label: "HTTPS (443)", pct: 64, color: "bg-accent" },
                                { label: "DNS (53)", pct: 12, color: "bg-blue-400" },
                                { label: "SSH (22)", pct: 8, color: "bg-emerald-400" },
                                { label: "MySQL (3306)", pct: 16, color: "bg-amber-400" }
                            ].map(p => (
                                <div class="space-y-1">
                                    <div class="flex justify-between text-[11px]">
                                        <span class="text-secondary">{p.label}</span>
                                        <span class="text-white font-mono">{p.pct}%</span>
                                    </div>
                                    <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div class={`h-full rounded-full ${p.color}`} style={`width: ${p.pct}%`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card class="p-4 bg-red-500/5 border-red-500/10">
                        <h3 class="text-sm font-bold text-red-400 uppercase tracking-widest mb-3">Abnormal Behavior</h3>
                        <div class="p-2 rounded bg-red-500/10 text-red-400 text-[11px] font-medium border border-red-500/20 mb-2">
                            Sudden spike in egress traffic on port 445 (SMB)
                        </div>
                        <p class="text-[10px] text-muted leading-relaxed">
                            Source: 10.0.0.45. Destination: 192.168.10.12.
                            Potential lateral movement or data staging detected.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
