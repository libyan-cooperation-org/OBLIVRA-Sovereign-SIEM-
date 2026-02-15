import { createSignal } from "solid-js";
import { api, type BackendAudit } from "../services/api";

export interface EvidenceEntry {
  id: string;
  caseId: string;
  eventId: string;
  recordedBy: string;
  reason: string;
  rawHash: string;
  createdAt: Date;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: Date;
}

function auditFromBackend(a: BackendAudit): AuditEntry {
  return {
    id: a.ID,
    userId: a.UserID,
    action: a.Action,
    targetType: a.TargetType,
    targetId: a.TargetID,
    details: a.Details,
    timestamp: new Date(a.Timestamp as any),
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [evidence, setEvidence] = createSignal<EvidenceEntry[]>([]);
const [auditLog, setAuditLog] = createSignal<AuditEntry[]>([]);
const [merkleRoot, setMerkleRoot] = createSignal<string | null>(null);
const [loading, setLoading] = createSignal(false);
const [report, setReport] = createSignal<string | null>(null);
const [generating, setGenerating] = createSignal(false);

// ─── Actions ─────────────────────────────────────────────────────────────────
const loadAuditLog = async (limit = 200) => {
  setLoading(true);
  try {
    const raw = await api.listAuditLogs(limit);
    setAuditLog(raw.map(auditFromBackend));
  } finally {
    setLoading(false);
  }
};

const captureEvidence = async (caseId: string, eventId: string, reason: string) => {
  await api.addEvidence(caseId, eventId, reason);
  // Refresh audit log to show the new entry
  await loadAuditLog();
};

const generateReport = async (caseId: string): Promise<string> => {
  setGenerating(true);
  try {
    const md = await api.generateReport(caseId);
    setReport(md);
    return md;
  } finally {
    setGenerating(false);
  }
};

export const forensicsStore = {
  evidence, setEvidence,
  auditLog,
  merkleRoot, setMerkleRoot,
  loading,
  report,
  generating,
  loadAuditLog,
  captureEvidence,
  generateReport,
};
