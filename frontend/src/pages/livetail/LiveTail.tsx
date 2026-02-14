import { For, createEffect, onCleanup } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Radio, ScrollText, StopCircle, Play, Filter, Trash2 } from "lucide-solid";
import { liveTailStore } from "../../stores/registry";

export default function LiveTail() {
  const { liveLogs, setLiveLogs, liveRunning, setLiveRunning } = liveTailStore;

  // Simulate incoming logs when running
  let timer: any;
  createEffect(() => {
    if (liveRunning()) {
      timer = setInterval(() => {
        const newLog = {
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          source: "srv-dc-01",
          level: Math.random() > 0.8 ? "ERROR" : "INFO",
          message: "Real-time authentication event: " + (Math.random() > 0.5 ? "Success" : "Failure"),
          host: "10.0.0.45",
          fields: {}
        } as any;
        setLiveLogs(prev => [newLog, ...prev].slice(0, 100));
      }, 800);
    } else {
      clearInterval(timer);
    }
  });

  onCleanup(() => clearInterval(timer));

  return (
    <div class="h-[calc(100vh-10rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gradient">Live Tail</h1>
          <div class={`flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${liveRunning() ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-white/5 text-muted'}`}>
            <Radio size={12} /> {liveRunning() ? 'STREAMING' : 'PAUSED'}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLiveLogs([])}>
            <Trash2 size={16} class="mr-2" /> Clear
          </Button>
          <Button
            variant={liveRunning() ? "danger" : "primary"}
            size="sm"
            onClick={() => setLiveRunning(!liveRunning())}
          >
            {liveRunning() ? (
              <><StopCircle size={16} class="mr-2" /> Pause Stream</>
            ) : (
              <><Play size={16} class="mr-2" /> Start Stream</>
            )}
          </Button>
        </div>
      </div>

      <Card class="flex-1 flex flex-col overflow-hidden p-0 border-white/10 shadow-2xl">
        <div class="flex items-center justify-between p-3 bg-white/5 border-b border-white/5">
          <div class="flex items-center gap-3">
            <ScrollText size={16} class="text-accent" />
            <span class="text-xs font-mono text-secondary">Telemetry Flux — Buffering: {liveLogs().length}/100</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors">
              <Filter size={12} /> Filter Stream
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto font-mono text-[13px] bg-black/40 custom-scrollbar p-4 space-y-1">
          <For each={liveLogs()}>
            {(log) => (
              <div class="flex gap-4 group hover:bg-white/5 py-0.5 px-2 rounded -mx-2 transition-colors transition-all duration-300">
                <span class="text-muted w-24 shrink-0 selection:bg-accent/30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span class={`w-16 shrink-0 font-bold ${log.level === 'ERROR' ? 'text-red-400' : 'text-blue-400'}`}>[{log.level}]</span>
                <span class="text-emerald-400/80 shrink-0">{log.source}</span>
                <span class="text-white selection:bg-accent/30">{log.message}</span>
              </div>
            )}
          </For>
          {liveLogs().length === 0 && (
            <div class="h-full flex flex-col items-center justify-center text-muted opacity-30 select-none">
              <Radio size={64} class="mb-4 animate-slow-ping" />
              <p class="font-sans">Awaiting telemetry feed...</p>
            </div>
          )}
        </div>
      </Card>

      <div class="bg-surface p-3 rounded-lg border border-white/5 flex items-center gap-4 text-xs text-muted">
        <span class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-blue-400" /> SYSTEM</span>
        <span class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-emerald-400" /> NETWORK</span>
        <span class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-amber-400" /> AUTH</span>
        <div class="flex-1" />
        <span class="font-mono">Speed: 1.2 events/sec</span>
        <span class="font-mono text-accent">Active Sources: 12</span>
      </div>
    </div>
  );
}
