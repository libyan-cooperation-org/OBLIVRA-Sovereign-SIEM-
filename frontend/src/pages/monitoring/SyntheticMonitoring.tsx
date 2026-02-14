import { For } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Activity, Globe, Server, Clock, AlertTriangle, Plus, RefreshCw, MoreVertical } from "lucide-solid";

export default function SyntheticMonitoring() {
    const monitors = [
        { name: "Public Website", type: "HTTP/S", target: "https://oblivra.com", status: "up", uptime: "99.98%", latency: "42ms", region: "Global" },
        { name: "Main API Gateway", type: "API", target: "https://api.oblivra.com/v1/health", status: "up", uptime: "99.95%", latency: "18ms", region: "US-East" },
        { name: "Internal DNS", type: "DNS", target: "10.0.0.1", status: "warning", uptime: "98.2%", latency: "2ms", region: "Datacenter" },
        { name: "OAuth Service", type: "TCP", target: "auth.internal:443", status: "down", uptime: "94.5%", latency: "0ms", region: "Global" },
    ];

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Synthetic Monitoring</h1>
                    <p class="text-sm text-muted mt-0.5">Continuous availability and performance tracking for critical services</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <RefreshCw size={14} class="mr-2" /> Global Refresh
                    </Button>
                    <Button variant="primary" size="sm">
                        <Plus size={16} class="mr-2" /> Create Monitor
                    </Button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card class="flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><Server size={22} /></div>
                    <div>
                        <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Active Monitors</p>
                        <p class="text-2xl font-bold font-mono text-white">12 / 14</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Activity size={22} /></div>
                    <div>
                        <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Avg Latency</p>
                        <p class="text-2xl font-bold font-mono text-white">24ms</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-accent/10 text-accent"><Globe size={22} /></div>
                    <div>
                        <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Global S-Uptime</p>
                        <p class="text-2xl font-bold font-mono text-white">99.8%</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4 border-l-4 border-l-red-500">
                    <div class="p-3 rounded-xl bg-red-500/10 text-red-500"><AlertTriangle size={22} /></div>
                    <div>
                        <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Critical Alerts</p>
                        <p class="text-2xl font-bold font-mono text-red-400">2</p>
                    </div>
                </Card>
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <h3 class="font-semibold text-sm">Service Health Map</h3>
                        <div class="flex items-center gap-2">
                            <Badge variant="success">9 Up</Badge>
                            <Badge variant="warning">1 Warning</Badge>
                            <Badge variant="error">2 Down</Badge>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-muted text-xs">
                        <Clock size={14} /> Last check: Just now
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-4">Monitor Name</th>
                                <th class="px-6 py-4">Type / Target</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4">Uptime (30d)</th>
                                <th class="px-6 py-4">Latency</th>
                                <th class="px-6 py-4">Region</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <For each={monitors}>
                                {(m) => (
                                    <tr class="hover:bg-white/5 transition-colors group">
                                        <td class="px-6 py-4">
                                            <span class="font-bold text-white uppercase text-xs tracking-wide">{m.name}</span>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex flex-col">
                                                <span class="text-xs text-secondary">{m.type}</span>
                                                <span class="text-[10px] text-muted font-mono">{m.target}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <Badge variant={m.status === 'up' ? 'success' : m.status === 'warning' ? 'warning' : 'error'}>
                                                {m.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td class="px-6 py-4 text-secondary font-mono text-xs">{m.uptime}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        class={`h-full rounded-full ${m.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                        style={`width: ${m.status === 'up' ? '70%' : '100%'}`}
                                                    />
                                                </div>
                                                <span class="text-[10px] font-mono text-secondary">{m.latency}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-1.5 text-xs text-muted">
                                                <Globe size={12} /> {m.region}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <button class="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                                                <MoreVertical size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Card>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card class="p-6">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><Activity size={18} class="text-accent" /> Latency History (Global)</h3>
                    <div class="h-48 flex items-end gap-1.5">
                        <For each={Array.from({ length: 30 })}>
                            {(_) => {
                                const height = Math.random() * 80 + 20;
                                return (
                                    <div
                                        class="flex-1 bg-accent/20 hover:bg-accent/50 transition-colors rounded-t-sm relative group"
                                        style={`height: ${height}%`}
                                    >
                                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-black/80 rounded border border-white/10 text-[8px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 font-mono">
                                            {height.toFixed(0)} ms
                                        </div>
                                    </div>
                                );
                            }}
                        </For>
                    </div>
                </Card>
                <Card class="p-6">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><Globe size={18} class="text-accent" /> Incident Log</h3>
                    <div class="space-y-4">
                        {[
                            { time: "10:42 AM", msg: "Main API Gateway returned 504 Gateway Timeout in US-East region.", level: "error" },
                            { time: "09:12 AM", msg: "Internal DNS resolution latency exceeded threshold (500ms).", level: "warning" },
                            { time: "04:00 AM", msg: "OAuth Service back online after scheduled maintenance.", level: "success" },
                        ].map(log => (
                            <div class="flex gap-4 group">
                                <span class="text-[10px] font-mono text-muted shrink-0 pt-0.5">{log.time}</span>
                                <div class="flex-1">
                                    <p class="text-xs text-secondary leading-relaxed group-hover:text-white transition-colors">{log.msg}</p>
                                    <div class={`h-0.5 w-0 group-hover:w-full transition-all duration-300 mt-1 ${log.level === 'error' ? 'bg-red-500' : log.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
