import { createSignal, For } from "solid-js";
import { Card } from "../../../design-system/components/Card";
import { Monitor, Moon, Sun, Palette, Sparkles, Layout } from "lucide-solid";

export default function AppearanceSettings() {
    const [theme, setTheme] = createSignal("oblivra-black");
    const [glassIntensity, setGlassIntensity] = createSignal(80);
    const [animationsEnabled, setAnimationsEnabled] = createSignal(true);

    const themes = [
        { id: "oblivra-black", name: "Oblivra Black", icon: Moon, desc: "The standard deep space interface." },
        { id: "tactical-gray", name: "Tactical Gray", icon: Monitor, desc: "High-contrast focused environment." },
        { id: "light-sovereign", name: "Sovereign Light", icon: Sun, desc: "Professional daylight clarity." },
    ];

    return (
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 class="text-2xl font-bold text-gradient mb-2">Appearance</h2>
                <p class="text-secondary">Customize the OBLIVRA command center interface to your environment.</p>
            </div>

            <section class="space-y-4">
                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                    <Palette size={16} /> Theme Selection
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <For each={themes}>
                        {(t) => (
                            <button
                                onClick={() => setTheme(t.id)}
                                class={`text-left transition-all duration-300 group ${theme() === t.id ? "ring-2 ring-accent" : "hover:bg-white/5"
                                    } rounded-xl overflow-hidden`}
                            >
                                <Card class={`h-full border-0 ${theme() === t.id ? "bg-white/10" : "bg-white/5"}`}>
                                    <div class="flex items-center gap-4 mb-3">
                                        <div class={`p-2 rounded-lg ${theme() === t.id ? "bg-accent text-white" : "bg-white/5 text-muted group-hover:text-white"}`}>
                                            <t.icon size={20} />
                                        </div>
                                        <span class="font-semibold">{t.name}</span>
                                    </div>
                                    <p class="text-xs text-muted leading-relaxed">{t.desc}</p>
                                </Card>
                            </button>
                        )}
                    </For>
                </div>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                        <Sparkles size={16} /> Visual Fidelity
                    </h3>
                    <Card class="space-y-6">
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <label class="text-sm font-medium">Glassmorphism Intensity</label>
                                <span class="text-xs text-accent font-mono">{glassIntensity()}%</span>
                            </div>
                            <input
                                type="range"
                                value={glassIntensity()}
                                onInput={(e) => setGlassIntensity(parseInt(e.currentTarget.value))}
                                class="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <p class="text-[10px] text-muted">Adjust the background blur and transparency level.</p>
                        </div>

                        <div class="flex items-center justify-between">
                            <div class="space-y-0.5">
                                <label class="text-sm font-medium">Micro-Animations</label>
                                <p class="text-[10px] text-muted">Enable subtle interactive transitions.</p>
                            </div>
                            <button
                                onClick={() => setAnimationsEnabled(!animationsEnabled())}
                                class={`w-10 h-5 rounded-full transition-colors relative ${animationsEnabled() ? "bg-accent" : "bg-white/10"}`}
                            >
                                <div class={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${animationsEnabled() ? "translate-x-5" : ""}`} />
                            </button>
                        </div>
                    </Card>
                </div>

                <div class="space-y-4">
                    <h3 class="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                        <Layout size={16} /> Spatial Density
                    </h3>
                    <Card class="space-y-4">
                        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                            <span class="text-sm">Compact View</span>
                            <div class="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center">
                                <div class="w-2 h-2 bg-accent rounded-full" />
                            </div>
                        </div>
                        <div class="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                            <span class="text-sm">Comfortable View</span>
                            <div class="w-4 h-4 rounded-full border-2 border-white/10" />
                        </div>
                        <p class="text-[10px] text-muted">Compact view increases data density for high-resolution monitors.</p>
                    </Card>
                </div>
            </section>
        </div>
    );
}
