import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Globe, Shield, AlertTriangle, Download, Plus, Search } from "lucide-solid";

export default function ThreatIntelPage() {
    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Threat Intelligence</h1>
                    <p class="text-sm text-muted mt-0.5">Aggregated IOCs, adversary profiles, and global threat landscape</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Download size={16} /> Export Feed
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2">
                        <Plus size={16} /> Submit IOC
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 rounded-lg bg-red-500/20 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 class="font-bold text-white">Critical Campaigns</h3>
                    </div>
                    <div class="space-y-3">
                        {["DarkSide Ransomware", "REvil Evolution", "Lazarus Group APT"].map(item => (
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-secondary">{item}</span>
                                <Badge variant="error">Active</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card class="p-6 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 rounded-lg bg-accent/20 text-accent">
                            <Shield size={24} />
                        </div>
                        <h3 class="font-bold text-white">Protection Status</h3>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between text-xs">
                            <span class="text-secondary">Signature Matches</span>
                            <span class="text-white font-mono">1,240</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-secondary">YARA Rule Hits</span>
                            <span class="text-white font-mono">84</span>
                        </div>
                    </div>
                </Card>
                <Card class="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Globe size={24} />
                        </div>
                        <h3 class="font-bold text-white">Global Feed</h3>
                    </div>
                    <div class="space-y-3 font-mono text-[10px]">
                        <div class="text-muted">CONNECTED: AlienVault OTX</div>
                        <div class="text-muted">CONNECTED: MISP Community</div>
                        <div class="text-muted">CONNECTED: VirusTotal API</div>
                    </div>
                </Card>
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 class="font-semibold text-sm">Indicator of Compromise (IOC) Library</h3>
                    <div class="relative w-80">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                        <input type="text" placeholder="Filter by type, value, or campaign..." class="w-full bg-base border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent" />
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-3">Type</th>
                                <th class="px-6 py-3">Value</th>
                                <th class="px-6 py-3">Severity</th>
                                <th class="px-6 py-3">Campaign / Actor</th>
                                <th class="px-6 py-3 text-right">Detection Rate</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            {[
                                { type: "IP", val: "185.112.45.12", sev: "Critical", actor: "UNC2452", rate: "92%" },
                                { type: "Domain", val: "login-oblivra.com", sev: "High", actor: "PhishKit-v5", rate: "78%" },
                                { type: "Hash", val: "a4f8...d921", sev: "Critical", actor: "DarkSide", rate: "100%" },
                                { type: "URL", val: "http://updates.srv-bk.net/payload.exe", sev: "Medium", actor: "Emotet", rate: "45%" },
                            ].map(ioc => (
                                <tr class="hover:bg-white/5 transition-colors">
                                    <td class="px-6 py-4"><Badge variant="muted">{ioc.type}</Badge></td>
                                    <td class="px-6 py-4 font-mono text-white">{ioc.val}</td>
                                    <td class="px-6 py-4">
                                        <Badge variant={ioc.sev === 'Critical' ? 'error' : ioc.sev === 'High' ? 'warning' : 'info'}>
                                            {ioc.sev}
                                        </Badge>
                                    </td>
                                    <td class="px-6 py-4 text-secondary">{ioc.actor}</td>
                                    <td class="px-6 py-4 text-right font-mono text-accent font-bold">{ioc.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
