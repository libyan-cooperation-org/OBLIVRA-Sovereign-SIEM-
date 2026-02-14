import { For } from "solid-js";
import { Card } from "../../../design-system/components/Card";
import { Button } from "../../../design-system/components/Button";
import { Users, UserPlus, Shield, MoreHorizontal, Search, Settings } from "lucide-solid";

export default function TeamSettings() {
    const members = [
        { id: "1", name: "Sanad Ali", email: "sanad@oblivra.loc", role: "Administrator", status: "online", lastActive: "Just now" },
        { id: "2", name: "Sarah Connor", email: "s.connor@sec.loc", role: "SOC Analyst", status: "offline", lastActive: "2 hours ago" },
    ];

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">Team Management</h1>
                        <p class="text-sm text-muted mt-0.5">Control access, roles, and collaboration for your SOC</p>
                    </div>
                </div>
                <Button variant="primary" size="sm"><UserPlus size={16} class="mr-2" /> Invite Member</Button>
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <div class="relative w-80">
                        <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input class="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent" placeholder="Search members..." />
                    </div>
                    <Button variant="outline" size="sm" class="h-8"><Settings size={14} class="mr-2" /> Roles</Button>
                </div>
                <table class="w-full text-left text-sm">
                    <thead class="bg-white/5 text-muted text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                            <th class="px-6 py-4">Member</th>
                            <th class="px-6 py-4">Email</th>
                            <th class="px-6 py-4">Role</th>
                            <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        <For each={members}>
                            {(m) => (
                                <tr class="hover:bg-white/5 transition-colors group">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3 text-white font-medium">{m.name}</div>
                                    </td>
                                    <td class="px-6 py-4 text-secondary text-xs">{m.email}</td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <Shield size={12} class="text-accent" />
                                            <span class="text-xs text-secondary">{m.role}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <button class="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white"><MoreHorizontal size={14} /></button>
                                    </td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
