import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Input } from "../../design-system/components/Input";
import { Button } from "../../design-system/components/Button";
import { Badge } from "../../design-system/components/Badge";
import { Search, Filter, Download, Calendar, Terminal } from "lucide-solid";
import { searchStore } from "../../stores/registry";

export default function LogExplorer() {
  const { searchQuery, setSearchQuery, searchResults, searchLoading, timeRange, setTimeRange } = searchStore;
  const [view, setView] = createSignal<"table" | "raw">("table");

  const handleSearch = () => {
    // Mock search execution
    console.log("Searching for:", searchQuery());
  };

  return (
    <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gradient">Log Explorer</h1>
          <p class="text-sm text-muted mt-0.5">Deep diving into Sovereign log telemetry</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download size={16} class="mr-2" /> Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleSearch}>
            Run Query
          </Button>
        </div>
      </div>

      <Card class="p-4 space-y-4">
        <div class="flex gap-4">
          <div class="flex-1 relative">
            <Terminal class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="e.g. status:error and host:srv-* | stats count by user"
              class="w-full bg-base border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            />
          </div>
          <div class="flex items-center gap-2 bg-base border border-white/10 rounded-lg px-3">
            <Calendar size={16} class="text-muted" />
            <select
              value={timeRange()}
              onChange={(e) => setTimeRange(e.currentTarget.value)}
              class="bg-transparent text-sm outline-none cursor-pointer py-2"
            >
              <option value="15m">Last 15m</option>
              <option value="1h">Last 1h</option>
              <option value="4h">Last 4h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-semibold text-muted uppercase tracking-wider mr-2">Quick Filters:</span>
          <Badge variant="outline" class="cursor-pointer hover:bg-white/5">source:system</Badge>
          <Badge variant="outline" class="cursor-pointer hover:bg-white/5">level:ERROR</Badge>
          <Badge variant="outline" class="cursor-pointer hover:bg-white/5">user:admin</Badge>
          <Badge variant="outline" class="cursor-pointer hover:bg-accent/10 border-accent/20 text-accent">+ Add Filter</Badge>
        </div>
      </Card>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card class="lg:col-span-1 p-4 space-y-6">
          <div>
            <h3 class="text-xs font-bold text-muted uppercase tracking-widest mb-4">Available Fields</h3>
            <div class="space-y-2">
              {["@timestamp", "host", "source", "message", "process", "user", "ip_address", "event_id"].map(field => (
                <div class="flex items-center justify-between text-sm group cursor-pointer hover:text-accent transition-colors">
                  <span class="flex items-center gap-2 font-mono"><span class="text-muted text-[10px]">#</span> {field}</span>
                  <span class="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card class="lg:col-span-3 p-0 overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-white/5">
            <div class="flex items-center gap-4">
              <button
                class={`text-sm font-medium transition-colors ${view() === 'table' ? 'text-accent' : 'text-muted hover:text-white'}`}
                onClick={() => setView('table')}
              >
                Table
              </button>
              <button
                class={`text-sm font-medium transition-colors ${view() === 'raw' ? 'text-accent' : 'text-muted hover:text-white'}`}
                onClick={() => setView('raw')}
              >
                Raw
              </button>
            </div>
            <span class="text-xs text-muted font-mono">Found 1,204 events in 84ms</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th class="px-4 py-3 w-48">Timestamp</th>
                  <th class="px-4 py-3 w-32">Host</th>
                  <th class="px-4 py-3 w-24">Level</th>
                  <th class="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={searchResults()}>
                  {(log) => (
                    <tr class="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td class="px-4 py-3 font-mono text-[11px] text-muted whitespace-nowrap">{log.timestamp}</td>
                      <td class="px-4 py-3 font-medium text-white">{log.host}</td>
                      <td class="px-4 py-3">
                        <Badge variant={log.level.toLowerCase() === 'error' ? 'error' : log.level.toLowerCase() === 'warn' ? 'warning' : 'info'}>
                          {log.level}
                        </Badge>
                      </td>
                      <td class="px-4 py-3 text-secondary group-hover:text-white transition-colors">{log.message}</td>
                    </tr>
                  )}
                </For>
                {searchResults().length === 0 && (
                  <tr>
                    <td colspan="4" class="px-4 py-20 text-center text-muted">
                      <Terminal size={48} class="mx-auto mb-4 opacity-20" />
                      <p>No results found for your query.</p>
                      <p class="text-xs mt-1 italic">Try expanding the time range or refining your search parameters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
