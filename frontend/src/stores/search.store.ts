import { createSignal } from "solid-js";

export interface SearchResult {
  id: string;
  timestamp: Date;
  source: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  host: string;
  message: string;
  fields: Record<string, string>;
}

export interface TimelineBucket {
  time: string;
  count: number;
}

const generateLogs = (): SearchResult[] => {
  const sources = ["nginx", "sshd", "kernel", "sysmon", "firewall", "auth", "cron", "systemd"];
  const levels: SearchResult["level"][] = ["DEBUG", "INFO", "INFO", "INFO", "WARN", "ERROR", "CRITICAL"];
  const hosts = ["web-01", "db-02", "dc-01", "fw-edge", "workstation-14", "mail-srv"];
  const msgs = [
    "Connection established from 192.168.1.45 port 54321",
    "Failed password for root from 45.33.32.156 port 22",
    "Accepted publickey for deploy from 10.0.0.5",
    "GET /api/v2/users 200 124ms",
    "POST /login 401 Unauthorized",
    "Firewall rule BLOCKED src=203.0.113.42 dst=10.0.0.1 port=443",
    "Process spawned: cmd.exe parent=explorer.exe pid=4892",
    "Registry modified: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
    "SSL certificate expiry in 7 days: api.example.com",
    "Disk usage at 89% on /dev/sda1",
  ];
  return Array.from({ length: 200 }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 15000),
    source: sources[i % sources.length],
    level: levels[i % levels.length],
    host: hosts[i % hosts.length],
    message: msgs[i % msgs.length],
    fields: { pid: `${1000 + i}`, user: i % 3 === 0 ? "root" : "deploy" },
  }));
};

const [query, setQuery] = createSignal("");
const [results, setResults] = createSignal<SearchResult[]>(generateLogs());
const [loading, setLoading] = createSignal(false);
const [selectedResult, setSelectedResult] = createSignal<string | null>(null);

const timelineBuckets: TimelineBucket[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  count: Math.floor(Math.random() * 500 + 50),
}));

const executeSearch = (q: string) => {
  setLoading(true);
  setQuery(q);
  setTimeout(() => {
    const all = generateLogs();
    setResults(q ? all.filter(r => r.message.toLowerCase().includes(q.toLowerCase()) || r.source.includes(q)) : all);
    setLoading(false);
  }, 400);
};

export const searchStore = { query, results, loading, selectedResult, setSelectedResult, timelineBuckets, executeSearch };
