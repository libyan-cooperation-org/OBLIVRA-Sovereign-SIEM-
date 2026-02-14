import { createSignal, For, onMount, onCleanup } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Shield, Power, Wifi, Monitor, Cpu, HardDrive, History } from "lucide-solid";

export default function RemoteShell() {
    const [lines, setLines] = createSignal<string[]>([
        "OBLIVRA Sovereign SIEM - Remote Shell v2.4",
        "Connecting to secure bridge node [10.255.0.1]...",
        "Authentication successful. Session established.",
        "Target: srv-dc-01 (10.0.0.10) [Windows Server 2022]",
        "",
        "C:\\Users\\Administrator> "
    ]);

    const [input, setInput] = createSignal("");
    let terminalEnd: HTMLDivElement | undefined;

    const handleCommand = (e: KeyboardEvent) => {
        if (e.key === "Enter" && input().trim()) {
            const cmd = input().trim();
            setLines(l => [...l, `C:\\Users\\Administrator> ${cmd}`]);

            // Mock command response
            setTimeout(() => {
                if (cmd.toLowerCase() === "whoami") {
                    setLines(l => [...l, "oblivra\\administrator"]);
                } else if (cmd.toLowerCase() === "ipconfig") {
                    setLines(l => [...l, "Ethernet adapter Ethernet0:", "   IPv4 Address. . . . . . . . . . . : 10.0.0.10", "   Subnet Mask . . . . . . . . . . . : 255.255.255.0"]);
                } else {
                    setLines(l => [...l, `'${cmd}' is not recognized as an internal or external command,`, "operable program or batch file."]);
                }
                setLines(l => [...l, ""]);
            }, 100);

            setInput("");
        }
    };

    onMount(() => {
        const interval = setInterval(() => {
            if (terminalEnd) terminalEnd.scrollIntoView({ behavior: "smooth" });
        }, 100);
        onCleanup(() => clearInterval(interval));
    });

    return (
        <div class="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
            <div class="flex items-center justify-between shrink-0">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Remote Shell</h1>
                    <p class="text-sm text-muted mt-0.5">Secure, audited terminal access to managed endpoints</p>
                </div>
                <div class="flex items-center gap-2">
                    <Badge variant="success" class="h-6 flex items-center gap-1.5"><Wifi size={10} /> ENCRYPTED SESSION</Badge>
                    <Button variant="danger" size="sm"><Power size={14} class="mr-2" /> Terminate</Button>
                </div>
            </div>

            <div class="flex-1 flex gap-4 overflow-hidden">
                <Card class="flex-1 bg-[#050505] border-white/5 p-0 overflow-hidden flex flex-col relative ring-1 ring-white/5 shadow-2xl">
                    <div class="p-2 border-b border-white/5 bg-white/2 flex items-center justify-between shrink-0">
                        <div class="flex items-center gap-2 px-2">
                            <div class="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                            <div class="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                        </div>
                        <span class="text-[10px] font-mono text-muted uppercase tracking-widest">Administrator@srv-dc-01</span>
                        <div class="w-12" />
                    </div>

                    <div class="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed custom-scrollbar selection:bg-accent/40">
                        <For each={lines()}>
                            {(line) => (
                                <div class={line.startsWith("C:\\") ? "text-accent" : "text-secondary/90 whitespace-pre-wrap"}>
                                    {line}
                                </div>
                            )}
                        </For>

                        <div class="flex items-center mt-1">
                            <span class="text-accent pr-2">C:\Users\Administrator&gt;</span>
                            <input
                                type="text"
                                value={input()}
                                onInput={(e) => setInput(e.currentTarget.value)}
                                onKeyDown={handleCommand}
                                class="bg-transparent border-none outline-none flex-1 text-white caret-accent"
                                autofocus
                            />
                        </div>
                        <div ref={terminalEnd} class="h-4" />
                    </div>

                    <div class="p-3 border-t border-white/5 bg-white/2 flex items-center justify-between shrink-0">
                        <div class="flex gap-4">
                            <div class="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                                <Cpu size={12} class="text-accent" /> CPU: 12%
                            </div>
                            <div class="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                                <Monitor size={12} class="text-accent" /> MEM: 4.2GB
                            </div>
                            <div class="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                                <HardDrive size={12} class="text-accent" /> DISK: 88GB FREE
                            </div>
                        </div>
                        <span class="text-[9px] text-muted font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">LATENCY: 14ms</span>
                    </div>
                </Card>

                <Card class="w-80 p-0 flex flex-col overflow-hidden shrink-0">
                    <div class="p-4 border-b border-white/5">
                        <h3 class="font-semibold text-sm flex items-center gap-2"><History size={16} class="text-accent" /> Toolbelt & History</h3>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider">Quick Commands</label>
                            <div class="grid grid-cols-1 gap-2">
                                {["Get-Process", "Get-Service", "Test-Connection", "Restart-Service"].map(cmd => (
                                    <button class="w-full text-left p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-secondary hover:text-white hover:border-accent/40 transition-all font-mono">
                                        {cmd}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div class="space-y-3">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider">Session Audit Log</label>
                            <div class="space-y-2">
                                <div class="p-2 rounded-lg bg-accent/5 border border-accent/10">
                                    <p class="text-[9px] text-accent font-bold mb-1">AUDIT SUCCESS</p>
                                    <p class="text-[10px] text-secondary">Elevation to SYSTEM requested and logged.</p>
                                </div>
                                <div class="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                    <p class="text-[9px] text-amber-500 font-bold mb-1">SENSITIVE ACCESS</p>
                                    <p class="text-[10px] text-secondary">Accessed C:\Windows\System32\config</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 border-t border-white/5">
                        <Button variant="outline" class="w-full h-9 flex items-center justify-center gap-2 text-[11px] font-bold">
                            <Shield size={14} /> EXPORT SESSION AUDIT
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}


