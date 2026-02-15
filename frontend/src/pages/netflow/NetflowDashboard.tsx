import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Globe, Zap, RefreshCw, Share2 } from "lucide-solid";
import { api, type BackendNetflowFlow } from "../../services/api";

function fmtBytes(b: number): string {
    if (b >= 1_000_000_000) return (b / 1_000_000_000).toFixed(1) + " GB/s";
    if (b >= 1_000_000)     return (b / 1_000_000).toFixed(1) + " MB/s";
    if (b >= 1_000)         return (b / 1_000).toFixed(1) + " KB/s";
    return b + " B/s";
}

const PROTO_COLORS: Record<string, string> = {
    TCP: "bg-accent",
    UDP: "bg-blue-400",
    ICMP: "bg-emerald-400",
    default: "bg-amber-400",
};

export default function NetflowDashboard() {
    const [flows, setFlows] = createSignal<BackendNetflowFlow[]>([]);
    const [stats, setStats] = createSignal<Record<string, number>>({});
    const [loading, setLoading] = createSignal(true);

    const load = async () => {
        const [topFlows, netStats] = await Promise.all([
            api.listNetflowTopTalkers(20),
            api.getNetflowStats(),
        ]);
        setFlows(topFlows ?? []);
        setStats(netStats ?? {});
        setLoading(false);
    };

    onMount(() => {
        load();
        // Poll every 10s for live feel
        const t = setInterval(load, 10_000);
        onCleanup(() => clearInterval(t));
    });

    // Derive protocol distribution from visible flows
    const protoDist = () => {
        const map: Record<string, number> = {};
        let total = 0;
        for (const f of flows()) {
            map[f.protocol] = (map[f.protocol] ?? 0) + f.bytes;
            total += f.bytes;
        }
        return Object.entries(map).map(([proto, bytes]) => ({
            label: proto,
            pct: total > 0 ? Math.round((bytes / total) * 100) : 0,
            color: PROTO_COLORS[proto] ?? PROTO_COLORS.default,
        })).sort((a, b) => b.pct - a.pct).slice(0, 5);
    };

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Netflow Analysis</h1>
                    <p class="text-sm text-muted mt-0.5">Real-time network traffic and session telemetry (UDP :2055)</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onClick={load} class="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors border border-white/5">
                        <RefreshCw size={18} class={loading() ? "animate-spin" : ""} />
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2">
                        <Share2 size={16} /> Export Flows
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Ingress</p>
                    <div class="flex items-center gap-2">
                        <ArrowDownLeft class="text-emerald-400" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">{fmtBytes(stats().bytes_in ?? 0)}</span>
                    </div>
                </Card>
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Egress</p>
                    <div class="flex items-center gap-2">
                        <ArrowUpRight class="text-blue-400" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">{fmtBytes(stats().bytes_out ?? 0)}</span>
                    </div>
                </Card>
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">Active Flows</p>
                    <div class="flex items-center gap-2">
                        <TrendingUp class="text-accent" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">{(stats().active_flows ?? 0).toLocaleString()}</span>
                    </div>
                </Card>
                <Card class="flex flex-col gap-1 p-4">
                    <p class="text-[10px] text-muted font-bold uppercase tracking-widest">External IPs</p>
                    <div class="flex items-center gap-2">
                        <Globe class="text-amber-400" size={16} />
                        <span class="text-2xl font-bold font-mono text-white">{(stats().external_ips ?? 0).toLocaleString()}</span>
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top talkers */}
                <Card class="lg:col-span-2 p-0 overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 class="font-semibold text-sm flex items-center gap-2">
                            <Zap size={16} class="text-amber-400" /> Top Talkers
                        </h3>
                        <Badge variant="muted">{flows().length} flows</Badge>
                    </div>

                    <Show when={!loading() && flows().length === 0}>
                        <div class="p-8 text-center text-muted text-sm">
                            No flows yet. Send Netflow v5 packets to UDP port 2055 to start seeing traffic.
                        </div>
                    </Show>

                    <Show when={flows().length > 0}>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs">
                                <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                    <tr>
                                        <th class="px-6 py-3">Source</th>
                                        <th class="px-6 py-3">Destination</th>
                                        <th class="px-6 py-3">Proto</th>
                                        <th class="px-6 py-3 text-right">Bytes</th>
                                        <th class="px-6 py-3 text-right">Packets</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    <For each={flows()}>
                                        {(flow) => (
                                            <tr class="hover:bg-white/5 transition-colors">
                                                <td class="px-6 py-4 font-mono text-white">{flow.src_ip}:{flow.src_port}</td>
                                                <td class="px-6 py-4 font-mono text-secondary">{flow.dst_ip}:{flow.dst_port}</td>
                                                <td class="px-6 py-4"><Badge variant="muted">{flow.protocol}</Badge></td>
                                                <td class="px-6 py-4 text-right font-mono text-emerald-400">{(flow.bytes / 1024).toFixed(1)} KB</td>
                                                <td class="px-6 py-4 text-right font-mono text-muted">{flow.packets.toLocaleString()}</td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </Card>

                {/* Protocol distribution */}
                <div class="space-y-4">
                    <Card class="p-4">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-4">Protocol Distribution</h3>
                        <Show when={protoDist().length === 0}>
                            <p class="text-xs text-muted text-center py-4">Waiting for flow data…</p>
                        </Show>
                        <div class="space-y-4">
                            <For each={protoDist()}>
                                {(p) => (
                                    <div class="space-y-1">
                                        <div class="flex justify-between text-[11px]">
                                            <span class="text-secondary">{p.label}</span>
                                            <span class="text-white font-mono">{p.pct}%</span>
                                        </div>
                                        <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div class={`h-full rounded-full transition-all ${p.color}`} style={`width: ${p.pct}%`} />
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Card>

                    <Card class="p-4">
                        <h3 class="text-sm font-bold text-muted uppercase tracking-widest mb-3">Total Flow Volume</h3>
                        <p class="text-2xl font-bold font-mono text-white">{(stats().total_flows ?? 0).toLocaleString()}</p>
                        <p class="text-xs text-muted mt-1">flows received since startup</p>
                        <div class="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span class="text-[11px] text-muted">Live — updates every 10s</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
