import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Target, Search, Bookmark, History, Play, Filter, Lightbulb } from "lucide-solid";
import { huntingStore } from "../../stores/registry";

export default function HuntingWorkspace() {
    const { hypotheses } = huntingStore;
    const [activeTab, setActiveTab] = createSignal<"hypotheses" | "queries" | "history">("hypotheses");

    return (
        <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Threat Hunting</h1>
                    <p class="text-sm text-muted mt-0.5">Hypothesis-driven analysis and proactive detection</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Bookmark size={16} class="mr-2" /> Saved Queries
                    </Button>
                    <Button variant="primary" size="sm">
                        <Play size={16} class="mr-2" /> New Hunt
                    </Button>
                </div>
            </div>

            <div class="flex items-center gap-6 border-b border-white/5 px-2">
                {["hypotheses", "queries", "history"].map(tab => (
                    <button
                        onClick={() => setActiveTab(tab as any)}
                        class={`pb-3 text-sm font-medium transition-all relative ${activeTab() === tab ? 'text-accent' : 'text-muted hover:text-white'}`}
                    >
                        <span class="capitalize">{tab}</span>
                        {activeTab() === tab && <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                    </button>
                ))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-4">
                    <Card class="p-4 space-y-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-widest">Hunting Query Language (HQL)</label>
                            <div class="relative bg-black/40 rounded-xl p-4 border border-white/5 min-h-[120px] font-mono text-sm group focus-within:border-accent/40 transition-colors">
                                <div class="flex gap-2">
                                    <span class="text-accent/60">SELECT</span>
                                    <span>*</span>
                                    <span class="text-accent/60">FROM</span>
                                    <span class="text-emerald-400">telemetry.process</span>
                                </div>
                                <div class="flex gap-2">
                                    <span class="text-accent/60">WHERE</span>
                                    <span class="text-white">parent_process</span>
                                    <span class="text-blue-400">=</span>
                                    <span class="text-amber-400">"winword.exe"</span>
                                </div>
                                <div class="flex gap-2">
                                    <span class="text-accent/60">AND</span>
                                    <span class="text-white">target_process</span>
                                    <span class="text-blue-400">IN</span>
                                    <span class="text-amber-400">["powershell.exe", "cmd.exe"]</span>
                                </div>
                                <div class="absolute right-4 bottom-4 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <span class="text-[10px] text-muted">Press Ctrl+Enter to Run</span>
                                    <Button variant="primary" size="sm" class="h-8">Execute</Button>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-accent/20 transition-all cursor-pointer group">
                                <Search size={16} class="text-accent mb-2" />
                                <h4 class="text-sm font-medium">Correlation Search</h4>
                                <p class="text-[10px] text-muted">Join multiple data sources based on shared attributes</p>
                            </div>
                            <div class="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group">
                                <Activity size={16} class="text-emerald-400 mb-2" />
                                <h4 class="text-sm font-medium">Anomaly Detection</h4>
                                <p class="text-[10px] text-muted">Identify deviations from historical baselines</p>
                            </div>
                        </div>
                    </Card>

                    <h3 class="font-semibold flex items-center gap-2"><Lightbulb size={18} class="text-amber-400" /> Active Hypotheses</h3>
                    <div class="space-y-3">
                        <For each={hypotheses()}>
                            {(h) => (
                                <Card class="group hover:bg-white/[0.07] transition-all border-l-4 border-l-transparent hover:border-l-accent cursor-pointer">
                                    <div class="flex items-center justify-between mb-2">
                                        <Badge variant={h.status === 'proven' ? 'success' : h.status === 'disproven' ? 'error' : 'info'}>
                                            {h.status}
                                        </Badge>
                                        <span class="text-[10px] text-muted font-mono">{new Date(h.created).toLocaleDateString()}</span>
                                    </div>
                                    <h4 class="font-medium text-white mb-1">{h.title}</h4>
                                    <p class="text-xs text-muted mb-3">Query: <code class="bg-black/20 px-1 py-0.5 rounded text-accent">{h.query}</code></p>
                                    <div class="flex items-center gap-4 text-[10px] text-muted">
                                        <span class="flex items-center gap-1"><History size={12} /> Last run: 2h ago</span>
                                        <span class="flex items-center gap-1"><Filter size={12} /> 12 source hosts</span>
                                    </div>
                                </Card>
                            )}
                        </For>
                    </div>
                </div>

                <div class="space-y-4">
                    <Card class="p-4 bg-accent/5 border-accent/10">
                        <h3 class="text-sm font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={16} /> Hunt Objective</h3>
                        <p class="text-xs text-secondary leading-relaxed">
                            Proactively identify persistence mechanisms deployed by <span class="text-white font-medium">UNC2452</span> variants.
                            Focus on scheduled tasks and service modifications in the <span class="text-white font-medium">Finance</span> sector.
                        </p>
                        <div class="mt-4 pt-4 border-t border-accent/10 flex items-center justify-between">
                            <span class="text-[10px] text-muted uppercase tracking-wider font-bold">Progress</span>
                            <span class="text-[10px] text-accent font-mono font-bold">65%</span>
                        </div>
                        <div class="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                            <div class="h-full bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" style="width: 65%" />
                        </div>
                    </Card>

                    <Card class="p-4">
                        <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-3">Threat Intelligence Feed</h3>
                        <div class="space-y-4">
                            {[
                                { tag: "IP", val: "185.112.45.12", meta: "Known C2 Node" },
                                { tag: "HASH", val: "a4f8...d921", meta: "Darkside Variant" },
                                { tag: "DOMAIN", val: "login-oblivra.com", meta: "Phishing Domain" }
                            ].map(item => (
                                <div class="flex items-center gap-3">
                                    <div class="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono font-bold text-muted">{item.tag}</div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs font-mono text-white truncate">{item.val}</p>
                                        <p class="text-[9px] text-muted">{item.meta}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" class="w-full mt-4 border-white/5 hover:bg-white/5">View Full Library</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
