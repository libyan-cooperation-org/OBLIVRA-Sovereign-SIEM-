import { createSignal } from "solid-js";
import type { Asset } from "../types";

const [assets, setAssets] = createSignal<Asset[]>([
    { id: "as1", hostname: "srv-dc-01", ip: "10.0.0.10", type: "server", criticality: "crown_jewel", os: "Windows Server 2022", owner: "IT Infrastructure", lastSeen: new Date().toISOString() },
    { id: "as2", hostname: "srv-db-03", ip: "10.0.0.20", type: "server", criticality: "crown_jewel", os: "RHEL 9", owner: "Database Team", lastSeen: new Date().toISOString() },
]);

export const assetStore = {
    assets,
    setAssets,
    updateAsset: (updated: Asset) => setAssets(prev => prev.map(a => a.id === updated.id ? updated : a))
};
