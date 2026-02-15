import { For } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import {
    LayoutDashboard,
    Search,
    AlertTriangle,
    Shield,
    FileText,
    TrendingUp,
    Database,
    Settings,
    Radio,
    Zap,
    Globe,
    Terminal,
    Fingerprint,
    Boxes,
    Cpu,
    Target,
    Server
} from "lucide-solid";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Search", icon: Search, path: "/search" },
    { label: "Explorer", icon: Database, path: "/explorer" },
    { label: "Live Tail", icon: Radio, path: "/livetail" },
    { label: "Alerts", icon: AlertTriangle, path: "/alerts" },
    { label: "Cases", icon: FileText, path: "/cases" },
    { label: "Threat Hunting", icon: Target, path: "/hunting" },
    { label: "Forensics", icon: Shield, path: "/forensics/merkle" },
    { label: "Agents", icon: Server, path: "/agents" },
    { label: "Netflow", icon: TrendingUp, path: "/netflow" },
    { label: "FIM", icon: Fingerprint, path: "/fim" },
    { label: "Compliance", icon: Zap, path: "/compliance" },
    { label: "Assets", icon: Database, path: "/assets" },
    { label: "Deception", icon: Boxes, path: "/deception" },
    { label: "Constellation", icon: Globe, path: "/constellation" },
    { label: "Threat Intel", icon: Zap, path: "/threat-intel" },
    { label: "Simulation", icon: Cpu, path: "/simulation" },
    { label: "API Lab", icon: Terminal, path: "/api-lab" },
];

export const Sidebar = () => {
    const location = useLocation();

    return (
        <aside class="w-64 border-r border-white/5 bg-surface flex flex-col h-screen sticky top-0 z-50">
            <div class="p-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
                        <Shield class="text-white" size={20} />
                    </div>
                    <div>
                        <h1 class="font-bold text-xl tracking-tight text-white leading-none">OBLIVRA</h1>
                        <span class="text-[10px] text-muted font-mono tracking-widest uppercase">Sovereign SIEM</span>
                    </div>
                </div>
            </div>

            <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                <For each={navItems}>
                    {(item) => {
                        const active = () => location.pathname === item.path;
                        return (
                            <A
                                href={item.path}
                                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative"
                                activeClass="bg-accent/10 text-accent font-medium"
                                inactiveClass="text-secondary hover:text-white hover:bg-white/5"
                            >
                                <item.icon size={18} class={active() ? "text-accent" : "group-hover:text-accent transition-colors"} />
                                <span>{item.label}</span>
                                {active() && <div class="absolute left-0 w-1 h-5 bg-accent rounded-r-full" />}
                            </A>
                        );
                    }}
                </For>
            </nav>

            <div class="p-4 mt-auto border-t border-white/5">
                <A
                    href="/settings/appearance"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-secondary hover:text-white hover:bg-white/5 transition-all"
                    activeClass="bg-white/10 text-white"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </A>
                <div class="mt-4 flex items-center gap-3 px-3 py-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                        KA
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-white truncate">KingKnull</p>
                        <p class="text-[10px] text-muted truncate">Administrator</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
