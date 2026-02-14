import { Card } from "../../design-system/components/Card";
import { Save, Share2, Terminal, Shield, Zap, Info } from "lucide-solid";

export default function PlaybookBuilder() {
    return (
        <div class="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-10rem)] flex flex-col">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Playbook Builder</h1>
                    <p class="text-sm text-muted mt-0.5">Automated SOAR response plans and investigation workflows</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Share2 size={16} /> Share
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2">
                        <Save size={16} /> Save Playbook
                    </button>
                </div>
            </div>

            <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                <Card class="lg:col-span-1 p-4 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
                    <div>
                        <h3 class="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Triggers</h3>
                        <div class="space-y-2">
                            {["On Alert Critical", "On Agent Offline", "On FIM Violation", "Scheduled"].map(t => (
                                <div class="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-accent/40 cursor-pointer transition-all border-l-2 border-l-amber-500">
                                    <p class="text-[11px] font-bold text-white mb-0.5">{t}</p>
                                    <p class="text-[9px] text-muted">Core SIEM Trigger</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 class="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Actions</h3>
                        <div class="space-y-2">
                            {[
                                { name: "Isolate Endpoint", icon: Shield, color: "text-red-400" },
                                { name: "Collect Memory Dump", icon: Zap, color: "text-amber-400" },
                                { name: "Ban IP on Firewall", icon: Shield, color: "text-red-400" },
                                { name: "Notify SOC Lead", icon: Terminal, color: "text-blue-400" }
                            ].map(a => (
                                <div class="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-accent/40 cursor-pointer transition-all flex items-center gap-3">
                                    <div class={`p-1.5 rounded-md bg-white/5 ${a.color}`}><a.icon size={14} /></div>
                                    <span class="text-[11px] font-medium text-white">{a.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card class="lg:col-span-3 bg-black/40 border-dashed border-white/10 flex flex-col items-center justify-center relative p-0 overflow-hidden">
                    <div class="absolute inset-0 pointer-events-none opacity-10" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 30px 30px;" />

                    <div class="z-10 flex flex-col items-center gap-8">
                        <div class="w-48 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center shadow-lg shadow-amber-500/10">
                            <span class="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Trigger</span>
                            <p class="text-xs text-white mt-1 font-bold">On Ransomware Detected</p>
                        </div>

                        <div class="w-0.5 h-12 bg-white/10 relative">
                            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        </div>

                        <div class="flex gap-12">
                            <div class="w-48 p-4 rounded-xl bg-accent/20 border border-accent/40 text-center relative group">
                                <span class="text-[10px] uppercase font-bold text-accent tracking-widest">Execute</span>
                                <p class="text-xs text-white mt-1 font-bold">Isolate Source Host</p>
                                <div class="absolute top-1/2 -right-12 w-12 h-0.5 bg-white/10" />
                            </div>
                            <div class="w-48 p-4 rounded-xl bg-accent/20 border border-accent/40 text-center group">
                                <span class="text-[10px] uppercase font-bold text-accent tracking-widest">Execute</span>
                                <p class="text-xs text-white mt-1 font-bold">Trigger Snapshots</p>
                            </div>
                        </div>

                        <div class="w-0.5 h-12 bg-white/10" />

                        <div class="w-48 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center border-dashed">
                            <p class="text-xs text-muted">Drop next action here...</p>
                        </div>
                    </div>

                    <div class="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 backdrop-blur-md">
                        <Info size={14} class="text-accent" />
                        <span class="text-[10px] text-muted">Visual SOAR Designer v2.4</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
