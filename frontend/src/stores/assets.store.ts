import { createSignal } from "solid-js";
import { api, type BackendAsset } from "../services/api";

export interface Asset {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  type: string;
  criticality: string;
  owner: string;
  lastSeen: Date;
  tags: string[];
}

function fromBackend(a: BackendAsset): Asset {
  let tags: string[] = [];
  try { tags = JSON.parse(a.Tags || "[]"); } catch { /* ignore */ }
  return {
    id: a.ID,
    hostname: a.Hostname,
    ip: a.IP,
    os: a.OS,
    type: a.Type,
    criticality: a.Criticality,
    owner: a.Owner,
    lastSeen: new Date(a.LastSeen),
    tags,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [assets, setAssets] = createSignal<Asset[]>([]);
const [loading, setLoading] = createSignal(false);

// ─── Actions ──────────────────────────────────────────────────────────────────
const load = async () => {
  setLoading(true);
  try {
    const raw = await api.listAssets(1000);
    setAssets(raw.map(fromBackend));
  } finally {
    setLoading(false);
  }
};

export const assetStore = { assets, loading, load };
