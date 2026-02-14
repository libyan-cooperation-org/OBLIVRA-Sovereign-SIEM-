import { createSignal } from "solid-js";

export interface Evidence {
    id: string;
    name: string;
    type: string;
    size: number;
    collectedAt: string;
    hash: string;
}

const [evidence, setEvidence] = createSignal<Evidence[]>([]);
const [merkleRoot, setMerkleRoot] = createSignal<string | null>(null);

export const forensicsStore = {
    evidence,
    setEvidence,
    merkleRoot,
    setMerkleRoot,
    addEvidence: (item: Evidence) => setEvidence(prev => [...prev, item])
};
