import { createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Fingerprint, FileText, AlertTriangle, Shield, Search, RefreshCw, HardDrive } from "lucide-solid";

export default function FIMPage() {
    const [auditSearch, setAuditSearch] = createSignal("");

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">File Integrity Monitor</h1>
                    <p class="text-sm text-muted mt-0.5">Tracking real-time file system mutations and access</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm hover:bg-white/10 transition-colors">
                        <FileText size={16} /> Policy Editor
                    </button>
                    <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]">
                        <RefreshCw size={16} /> Re-scan Fleet
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-accent/10 text-accent"><Shield size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Paths Monitored</p>
                        <p class="text-2xl font-bold font-mono text-white">12,402</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-red-500/10 text-red-400"><AlertTriangle size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Integrity Breaches</p>
                        <p class="text-2xl font-bold font-mono text-white">4</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><HardDrive size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Snapshot Status</p>
                        <p class="text-2xl font-bold font-mono text-white">Healthy</p>
                    </div>
                </Card>
                <Card class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Fingerprint size={22} /></div>
                    <div>
                        <p class="text-xs text-muted font-bold uppercase tracking-wider">Digital Signatures</p>
                        <p class="text-2xl font-bold font-mono text-white">99.8%</p>
                    </div>
                </Card>
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h3 class="font-semibold text-sm">Recent File Mutations</h3>
                    <div class="relative w-full md:w-80">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Filter by file path or agent..."
                            class="w-full bg-base border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent transition-all"
                            value={auditSearch()}
                            onInput={(e) => setAuditSearch(e.currentTarget.value)}
                        />
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-3">Timestamp</th>
                                <th class="px-6 py-3">Agent</th>
                                <th class="px-6 py-3">Operation</th>
                                <th class="px-6 py-3">File Path</th>
                                <th class="px-6 py-3">User</th>
                                <th class="px-6 py-3 text-right">Integrity</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5 text-secondary">
                            {[
                                { time: "12:14:02", agent: "srv-dc-01", op: "MODIFIED", path: "C:\\Windows\\System32\\config\\SYSTEM", user: "SYSTEM", integrity: "CRITICAL" },
                                { time: "12:12:44", agent: "ws-fin-12", op: "CREATED", path: "C:\\Users\\admin\\sh.lnk", user: "admin", integrity: "WARN" },
                                { time: "12:10:12", agent: "srv-web-02", op: "DELETED", path: "/etc/nginx/conf.d/def.conf", user: "root", integrity: "OK" },
                                { time: "12:08:55", agent: "srv-dc-01", op: "ACCESS_DENIED", path: "C:\\keys\\root.key", user: "backup_svc", integrity: "CRITICAL" },
                            ].map(item => (
                                <tr class="hover:bg-white/10 transition-colors group">
                                    <td class="px-6 py-4 font-mono text-muted">{item.time}</td>
                                    <td class="px-6 py-4 font-medium text-white">{item.agent}</td>
                                    <td class="px-6 py-4">
                                        <Badge variant={item.op === 'MODIFIED' ? 'warning' : item.op === 'ACCESS_DENIED' ? 'error' : 'info'}>
                                            {item.op}
                                        </Badge>
                                    </td>
                                    <td class="px-6 py-4 font-mono text-blue-400 group-hover:text-white transition-colors truncate max-w-[200px]">{item.path}</td>
                                    <td class="px-6 py-4">{item.user}</td>
                                    <td class="px-6 py-4 text-right font-bold text-gradient">
                                        {item.integrity}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
