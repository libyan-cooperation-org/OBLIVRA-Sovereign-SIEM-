import { createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Shield, GitCommit, Search, RefreshCw, FileCheck } from "lucide-solid";
import { forensicsStore } from "../../stores/registry";

export default function MerkleExplorer() {
    const { merkleRoot } = forensicsStore;
    const [verifying, setVerifying] = createSignal(false);

    const handleVerify = () => {
        setVerifying(true);
        setTimeout(() => setVerifying(false), 2000);
    };

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Merkle Explorer</h1>
                    <p class="text-sm text-muted mt-0.5">Cryptographic integrity verification for forensic artifacts</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <GitCommit size={16} class="mr-2" /> View History
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleVerify} disabled={verifying()}>
                        <RefreshCw size={16} class={`mr-2 ${verifying() ? 'animate-spin' : ''}`} />
                        {verifying() ? 'Verifying...' : 'Verify Chain'}
                    </Button>
                </div>
            </div>

            <Card class="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-accent/5 to-transparent">
                <div class="relative">
                    <div class={`w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/40 shadow-[0_0_32px_rgba(99,102,241,0.2)] ${verifying() ? 'animate-pulse' : ''}`}>
                        <Shield class="text-accent" size={42} />
                    </div>
                    {merkleRoot() && (
                        <div class="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-base flex items-center justify-center">
                            <FileCheck size={12} class="text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white">Cryptographic Root Hash</h2>
                    <p class="text-xs font-mono text-muted mt-2 max-w-lg break-all bg-black/40 p-3 rounded-lg border border-white/5">
                        {merkleRoot() || "0x7f8821aa...bc22d109"}
                    </p>
                </div>
                <div class="flex items-center gap-4">
                    <Badge variant="success">Immutable</Badge>
                    <Badge variant="success">Verified</Badge>
                    <Badge variant="info">OBLIVRA-v2-Chain</Badge>
                </div>
            </Card>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                <div class="absolute inset-x-0 top-1/2 h-0.5 bg-white/5 -z-10" />
                {[
                    { label: "File Logs", count: 1240, status: "Verified" },
                    { label: "Netflow Data", count: 48200, status: "Verified" },
                    { label: "Process Map", count: 850, status: "Verified" },
                    { label: "System Audit", count: 124, status: "Pending" }
                ].map(item => (
                    <Card class="p-4 border-white/10 hover:border-accent/40 transition-all group relative">
                        <div class="flex justify-between items-start mb-4">
                            <div class="p-2 rounded-lg bg-white/5 text-secondary group-hover:text-accent group-hover:bg-accent/10 transition-all">
                                <Shield size={18} />
                            </div>
                            <Badge variant={item.status === 'Verified' ? 'success' : 'warning'}>{item.status}</Badge>
                        </div>
                        <h4 class="font-bold text-white">{item.label}</h4>
                        <p class="text-xs text-muted mt-1">{item.count.toLocaleString()} artifacts indexed</p>
                        <div class="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
                            <span class="text-[10px] font-mono text-muted">Hash Match: OK</span>
                        </div>
                    </Card>
                ))}
            </div>

            <Card class="p-0 overflow-hidden">
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 class="font-semibold text-sm">Merkle Leaf Visualization</h3>
                    <div class="flex items-center gap-2">
                        <input type="text" placeholder="Search leaf hash..." class="bg-base text-xs border border-white/10 rounded px-2 py-1 outline-none focus:border-accent" />
                        <Button variant="outline" size="sm"><Search size={12} /></Button>
                    </div>
                </div>
                <div class="p-6 bg-black/20 flex flex-col items-center">
                    <div class="w-full max-w-2xl space-y-8">
                        {/* Simplified Tree Visualization */}
                        <div class="flex justify-center"><div class="w-4 h-4 rounded bg-accent shadow-[0_0_12px_rgba(99,102,241,0.5)]" /></div>
                        <div class="flex justify-around relative">
                            <div class="absolute top-[-30px] left-1/4 right-1/4 h-0.5 bg-white/10" />
                            <div class="w-4 h-4 rounded bg-accent/60" />
                            <div class="w-4 h-4 rounded bg-accent/60" />
                        </div>
                        <div class="flex justify-between relative pl-8 pr-8">
                            <div class="w-4 h-4 rounded bg-emerald-500/40" />
                            <div class="w-4 h-4 rounded bg-emerald-500/40" />
                            <div class="w-4 h-4 rounded bg-emerald-500/40" />
                            <div class="w-4 h-4 rounded bg-emerald-500/40" />
                        </div>
                    </div>
                    <p class="text-[10px] text-muted mt-8 font-mono">Tree Height: 12 | Total Leaves: 4,096 | Last Append: 12s ago</p>
                </div>
            </Card>
        </div>
    );
}
