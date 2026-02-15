import { createSignal, onMount } from "solid-js";
import { Card } from "../../../design-system/components/Card";
import { Button } from "../../../design-system/components/Button";
import { Badge } from "../../../design-system/components/Badge";
import { Database, HardDrive, RefreshCw, Cpu, ShieldAlert, Download, UploadCloud, Info } from "lucide-solid";
import { api, type BackendStorageStats } from "../../../services/api";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export default function SystemSettings() {
  const [stats, setStats] = createSignal<BackendStorageStats | null>(null);
  const [refreshing, setRefreshing] = createSignal(false);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const s = await api.getStorageStats();
      setStats(s);
    } finally {
      setRefreshing(false);
    }
  };

  onMount(fetchStats);

  const badgerTotal = () => (stats()?.badger_lsm_bytes ?? 0) + (stats()?.badger_vlog_bytes ?? 0);

  return (
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex items-center gap-6">
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Database size={32} />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">System & Maintenance</h1>
          <p class="text-sm text-muted mt-0.5">Core engine configuration, backups, and storage usage</p>
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
              <p class="text-[9px] font-bold text-muted uppercase">Storage Engine</p>
              <p class="text-lg font-mono font-bold text-white">BadgerDB+SQLite</p>
            </div>
            <div class="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <p class="text-[9px] font-bold text-muted uppercase">Search Engine</p>
              <p class="text-lg font-mono font-bold text-white">Bluge</p>
            </div>
          </div>
        </Card>

        <Card class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-white flex items-center gap-2"><HardDrive size={18} class="text-accent" /> Storage</h3>
            <button
              class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
              onClick={fetchStats}
            >
              <RefreshCw size={14} class={refreshing() ? "animate-spin" : ""} />
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-[11px] mb-1">
                <span class="text-secondary">Event Store (BadgerDB)</span>
                <span class="text-white font-mono">{fmtBytes(badgerTotal())}</span>
              </div>
              <div class="space-y-1.5">
                <div class="flex justify-between text-[10px] text-muted">
                  <span>LSM Tree</span>
                  <span class="font-mono">{fmtBytes(stats()?.badger_lsm_bytes ?? 0)}</span>
                </div>
                <div class="flex justify-between text-[10px] text-muted">
                  <span>Value Log</span>
                  <span class="font-mono">{fmtBytes(stats()?.badger_vlog_bytes ?? 0)}</span>
                </div>
              </div>
            </div>
            <div class="pt-2 border-t border-white/5">
              <div class="flex justify-between text-[10px] text-muted">
                <span>SQLite Path</span>
              </div>
              <p class="text-[10px] font-mono text-accent mt-1 truncate" title={stats()?.sqlite_path ?? "—"}>
                {stats()?.sqlite_path ?? "—"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" class="w-full">Purge Old Logs</Button>
        </Card>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card class="p-6 space-y-4">
          <h3 class="font-bold text-white flex items-center gap-2"><UploadCloud size={18} class="text-accent" /> Disaster Recovery</h3>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="flex-1"><Download size={14} class="mr-2" /> Local Backup</Button>
            <Button variant="outline" size="sm" class="flex-1"><RefreshCw size={14} class="mr-2" /> Restore Point</Button>
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
