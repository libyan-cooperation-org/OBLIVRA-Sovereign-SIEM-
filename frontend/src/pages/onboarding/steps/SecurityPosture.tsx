import { Shield, Target, Globe } from "lucide-solid";
import { Card } from "../../../design-system/components/Card";
import { Badge } from "../../../design-system/components/Badge";
import { For } from "solid-js";

interface SecurityPostureProps {
    data: { posture: string };
    updateData: (fields: Partial<{ posture: string }>) => void;
}

export default function SecurityPosture(props: SecurityPostureProps) {
    const postures = [
        {
            id: "sovereign",
            name: "Sovereign",
            icon: Shield,
            badge: "Air-Gapped",
            variant: "success",
            desc: "Maximum isolation. Zero internet dependency. Forensic integrity enabled by default.",
        },
        {
            id: "tactical",
            name: "Tactical",
            icon: Target,
            badge: "Connected",
            variant: "accent",
            desc: "Hybrid deployment. Local storage with secure cloud TI feed synchronization.",
        },
        {
            id: "connected",
            name: "Connected",
            icon: Globe,
            badge: "Standard",
            variant: "info",
            desc: "Standard SIEM operations. Integration with external logging and enterprise SSO.",
        },
    ];

    return (
        <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-gradient">Select your Security Posture</h2>
                <p class="text-secondary">This calibrates OBLIVRA's detection and retention engines.</p>
            </div>

            <div class="grid grid-cols-1 gap-4">
                <For each={postures}>
                    {(p) => (
                        <button
                            onClick={() => props.updateData({ posture: p.id })}
                            class={`text-left group transition-all duration-300 ${props.data.posture === p.id ? "scale-[1.01]" : "hover:translate-x-1"
                                }`}
                        >
                            <Card
                                class={`flex items-start gap-4 transition-all duration-300 ${props.data.posture === p.id
                                        ? "bg-accent/10 border-accent/50 ring-1 ring-accent/20"
                                        : "hover:bg-white/5 border-white/5"
                                    }`}
                            >
                                <div
                                    class={`p-3 rounded-xl transition-colors ${props.data.posture === p.id ? "bg-accent text-white" : "bg-white/5 text-muted group-hover:text-secondary"
                                        }`}
                                >
                                    <p.icon size={24} />
                                </div>
                                <div class="flex-1 space-y-1">
                                    <div class="flex items-center justify-between">
                                        <span class="font-bold text-lg">{p.name}</span>
                                        <Badge variant={p.variant as any}>{p.badge}</Badge>
                                    </div>
                                    <p class="text-sm text-secondary leading-relaxed">{p.desc}</p>
                                </div>
                            </Card>
                        </button>
                    )}
                </For>
            </div>
        </div>
    );
}
