import { Card } from "../../../design-system/components/Card";
import { Button } from "../../../design-system/components/Button";
import { Badge } from "../../../design-system/components/Badge";
import { Database, HardDrive, RefreshCw, Cpu, ShieldAlert, Download, UploadCloud, Info } from "lucide-solid";

export default function SystemSettings() {
    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center gap-6">
                <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <Database size={32} />
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-white">System & Maintenance</h1>
                    <p class="text-sm text-muted mt-0.5">Core engine configuration, backups, and licensing</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="p-6 col-span-2 space-y-6">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-white flex items-center gap-2"><Cpu size={18} class="text-accent" /> Engine Status</h3>
                        <Badge variant="success" class="animate-pulse">HEALTHY</Badge>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                            <p class="text-[9px] font-bold text-muted uppercase">Core Version</p>
                            <p class="text-lg font-mono font-bold text-white">v2.4.12-S</p>
                        </div>
                        <div class="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                            <p class="text-[9px] font-bold text-muted uppercase">Uptime</p>
                            <p class="text-lg font-mono font-bold text-white">12d 4h 12m</p>
                        </div>
                        <div class="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                            <p class="text-[9px] font-bold text-muted uppercase">Build Arc</p>
                            <p class="text-lg font-mono font-bold text-white">Win-x64</p>
                        </div>
                    </div>
                </Card>

                <Card class="p-6 space-y-6">
                    <h3 class="font-bold text-white flex items-center gap-2"><HardDrive size={18} class="text-accent" /> Storage & Index</h3>
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="flex justify-between text-[11px] mb-1">
                                <span class="text-secondary">Main Array</span>
                                <span class="text-white font-mono">1.2 TB / 4.0 TB</span>
                            </div>
                            <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div class="h-full bg-accent w-[30%]" />
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" class="w-full">Purge Old Logs</Button>
                </Card>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card class="p-6 space-y-4">
                    <h3 class="font-bold text-white flex items-center gap-2"><UploadCloud size={18} class="text-accent" /> Disaster Recovery</h3>
                    <div class="flex gap-2">
                        <Button variant="outline" size="sm" class="flex-1 capitalize"><Download size={14} class="mr-2" /> Local Backup</Button>
                        <Button variant="outline" size="sm" class="flex-1 capitalize"><RefreshCw size={14} class="mr-2" /> Restore Point</Button>
                    </div>
                </Card>
                <Card class="p-6 border-red-500/20 space-y-4">
                    <h3 class="font-bold text-white flex items-center gap-2"><ShieldAlert size={18} class="text-red-500" /> Danger Zone</h3>
                    <Button variant="danger" size="sm" class="w-full font-bold">FACTORY RESET SYSTEM</Button>
                </Card>
            </div>

            <div class="flex items-center gap-2 text-xs text-muted justify-center py-4 border-t border-white/5">
                <Info size={14} class="text-accent" />
                <span>OBLIVRA Enterprise License: <span class="text-white font-bold">LIFETIME-SOVEREIGN</span></span>
            </div>
        </div>
    );
}
