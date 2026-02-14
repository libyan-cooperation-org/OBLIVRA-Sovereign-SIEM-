import { For } from "solid-js";
import { Card } from "../../../design-system/components/Card";
import { Button } from "../../../design-system/components/Button";
import { Badge } from "../../../design-system/components/Badge";
import { Share2, Webhook, Key, Terminal, Plus, Trash2, Edit2, ExternalLink } from "lucide-solid";

export default function IntegrationSettings() {
    const apiKeys = [
        { name: "Wazuh Backend", key: "ob_live_8f7b...2d31", created: "2024-01-12", status: "active" },
        { name: "Forensics Substation", key: "ob_live_1a2c...9901", created: "2024-02-01", status: "active" },
    ];

    const webhooks = [
        { name: "Slack Alerts", url: "https://hooks.slack.com/services/...", events: ["Alert Critical", "Case Opened"], status: "healthy" },
        { name: "JIRA Sync", url: "https://oblivra.atlassian.net/...", events: ["Case Resolved"], status: "warning" },
    ];

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center gap-6">
                <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Share2 size={32} />
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-white">Integrations & API</h1>
                    <p class="text-sm text-muted mt-0.5">Connect OBLIVRA to your security stack and automation tools</p>
                </div>
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <h3 class="font-semibold text-sm flex items-center gap-2"><Key size={18} class="text-amber-400" /> API Keys</h3>
                    <Button variant="outline" size="sm"><Plus size={14} class="mr-2" /> Generate New Key</Button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-4">Name</th>
                                <th class="px-6 py-4">API Key</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <For each={apiKeys}>
                                {(k) => (
                                    <tr class="hover:bg-white/5 transition-colors">
                                        <td class="px-6 py-4 font-medium text-white">{k.name}</td>
                                        <td class="px-6 py-4 font-mono text-xs text-secondary">{k.key}</td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex items-center justify-end gap-2">
                                                <button class="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white"><Edit2 size={14} /></button>
                                                <button class="p-1.5 rounded hover:bg-white/10 text-muted hover:text-red-400"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <h3 class="font-semibold text-sm flex items-center gap-2"><Webhook size={18} class="text-emerald-400" /> Webhooks</h3>
                    <Button variant="outline" size="sm"><Plus size={14} class="mr-2" /> Create Webhook</Button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th class="px-6 py-4">Destination</th>
                                <th class="px-6 py-4">Health</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <For each={webhooks}>
                                {(w) => (
                                    <tr class="hover:bg-white/5 transition-colors group">
                                        <td class="px-6 py-4">
                                            <span class="font-medium text-white">{w.name}</span>
                                        </td>
                                        <td class="px-6 py-4">
                                            <Badge variant={w.status === 'healthy' ? 'success' : 'warning'}>
                                                {w.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex items-center justify-end gap-2">
                                                <button class="p-1.5 rounded hover:bg-blue-500/20 text-blue-400"><ExternalLink size={14} /></button>
                                                <button class="p-1.5 rounded hover:bg-white/10 text-muted hover:text-red-400"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card class="p-6">
                <h4 class="font-bold text-white mb-4 flex items-center gap-2"><Terminal size={18} class="text-accent" /> Custom Integration Scripts</h4>
                <Button variant="outline" size="sm" class="w-full">Open Script Editor</Button>
            </Card>
        </div>
    );
}
