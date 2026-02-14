import { createSignal, For } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { FlaskConical, Play, Save, History, Shield, Zap, Info, Server, AlertCircle, Settings } from "lucide-solid";

export default function SimulationLab() {
    const scenarios = [
        { id: "S-01", name: "Ransomware Lateral Movement", level: "Critical", duration: "12m", category: "Behavioral" },
        { id: "S-02", name: "Data Exfiltration via DNS", level: "High", duration: "5m", category: "Network" },
        { id: "S-03", name: "Credential Dumping Simulation", level: "Critical", duration: "2m", category: "Endpoint" },
        { id: "S-04", name: "Log Wiping & Evasion", level: "Medium", duration: "8m", category: "Compliance" },
    ];

    const [activeScenario, setActiveScenario] = createSignal<string | null>(null);

    return (
        <div class="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
            <div class="flex items-center justify-between shrink-0">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Simulation Lab</h1>
                    <p class="text-sm text-muted mt-0.5">Test SIEM detection capabilities with controlled adversary simulations</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm"><History size={14} class="mr-2" /> Recent Drills</Button>
                    <Button variant="primary" size="sm"><FlaskConical size={14} class="mr-2" /> New Scenario</Button>
                </div>
            </div>

            <div class="flex-1 flex gap-4 overflow-hidden">
                <Card class="flex-1 p-0 overflow-hidden flex flex-col relative">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/2">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-sm">Scenario Configuration</h3>
                            <Badge variant="muted">v2.1 DRILL ENGINE</Badge>
                        </div>
                        <div class="flex gap-2">
                            <Button variant="ghost" size="icon" class="h-8 w-8"><Settings size={14} /></Button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-8 relative">
                        <div class="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style="background-image: url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" />

                        {!activeScenario() ? (
                            <div class="flex flex-col items-center text-center max-w-sm space-y-4 z-10">
                                <div class="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-2">
                                    <FlaskConical size={32} />
                                </div>
                                <h2 class="text-xl font-bold text-white">Select a Simulation to Begin</h2>
                                <p class="text-xs text-muted leading-relaxed">Choose a scenario from the sidebar to configure the adversary behavior, target hosts, and detection objectives.</p>
                            </div>
                        ) : (
                            <div class="w-full max-w-2xl space-y-8 z-10">
                                <div class="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <div class="w-16 h-16 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h2 class="text-lg font-bold text-white">Scenario: {activeScenario()}</h2>
                                            <Badge variant="error" class="bg-red-500 text-white border-transparent">CRITICAL DRILL</Badge>
                                        </div>
                                        <p class="text-xs text-secondary">Simulates T1021.001 (RDP) follow by T1486 (Ransomware Data Encryption)</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                        <label class="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                                            <Server size={12} class="text-accent" /> Target Scope
                                        </label>
                                        <div class="space-y-2">
                                            <div class="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                                                <span class="text-[11px] text-white">SRV-APP-01</span>
                                                <Badge variant="success">READY</Badge>
                                            </div>
                                            <div class="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                                                <span class="text-[11px] text-white">WS-MARKETING-12</span>
                                                <Badge variant="success">READY</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                        <label class="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={12} class="text-amber-400" /> Actions (7)
                                        </label>
                                        <div class="space-y-1">
                                            {["Enumerate AD", "Lateral Move via SMB", "Disable Security Tools", "Stage Payloads"].map(action => (
                                                <div class="flex items-center gap-2 text-[11px] text-secondary">
                                                    <div class="w-1 h-1 rounded-full bg-accent" />
                                                    {action}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <Button variant="primary" size="lg" class="flex-1 font-bold tracking-wide">
                                        <Play size={18} class="mr-2 fill-current" /> RUN SIMULATION
                                    </Button>
                                    <Button variant="outline" size="lg">
                                        <Save size={18} class="mr-2" /> Save Config
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div class="p-4 border-t border-white/5 bg-white/2 flex items-center gap-8 shrink-0">
                        <div class="flex items-center gap-2 text-[10px] font-bold text-muted uppercase">
                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SIMULATION ENGINE ONLINE
                        </div>
                        <div class="flex items-center gap-2 text-[10px] font-bold text-muted uppercase">
                            <Shield size={12} class="text-accent" /> SAFETY OVERRIDE ACTIVE
                        </div>
                    </div>
                </Card>

                <Card class="w-80 p-0 flex flex-col overflow-hidden shrink-0">
                    <div class="p-4 border-b border-white/5">
                        <h3 class="font-semibold text-sm">Scenario Library</h3>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <For each={scenarios}>
                            {(s) => (
                                <div
                                    onClick={() => setActiveScenario(s.name)}
                                    class={`p-3 rounded-xl border transition-all cursor-pointer group ${activeScenario() === s.name
                                        ? 'bg-accent/10 border-accent/40 shadow-lg shadow-accent/5'
                                        : 'bg-white/2 border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-[9px] font-mono text-muted">{s.id}</span>
                                        <Badge variant={s.level === 'Critical' ? 'error' : 'warning'} class="text-[8px] h-4">
                                            {s.level}
                                        </Badge>
                                    </div>
                                    <p class="text-[11px] font-bold text-white group-hover:text-accent transition-colors">{s.name}</p>
                                    <div class="flex items-center justify-between mt-2">
                                        <span class="text-[10px] text-muted">{s.category}</span>
                                        <div class="flex items-center gap-1 text-[10px] text-muted">
                                            <FlaskConical size={10} /> {s.duration}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                    <div class="p-4 border-t border-white/5 bg-white/2">
                        <div class="flex items-center gap-2 text-xs text-muted p-2 rounded-lg bg-black/20">
                            <Info size={14} class="text-accent shrink-0" />
                            <p class="text-[10px]">Simulations run on isolated sandbox agents to ensure zero production impact.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

