import { createSignal, For, Show, onMount } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Search, Clock, Download, Bookmark, ChevronDown, ChevronRight } from "lucide-solid";
import { searchStore } from "../../stores/search.store";

const LEVELS: Record<string, "error" | "warning" | "info" | "muted" | "success"> = {
  CRITICAL: "error", ERROR: "error", WARN: "warning", INFO: "info", DEBUG: "muted"
};

export default function SearchPage() {
  const { query, setQuery, results, loading, timeRange, setTimeRange, executeSearch } = searchStore;
  const [expanded, setExpanded] = createSignal<string | null>(null);

  const timeRanges = ["15m", "1h", "6h", "24h", "7d", "30d"];

  onMount(() => executeSearch(""));

  const runSearch = () => executeSearch(query());

  const histogramData = () => {
    const counts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 800 + 100) }));
    return counts;
  };

  const fieldStats = () => {
    const r = results();
    if (!r.length) return {};
    const sources: Record<string, number> = {};
    const levels: Record<string, number> = {};
    r.forEach(l => { sources[l.source] = (sources[l.source] || 0) + 1; levels[l.level] = (levels[l.level] || 0) + 1; });
    return { source: sources, level: levels };
  };

  return (
    <div class="space-y-4 animate-in fade-in duration-500">
      <div>
        <h1 class="text-2xl font-bold text-gradient">Log Search</h1>
        <p class="text-sm text-muted">SPL-inspired query language with full-text search</p>
      </div>

      {/* Query Bar */}
      <Card class="p-4 space-y-3">
        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder='source="firewall" action="block" | top src_ip'
              class="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all text-white placeholder:text-muted"
            />
          </div>
          <Button onClick={runSearch} disabled={loading()}>
            {loading() ? "Searching..." : "Search"}
          </Button>
          <Button variant="outline"><Download size={16} /></Button>
          <Button variant="outline"><Bookmark size={16} /></Button>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-muted flex items-center gap-1"><Clock size={12} /> Time range:</span>
          <For each={timeRanges}>
            {(t) => (
              <button
                onClick={() => setTimeRange(t)}
                class={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timeRange() === t ? "bg-accent text-white" : "bg-white/5 text-muted hover:text-white hover:bg-white/10"}`}
              >
                {t}
              </button>
            )}
          </For>
          <div class="ml-auto flex gap-2">
            {["SSH brute force", "Failed logins", "Lateral movement"].map(s => (
              <button onClick={() => { setQuery(s); runSearch(); }}
                class="px-2 py-1 rounded text-[10px] bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors font-mono">
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Histogram */}
      <Show when={results().length > 0}>
        <Card class="p-4">
          <p class="text-xs text-muted mb-2">Event distribution over time ({results().length} results)</p>
          <div class="flex items-end gap-0.5 h-16">
            <For each={histogramData()}>
              {(d) => (
                <div class="flex-1 bg-accent/30 hover:bg-accent/60 transition-colors rounded-t cursor-pointer" style={{ height: `${(d.count / 900) * 100}%` }} />
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Results + Field Sidebar */}
      <div class="flex gap-4">
        {/* Field Sidebar */}
        <Show when={results().length > 0}>
          <div class="w-56 shrink-0 space-y-3">
            <For each={Object.entries(fieldStats())}>
              {([field, values]) => (
                <Card class="p-4">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">{field}</p>
                  <div class="space-y-1.5">
                    <For each={Object.entries(values as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 5)}>
                      {([val, count]) => (
                        <button
                          onClick={() => { setQuery(`${field}="${val}"`); runSearch(); }}
                          class="flex items-center justify-between w-full text-xs hover:text-accent transition-colors group"
                        >
                          <span class="text-secondary group-hover:text-accent truncate">{val}</span>
                          <span class="text-muted font-mono ml-2 shrink-0">{count}</span>
                        </button>
                      )}
                    </For>
                  </div>
                </Card>
              )}
            </For>
          </div>
        </Show>

        {/* Results Table */}
        <div class="flex-1 space-y-2">
          <Show when={results().length === 0 && !loading()}>
            <Card class="flex flex-col items-center justify-center py-16 text-center">
              <Search size={40} class="text-muted mb-4" />
              <p class="font-semibold">Run a search to see results</p>
              <p class="text-sm text-muted mt-1">Type a query above or click a saved search template</p>
            </Card>
          </Show>

          <For each={results()}>
            {(log) => (
              <div class="glass-card overflow-hidden">
                <button
                  class="w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(expanded() === log.id ? null : log.id)}
                >
                  <span class="text-[10px] text-muted font-mono whitespace-nowrap mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <Badge variant={LEVELS[log.level] ?? "muted"}>{log.level}</Badge>
                  <span class="text-xs text-accent font-mono shrink-0">{log.source}</span>
                  <span class="text-sm text-white flex-1 text-left">{log.message}</span>
                  {expanded() === log.id ? <ChevronDown size={14} class="text-muted shrink-0 mt-0.5" /> : <ChevronRight size={14} class="text-muted shrink-0 mt-0.5" />}
                </button>
                <Show when={expanded() === log.id}>
                  <div class="border-t border-white/10 p-4 bg-white/5">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div><p class="text-[10px] text-muted uppercase tracking-wider">Host</p><p class="text-sm font-mono text-white mt-0.5">{log.host}</p></div>
                      <div><p class="text-[10px] text-muted uppercase tracking-wider">Timestamp</p><p class="text-sm font-mono text-white mt-0.5">{new Date(log.timestamp).toISOString()}</p></div>
                      <For each={Object.entries(log.fields)}>
                        {([k, v]) => <div><p class="text-[10px] text-muted uppercase tracking-wider">{k}</p><p class="text-sm font-mono text-white mt-0.5">{v}</p></div>}
                      </For>
                    </div>
                    <p class="mt-3 text-sm text-secondary leading-relaxed border-t border-white/10 pt-3">{log.message}</p>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
