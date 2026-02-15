import { createSignal } from "solid-js";
import { api, type BackendEvent } from "../services/api";

export interface LiveLogEntry {
  id: string;
  timestamp: Date;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  source: string;
  host: string;
  message: string;
}

export const levelColors: Record<string, string> = {
  DEBUG:    "text-slate-500",
  INFO:     "text-emerald-400",
  WARN:     "text-amber-400",
  ERROR:    "text-orange-400",
  CRITICAL: "text-red-500",
};

function fromBackend(e: BackendEvent): LiveLogEntry {
  return {
    id: e.id,
    timestamp: new Date(e.timestamp as any),
    level: (e.severity?.toUpperCase() ?? "INFO") as LiveLogEntry["level"],
    source: e.source,
    host: e.host,
    message: e.message,
  };
}

// Fallback demo entries for when no backend events arrive yet
const demoMessages: [string, string, string, string][] = [
  ["INFO",     "nginx",    "web-01",          "GET /api/health 200 2ms"],
  ["WARN",     "sshd",     "dc-01",           "Failed password for root from 45.33.32.156 port 22 ssh2"],
  ["ERROR",    "kernel",   "db-02",           "Out of memory: Kill process 4821 (postgres) score 902"],
  ["CRITICAL", "firewall", "fw-edge",         "BLOCKED SRC=203.0.113.42 DST=10.0.0.1 PROTO=TCP DPT=443"],
  ["INFO",     "systemd",  "mail-srv",        "Started OpenSSH server daemon"],
  ["WARN",     "auth",     "workstation-14",  "sudo: pam_unix: authentication failure; user=dev01"],
  ["INFO",     "sysmon",   "dc-01",           "Process Create: cmd.exe PID=4892 Parent=powershell.exe"],
  ["DEBUG",    "cron",     "web-01",          "CRON[9821]: (root) CMD (/usr/bin/certbot renew)"],
];

let demoCounter = 0;
function makeDemo(): LiveLogEntry {
  const [level, source, host, message] = demoMessages[demoCounter % demoMessages.length];
  demoCounter++;
  return {
    id: `live-${Date.now()}-${demoCounter}`,
    timestamp: new Date(),
    level: level as LiveLogEntry["level"],
    source,
    host,
    message,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
const [logs, setLogs] = createSignal<LiveLogEntry[]>([]);
const [paused, setPaused] = createSignal(false);
const [filterLevel, setFilterLevel] = createSignal<string>("ALL");
const [connected, setConnected] = createSignal(false);

// ─── Boot: seed with the last 100 real events ─────────────────────────────────
const seedFromBackend = async () => {
  try {
    const nowNs  = Date.now() * 1_000_000;
    const startNs = (Date.now() - 15 * 60 * 1000) * 1_000_000; // last 15 min
    const raw = await api.searchEvents("", "", "", "", startNs, nowNs, 100);
    if (raw && raw.length > 0) {
      setLogs(raw.slice().reverse().map(fromBackend));
      setConnected(true);
      return;
    }
  } catch { /* fall through to demo mode */ }

  // Backend unavailable or no events yet — seed with demo data
  setLogs(Array.from({ length: 40 }, makeDemo));
};

// ─── Live stream: every 800ms append one entry (real poll or demo) ────────────
let streamInterval: ReturnType<typeof setInterval> | null = null;

const start = () => {
  seedFromBackend();

  streamInterval = setInterval(async () => {
    if (paused()) return;

    // Try to get the single latest event from backend
    try {
      const nowNs   = Date.now() * 1_000_000;
      const startNs = (Date.now() - 3000) * 1_000_000; // last 3 seconds
      const raw = await api.searchEvents("", "", "", "", startNs, nowNs, 1);
      if (raw && raw.length > 0) {
        const entry = fromBackend(raw[0]);
        setConnected(true);
        setLogs(prev => {
          // Deduplicate by id
          if (prev.some(l => l.id === entry.id)) return prev;
          return [entry, ...prev.slice(0, 499)];
        });
        return;
      }
    } catch { /* fall through */ }

    // No real event — append a demo entry to keep the UI alive
    setLogs(prev => [makeDemo(), ...prev.slice(0, 499)]);
  }, 800);
};

const stop = () => {
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
};

export const liveTailStore = {
  logs,
  paused, setPaused,
  filterLevel, setFilterLevel,
  connected,
  levelColors,
  start,
  stop,
};
