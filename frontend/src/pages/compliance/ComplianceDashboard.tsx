import { For } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { CheckCircle2, AlertCircle, FileText, BarChart3, ShieldCheck, Globe } from "lucide-solid";

export default function ComplianceDashboard() {
    const standards = [
        { name: "SOC2 Type II", progress: 92, status: "Healthy" },
        { name: "ISO 27001", progress: 78, status: "Warning" },
        { name: "SAMA Cybersecurity", progress: 100, status: "Healthy" },
        { name: "GDPR Annex 1", progress: 65, status: "Critical" },
    ];

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Compliance & Auditing</h1>
                    <p class="text-sm text-muted mt-0.5">Automated regulatory alignment and posture management</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <FileText size={16} /> Audit Log
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20">
                        Generate Report
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <For each={standards}>
                    {(s) => (
                        <Card class="p-4 space-y-4 hover:border-accent/30 transition-all cursor-pointer group">
                            <div class="flex justify-between items-start">
                                <div class="p-2 rounded-lg bg-white/5 text-accent group-hover:bg-accent/10 transition-colors">
                                    <ShieldCheck size={20} />
                                </div>
                                <Badge variant={s.status === 'Healthy' ? 'success' : s.status === 'Warning' ? 'warning' : 'error'}>
                                    {s.status}
                                </Badge>
                            </div>
                            <div>
                                <h4 class="font-bold text-white">{s.name}</h4>
                                <p class="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Alignment Progress</p>
                            </div>
                            <div class="space-y-1.5">
                                <div class="flex justify-between text-[11px] font-mono">
                                    <span class="text-muted">Pass/Fail</span>
                                    <span class="text-white">{s.progress}%</span>
                                </div>
                                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        class={`h-full rounded-full transition-all duration-1000 ${s.status === 'Healthy' ? 'bg-emerald-500' : s.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={`width: ${s.progress}%`}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}
                </For>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card class="lg:col-span-2 p-0 overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 class="font-semibold text-sm">Control Status Matrix</h3>
                        <div class="flex gap-2">
                            <Badge variant="success">84 Pass</Badge>
                            <Badge variant="error">12 Fail</Badge>
                            <Badge variant="warning">8 Pending</Badge>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Control ID</th>
                                    <th class="px-6 py-3">Domain</th>
                                    <th class="px-6 py-3">Description</th>
                                    <th class="px-6 py-3">Status</th>
                                    <th class="px-6 py-3 text-right">Last Audit</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                {[
                                    { id: "AC-1", domain: "Access Control", desc: "Multi-factor authentication for all users", status: "Pass", date: "2h ago" },
                                    { id: "SI-2", domain: "System Integrity", desc: "FIM enabled on production critical paths", status: "Pass", date: "12s ago" },
                                    { id: "IA-3", domain: "Identification", desc: "Password complexity requirements > 14 chars", status: "Fail", date: "1d ago" },
                                    { id: "SC-4", domain: "Communication", desc: "Encryption in transit (TLS 1.3)", status: "Pass", date: "4h ago" },
                                ].map(item => (
                                    <tr class="hover:bg-white/5 transition-colors">
                                        <td class="px-6 py-4 font-mono text-accent font-bold">{item.id}</td>
                                        <td class="px-6 py-4 text-white font-medium">{item.domain}</td>
                                        <td class="px-6 py-4 text-muted">{item.desc}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                {item.status === 'Pass' ? <CheckCircle2 size={14} class="text-emerald-400" /> : <AlertCircle size={14} class="text-red-400" />}
                                                <span class={item.status === 'Pass' ? 'text-emerald-400' : 'text-red-400'}>{item.status}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-right font-mono text-muted">{item.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div class="space-y-4">
                    <Card class="p-4">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-4">Postures Summary</h3>
                        <div class="space-y-6">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-muted">Technical Controls</p>
                                    <p class="text-lg font-bold text-white">84 / 96 Pass</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <FileText size={24} />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-muted">Evidence Collected</p>
                                    <p class="text-lg font-bold text-white">1,204 Artifacts</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                                    <BarChart3 size={24} />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-muted">Post-Audit Tasks</p>
                                    <p class="text-lg font-bold text-white">12 RemediationItems</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card class="p-4 bg-gradient-to-br from-indigo-600/20 to-accent/20 border-accent/20">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-2">Sovereign Pulse</h3>
                        <p class="text-[11px] text-secondary leading-relaxed">
                            OBLIVRA-SIEM is providing autonomous evidence collection for the SAMA framework.
                            All logs are cryptographically hashed and sealed.
                        </p>
                        <div class="mt-4 flex items-center gap-2">
                            <Globe size={14} class="text-accent" />
                            <span class="text-[10px] text-muted font-bold tracking-widest uppercase">Global Assurance</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
