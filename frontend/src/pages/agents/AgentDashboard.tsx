import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { PulseIndicator } from "../../effects/index";
import { Server, Shield, Activity, Download, Plus, Search, Terminal, Settings2 } from "lucide-solid";
import { agentStore } from "../../stores/registry";

export default function AgentDashboard() {
  const { agents } = agentStore;
  const [search, setSearch] = createSignal("");

  const filteredAgents = () => agents().filter(a =>
    a.hostname.toLowerCase().includes(search().toLowerCase()) ||
    a.ip.includes(search())
  );

  return (
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gradient">Agent Fleet</h1>
          <p class="text-sm text-muted mt-0.5">Monitoring and managing Sovereign endpoint nodes</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download size={16} class="mr-2" /> Deployment Script
          </Button>
          <Button variant="primary" size="sm">
            <Plus size={16} class="mr-2" /> Add Agent
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><Server size={22} /></div>
          <div>
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Online Nodes</p>
            <p class="text-2xl font-bold font-mono text-white">{agents().filter(a => a.status === 'online').length}</p>
          </div>
        </Card>
        <Card class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Activity size={22} /></div>
          <div>
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Total Throughput</p>
            <p class="text-2xl font-bold font-mono text-white">4.2 GB/day</p>
          </div>
        </Card>
        <Card class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-accent/10 text-accent"><Shield size={22} /></div>
          <div>
            <p class="text-xs text-muted font-medium uppercase tracking-wider">Vulnerability Coverage</p>
            <p class="text-2xl font-bold font-mono text-white">92%</p>
          </div>
        </Card>
      </div>

      <Card class="p-0 overflow-hidden">
        <div class="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="relative w-full md:w-96">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Filter by hostname or IP..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              class="w-full bg-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="muted" class="cursor-pointer">All: {agents().length}</Badge>
            <Badge variant="success" class="cursor-pointer">Online: {agents().filter(a => a.status === 'online').length}</Badge>
            <Badge variant="warning" class="cursor-pointer">Throttled: {agents().filter(a => a.status === 'throttled').length}</Badge>
            <Badge variant="muted" class="cursor-pointer">Offline: {agents().filter(a => a.status === 'offline').length}</Badge>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Hostname</th>
                <th class="px-6 py-4">IP Address</th>
                <th class="px-6 py-4">OS Path</th>
                <th class="px-6 py-4 text-right">EPS</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <For each={filteredAgents()}>
                {(agent) => (
                  <tr class="hover:bg-white/5 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <PulseIndicator active={agent.status === 'online'} color={agent.status === 'online' ? '#22c55e' : agent.status === 'throttled' ? '#f97316' : '#64748b'} />
                        <span class="capitalize text-xs font-medium">{agent.status}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-col">
                        <span class="font-bold text-white font-mono">{agent.hostname}</span>
                        <span class="text-[10px] text-muted">v{agent.version} • {agent.id}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 font-mono text-secondary">{agent.ip}</td>
                    <td class="px-6 py-4 text-muted truncate max-w-[200px]">{agent.os}</td>
                    <td class="px-6 py-4 text-right">
                      <span class={`font-mono font-bold ${agent.eps > 1000 ? 'text-accent' : 'text-emerald-400'}`}>
                        {agent.eps} <span class="text-[10px] font-normal text-muted">avg</span>
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                          <Terminal size={14} />
                        </button>
                        <button class="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                          <Settings2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
