import { createSignal, onMount, For, Show } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Shield, GitCommit, RefreshCw, FileCheck, Lock } from "lucide-solid";
import { api, type BackendIntegrityBlock } from "../../services/api";

function fmtHex(bytes: string): string {
    if (!bytes) return "0x000...000";
    const s = typeof bytes === "string" ? bytes : "";
    if (s.startsWith("0x") || s.length > 16) return s.slice(0, 24) + "…";
    return "0x" + s.slice(0, 20) + "…";
}

function fmtBytes(b: string | number[]): string {
    if (!b) return "0x000…000";
    if (Array.isArray(b)) {
        return "0x" + b.slice(0, 10).map(n => n.toString(16).padStart(2, "0")).join("") + "…";
    }
    return String(b).slice(0, 24) + "…";
}

export default function MerkleExplorer() {
    const [blocks, setBlocks] = createSignal<BackendIntegrityBlock[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [verifying, setVerifying] = createSignal(false);
    const [chainValid, setChainValid] = createSignal<boolean | null>(null);

    const [pubKey, setPubKey] = createSignal("");

    const load = async () => {
        setLoading(true);
        const [data, key] = await Promise.all([
            api.listIntegrityBlocks(50),
            api.getForensicsPublicKey(),
        ]);
        setBlocks(data ?? []);
        setPubKey(key ?? "");
        setLoading(false);
    };

    onMount(load);

    const verifyChain = async () => {
        setVerifying(true);
        setChainValid(null);
        await new Promise(r => setTimeout(r, 800)); // visual pause
        // Basic client-side chain check: each block's prev_hash should match
        // the root_hash of the prior block
        const list = blocks();
        let valid = true;
        for (let i = 0; i < list.length - 1; i++) {
            const current = list[i];
            const older   = list[i + 1];
            if (JSON.stringify(current.prev_hash) !== JSON.stringify(older.root_hash)) {
                valid = false;
                break;
            }
        }
        setChainValid(valid);
        setVerifying(false);
    };

    const latestBlock = () => blocks()[0];
    const totalEvents = () => blocks().reduce((sum, b) => sum + (b.event_count ?? 0), 0);

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Merkle Explorer</h1>
                    <p class="text-sm text-muted mt-0.5">Cryptographic integrity verification for all forensic artifacts</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load}>
                        <GitCommit size={16} class="mr-2" /> Refresh Blocks
                    </Button>
                    <Button variant="primary" size="sm" onClick={verifyChain} disabled={verifying() || blocks().length === 0}>
                        <RefreshCw size={16} class={`mr-2 ${verifying() ? "animate-spin" : ""}`} />
                        {verifying() ? "Verifying…" : "Verify Chain"}
                    </Button>
                </div>
            </div>

            {/* Root hash card */}
            <Card class="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-accent/5 to-transparent">
                <div class="relative">
                    <div class={`w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/40 shadow-[0_0_32px_rgba(99,102,241,0.2)] ${verifying() ? "animate-pulse" : ""}`}>
                        <Shield class="text-accent" size={42} />
                    </div>
                    <Show when={latestBlock()}>
                        <div class="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-base flex items-center justify-center">
                            <FileCheck size={12} class="text-white" />
                        </div>
                    </Show>
                </div>

                <div>
                    <h2 class="text-xl font-bold text-white">Latest Root Hash</h2>
                    <p class="text-xs font-mono text-muted mt-2 max-w-lg break-all bg-black/40 p-3 rounded-lg border border-white/5">
                        <Show when={latestBlock()} fallback={<span class="opacity-40">No blocks sealed yet — events are being collected</span>}>
                            {fmtBytes(latestBlock()!.root_hash)}
                        </Show>
                    </p>
                </div>

                <div class="flex items-center gap-4 flex-wrap justify-center">
                    <Badge variant="info">Block #{latestBlock()?.id ?? "—"}</Badge>
                    <Badge variant="muted">{totalEvents().toLocaleString()} total events</Badge>
                    <Show when={chainValid() === true}>
                        <Badge variant="success">Chain Verified ✓</Badge>
                    </Show>
                    <Show when={chainValid() === false}>
                        <Badge variant="error">Chain Tampered ✗</Badge>
                    </Show>
                    <Show when={chainValid() === null && blocks().length > 0}>
                        <Badge variant="warning">Unverified</Badge>
                    </Show>
                </div>
            </Card>

            {/* Stats row */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card class="p-4 text-center">
                    <p class="text-2xl font-bold font-mono text-white">{blocks().length}</p>
                    <p class="text-xs text-muted mt-1 uppercase tracking-wider">Sealed Blocks</p>
                </Card>
                <Card class="p-4 text-center">
                    <p class="text-2xl font-bold font-mono text-white">{totalEvents().toLocaleString()}</p>
                    <p class="text-xs text-muted mt-1 uppercase tracking-wider">Events Indexed</p>
                </Card>
                <Card class="p-4 text-center">
                    <p class="text-2xl font-bold font-mono text-white">
                        {blocks()[0] ? new Date(blocks()[0].timestamp).toLocaleTimeString("en-GB", {hour12:false}) : "—"}
                    </p>
                    <p class="text-xs text-muted mt-1 uppercase tracking-wider">Last Seal</p>
                </Card>
                <Card class="p-4 text-center">
                    <p class="text-2xl font-bold font-mono text-white">
                        <Show when={chainValid() === true}><span class="text-emerald-400">✓ Valid</span></Show>
                        <Show when={chainValid() === false}><span class="text-red-400">✗ Invalid</span></Show>
                        <Show when={chainValid() === null}><span class="text-muted">—</span></Show>
                    </p>
                    <p class="text-xs text-muted mt-1 uppercase tracking-wider">Chain Status</p>
                </Card>
            </div>

            {/* Public key card */}
            <Show when={pubKey()}>
                <Card class="p-4 flex items-start gap-4 border-emerald-500/20 bg-emerald-950/20">
                    <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Lock size={18} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Ed25519 Signing Public Key (for external auditors)</p>
                        <p class="text-[11px] font-mono text-muted break-all select-all">{pubKey()}</p>
                    </div>
                </Card>
            </Show>

            {/* Block list */}
            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 class="font-semibold text-sm flex items-center gap-2">
                        <Lock size={16} class="text-accent" /> Integrity Block Chain
                    </h3>
                    <Badge variant="muted">{blocks().length} blocks</Badge>
                </div>

                <Show when={loading()}>
                    <div class="p-8 text-center text-muted text-sm animate-pulse">Loading blocks…</div>
                </Show>

                <Show when={!loading() && blocks().length === 0}>
                    <div class="p-8 text-center text-muted text-sm">
                        No blocks sealed yet. Blocks are created every 5 minutes or every 100 events.
                    </div>
                </Show>

                <Show when={!loading() && blocks().length > 0}>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-white/5 text-muted uppercase font-bold tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Block #</th>
                                    <th class="px-6 py-3">Root Hash</th>
                                    <th class="px-6 py-3">Prev Hash</th>
                                    <th class="px-6 py-3 text-right">Events</th>
                                    <th class="px-6 py-3 text-right">Timestamp</th>
                                    <th class="px-6 py-3 text-right">Signature</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <For each={blocks()}>
                                    {(block, i) => {
                                        const isValid = i() === 0 || (() => {
                                            const prev = blocks()[i() - 1];
                                            return JSON.stringify(block.root_hash) === JSON.stringify(prev?.prev_hash);
                                        })();
                                        return (
                                            <tr class="hover:bg-white/5 transition-colors group">
                                                <td class="px-6 py-4 font-mono font-bold text-accent">#{block.id}</td>
                                                <td class="px-6 py-4 font-mono text-emerald-400 max-w-[180px] truncate">
                                                    {fmtBytes(block.root_hash)}
                                                </td>
                                                <td class="px-6 py-4 font-mono text-muted max-w-[180px] truncate">
                                                    {block.id === 1 ? "genesis" : fmtBytes(block.prev_hash)}
                                                </td>
                                                <td class="px-6 py-4 text-right font-mono text-white">{block.event_count}</td>
                                                <td class="px-6 py-4 text-right font-mono text-muted">
                                                    {new Date(block.timestamp).toLocaleString("en-GB", {
                                                        day: "2-digit", month: "short",
                                                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
                                                    })}
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <Badge variant={block.signature ? "success" : "warning"}>
                                                        {block.signature ? "Signed" : "Unsigned"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    }}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </Card>
        </div>
    );
}
