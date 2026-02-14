import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Database, Server, Laptop, Router, Cpu, Search, Plus, Download, Filter, Tag } from "lucide-solid";
import { assetStore } from "../../stores/registry";

export default function AssetInventory() {
    const { assets } = assetStore;
    const [search, setSearch] = createSignal("");

    const filteredAssets = () => assets().filter(a =>
        a.hostname.toLowerCase().includes(search().toLowerCase()) ||
        a.ip.includes(search())
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'server': return Server;
            case 'workstation': return Laptop;
            case 'firewall': return Shield;
            case 'router': return Router;
            default: return Cpu;
        }
    };

    const Shield = (props: any) => <Database {...props} />; // Fallback icon

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Asset Inventory</h1>
                    <p class="text-sm text-muted mt-0.5">Comprehensive CMDB and device lifecycle management</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Download size={16} /> Export CSV
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2">
                        <Plus size={16} /> Add Asset
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Assets", val: assets().length, icon: Database, color: "text-accent" },
                    { label: "Critical Assets", val: assets().filter(a => a.criticality === 'crown_jewel').length, icon: Tag, color: "text-red-400" },
                    { label: "Subnets", val: 12, icon: Globe, color: "text-blue-400" },
                    { label: "Owners", val: 8, icon: Users, color: "text-emerald-400" }
                ].map(stat => (
                    <Card class="flex items-center gap-4">
                        <div class={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p class="text-[10px] text-muted font-bold uppercase tracking-widest">{stat.label}</p>
                            <p class="text-2xl font-bold font-mono text-white">{stat.val}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:w-96">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search by hostname, IP, or owner..."
                            value={search()}
                            onInput={(e) => setSearch(e.currentTarget.value)}
                            class="w-full bg-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors border border-white/5">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-4">Asset Type</th>
                                <th class="px-6 py-4">Hostname</th>
                                <th class="px-6 py-4">IP Address</th>
                                <th class="px-6 py-4">Criticality</th>
                                <th class="px-6 py-4">Owner</th>
                                <th class="px-6 py-4 text-right">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <For each={filteredAssets()}>
                                {(asset) => {
                                    const Icon = getIcon(asset.type);
                                    return (
                                        <tr class="hover:bg-white/5 transition-colors group">
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-3">
                                                    <div class="p-2 rounded bg-white/5 text-secondary group-hover:text-accent transition-colors">
                                                        <Icon size={16} />
                                                    </div>
                                                    <span class="capitalize text-xs font-medium">{asset.type}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex flex-col">
                                                    <span class="font-bold text-white font-mono">{asset.hostname}</span>
                                                    <span class="text-[10px] text-muted">{asset.os}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 font-mono text-secondary">{asset.ip}</td>
                                            <td class="px-6 py-4">
                                                <Badge variant={asset.criticality === 'crown_jewel' ? 'error' : asset.criticality === 'high' ? 'warning' : 'info'}>
                                                    {asset.criticality.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td class="px-6 py-4 text-muted">{asset.owner}</td>
                                            <td class="px-6 py-4 text-right font-mono text-[11px] text-muted">
                                                {new Date(asset.lastSeen).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                }}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

const Globe = (props: any) => <Database {...props} />; // Icons not available in thought local
const Users = (props: any) => <Database {...props} />; // Icons not available in thought local
