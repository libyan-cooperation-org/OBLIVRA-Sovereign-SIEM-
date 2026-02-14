import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Terminal, Send, History, Code, Copy, ChevronRight, Zap } from "lucide-solid";

export default function APILab() {
    const [method, setMethod] = createSignal("POST");
    const [endpoint, setEndpoint] = createSignal("/api/v1/telemetry/ingest");
    const [payload, setPayload] = createSignal('{\n  "source": "manual-test",\n  "event": "HEARTBEAT",\n  "data": {\n    "status": "nominal",\n    "user": "admin"\n  }\n}');

    return (
        <div class="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-10rem)] flex flex-col">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">API Lab</h1>
                    <p class="text-sm text-muted mt-0.5">Developer tools for raw ingestion testing and API exploration</p>
                </div>
                <div class="flex items-center gap-2">
                    <Badge variant="outline" class="font-mono selection:bg-accent/20">X-API-KEY: OBL-****-****</Badge>
                </div>
            </div>

            <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                <Card class="flex flex-col p-0 overflow-hidden border-white/10">
                    <div class="p-3 bg-white/5 border-b border-white/5 flex items-center gap-3">
                        <div class="flex items-center bg-base rounded-md border border-white/10 overflow-hidden">
                            <select
                                value={method()}
                                onChange={(e) => setMethod(e.currentTarget.value)}
                                class="bg-transparent text-[11px] font-bold px-3 py-1.5 outline-none cursor-pointer text-emerald-400"
                            >
                                <option>GET</option>
                                <option>POST</option>
                                <option>PUT</option>
                                <option>DELETE</option>
                            </select>
                            <input
                                type="text"
                                value={endpoint()}
                                onInput={(e) => setEndpoint(e.currentTarget.value)}
                                class="bg-transparent text-[11px] font-mono px-4 py-1.5 outline-none w-64 border-l border-white/10"
                            />
                        </div>
                        <div class="flex-1" />
                        <button class="p-1.5 rounded bg-accent text-white hover:bg-accent/80 transition-all shadow-lg shadow-accent/20">
                            <Send size={14} />
                        </button>
                    </div>

                    <div class="flex-1 flex flex-col bg-black/40 p-4 font-mono text-xs">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-muted uppercase font-bold text-[10px] tracking-widest">Request Body (JSON)</span>
                            <button class="text-muted hover:text-white transition-colors"><Copy size={12} /></button>
                        </div>
                        <textarea
                            class="flex-1 bg-transparent resize-none outline-none text-blue-300 custom-scrollbar selection:bg-accent/30"
                            value={payload()}
                            onInput={(e) => setPayload(e.currentTarget.value)}
                        />
                    </div>
                </Card>

                <Card class="flex flex-col p-0 overflow-hidden border-white/10">
                    <div class="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Terminal size={14} class="text-accent" />
                            <span class="text-xs font-bold text-white">Response Console</span>
                        </div>
                        <Badge variant="success">200 OK — 14ms</Badge>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 font-mono text-xs bg-black/60 custom-scrollbar">
                        <div class="text-[10px] text-muted mb-4 uppercase font-bold tracking-widest">Headers</div>
                        <div class="space-y-1 mb-6">
                            <div class="flex gap-4"><span class="text-secondary w-32">Content-Type:</span> <span class="text-white">application/json</span></div>
                            <div class="flex gap-4"><span class="text-secondary w-32">X-OBL-TraceID:</span> <span class="text-white">tr-882194-zx</span></div>
                            <div class="flex gap-4"><span class="text-secondary w-32">Server:</span> <span class="text-white">OBLIVRA-Core/2.1</span></div>
                        </div>
                        <div class="text-[10px] text-muted mb-2 uppercase font-bold tracking-widest">Body</div>
                        <pre class="text-emerald-400 selection:bg-accent/30">
                            {`{
  "status": "success",
  "received_at": "${new Date().toISOString()}",
  "processed": true,
  "events": 1
}`}
                        </pre>
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card class="p-3 flex items-center justify-between group cursor-pointer hover:border-accent/30 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded bg-white/5 text-muted group-hover:text-amber-400 transition-colors"><History size={16} /></div>
                        <div class="flex flex-col">
                            <span class="text-[11px] font-bold text-white">Ingest Test</span>
                            <span class="text-[9px] text-muted">POST /api/v1/telemetry/ingest</span>
                        </div>
                    </div>
                    <ChevronRight size={14} class="text-muted group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </Card>
                <Card class="p-3 flex items-center justify-between group cursor-pointer hover:border-accent/30 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded bg-white/5 text-muted group-hover:text-emerald-400 transition-colors"><Code size={16} /></div>
                        <div class="flex flex-col">
                            <span class="text-[11px] font-bold text-white">Auth Check</span>
                            <span class="text-[9px] text-muted">GET /api/v1/health/auth</span>
                        </div>
                    </div>
                    <ChevronRight size={14} class="text-muted group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </Card>
                <Card class="p-3 flex items-center justify-between group cursor-pointer hover:border-accent/30 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded bg-white/5 text-muted group-hover:text-accent transition-colors"><Zap size={16} /></div>
                        <div class="flex flex-col">
                            <span class="text-[11px] font-bold text-white">Flush Buffers</span>
                            <span class="text-[9px] text-muted">POST /internal/control/flush</span>
                        </div>
                    </div>
                    <ChevronRight size={14} class="text-muted group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </Card>
            </div>
        </div>
    );
}
