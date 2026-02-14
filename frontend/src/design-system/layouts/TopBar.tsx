import { Bell, Search, User, Zap } from "lucide-solid";

export const TopBar = () => {
    return (
        <header class="h-16 border-b border-white/5 bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
            <div class="flex items-center gap-4 flex-1">
                <div class="relative max-w-md w-full group">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search logs, alerts, or cases... (Press /)"
                        class="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                </div>
            </div>

            <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                    <Zap size={10} fill="currentColor" /> System Online
                </div>

                <button class="relative text-secondary hover:text-white transition-colors p-1">
                    <Bell size={20} />
                    <span class="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full border-2 border-surface" />
                </button>

                <div class="flex items-center gap-3 pl-4 border-l border-white/10">
                    <div class="text-right hidden md:block">
                        <p class="text-xs font-semibold text-white">Administrator</p>
                        <p class="text-[10px] text-muted">Sovereign Role</p>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-surface-light border border-white/10 flex items-center justify-center text-muted">
                        <User size={16} />
                    </div>
                </div>
            </div>
        </header>
    );
};
