import { For } from "solid-js";
import {
    BarChart3,
    Search,
    AlertTriangle,
    Shield,
    FileText,
    Activity,
    Settings,
    Database,
    Users
} from "lucide-solid";

export const Sidebar = () => {
    const navItems = [
        { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
        { label: "Explorer", icon: Search, path: "/explorer" },
        { label: "Alerts", icon: AlertTriangle, path: "/alerts" },
        { label: "Forensics", icon: Shield, path: "/forensics" },
        { label: "Cases", icon: FileText, path: "/cases" },
        { label: "Netflow", icon: Activity, path: "/netflow" },
        { label: "Storage", icon: Database, path: "/storage" },
        { label: "Users", icon: Users, path: "/users" },
    ];

    return (
        <aside class="w-64 border-r border-white/5 bg-surface flex flex-col h-screen sticky top-0">
            <div class="p-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Shield class="text-white" size={20} />
                    </div>
                    <h1 class="font-bold text-xl tracking-tight text-white">OBLIVRA</h1>
                </div>
            </div>

            <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                <For each={navItems}>
                    {(item) => (
                        <a
                            href="#"
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-secondary hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <item.icon size={18} class="group-hover:text-accent transition-colors" />
                            <span>{item.label}</span>
                        </a>
                    )}
                </For>
            </nav>

            <div class="p-4 mt-auto">
                <a
                    href="#"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </a>
            </div>
        </aside>
    );
};
