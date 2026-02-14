import { For } from "solid-js";
import { Card } from "../../../design-system/components/Card";
import { Badge } from "../../../design-system/components/Badge";
import { Shield, Eye, Clock, Smartphone, Lock } from "lucide-solid";

export default function SecuritySettings() {
    const sessions = [
        { id: "1", browser: "Chrome / Windows", ip: "10.0.0.142", lastActive: "Just now", current: true },
        { id: "2", browser: "Firefox / macOS", ip: "192.168.1.12", lastActive: "2 hours ago", current: false },
    ];

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center gap-6">
                <div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <Shield class="w-8 h-8" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-white">Security & Access</h1>
                    <p class="text-sm text-muted mt-0.5">Manage authentication, MFA, and active sessions</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card class="p-6 space-y-6">
                    <h3 class="font-bold text-white flex items-center gap-2"><Lock class="w-[18px] h-[18px] text-accent" /> Multi-Factor Authentication</h3>
                    <div class="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="p-2 rounded-lg bg-accent/20 text-accent"><Smartphone class="w-5 h-5" /></div>
                            <div>
                                <p class="text-xs font-bold text-white">Authenticator App (TOTP)</p>
                                <p class="text-[10px] text-muted">Google Authenticator, Authy, or Microsoft Authenticator</p>
                            </div>
                        </div>
                        <Badge variant="success">ENABLED</Badge>
                    </div>
                </Card>

                <Card class="p-6 space-y-4">
                    <h3 class="font-bold text-white flex items-center gap-2"><Clock class="w-[18px] h-[18px] text-accent" /> Active Sessions</h3>
                    <div class="space-y-3">
                        <For each={sessions}>
                            {(s) => (
                                <div class="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between group">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 rounded-md bg-white/5 text-secondary group-hover:text-white transition-colors">
                                            <Eye class="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p class="text-xs font-bold text-white">{s.browser}</p>
                                            <p class="text-[10px] text-muted font-mono">{s.ip} • {s.lastActive}</p>
                                        </div>
                                    </div>
                                    {s.current ? (
                                        <Badge variant="accent">THIS DEVICE</Badge>
                                    ) : (
                                        <button class="text-[10px] font-bold text-red-400 hover:underline">Revoke</button>
                                    )}
                                </div>
                            )}
                        </For>
                    </div>
                </Card>
            </div>
        </div>
    );
}
