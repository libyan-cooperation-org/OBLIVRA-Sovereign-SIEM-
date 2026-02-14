import { createSignal } from "solid-js";

export interface LiveLogEntry {
  id: string;
  timestamp: Date;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  source: string;
  host: string;
  message: string;
}

const levelColors: Record<string, string> = {
  DEBUG: "text-slate-500",
  INFO: "text-emerald-400",
  WARN: "text-amber-400",
  ERROR: "text-orange-400",
  CRITICAL: "text-red-500",
};

const messages = [
  ["INFO", "nginx", "web-01", "GET /api/health 200 2ms"],
  ["WARN", "sshd", "dc-01", "Failed password for root from 45.33.32.156 port 22 ssh2"],
  ["ERROR", "kernel", "db-02", "Out of memory: Kill process 4821 (postgres) score 902 or sacrifice child"],
  ["CRITICAL", "firewall", "fw-edge", "BLOCKED SRC=203.0.113.42 DST=10.0.0.1 PROTO=TCP DPT=443"],
  ["INFO", "systemd", "mail-srv", "Started OpenSSH server daemon"],
  ["WARN", "auth", "workstation-14", "sudo: pam_unix(sudo:auth): authentication failure; user=dev01"],
  ["INFO", "sysmon", "dc-01", "Process Create: cmd.exe PID=4892 Parent=powershell.exe"],
  ["DEBUG", "cron", "web-01", "CRON[9821]: (root) CMD (/usr/bin/certbot renew)"],
];

let counter = 0;
const generateEntry = (): LiveLogEntry => {
  const [level, source, host, message] = messages[counter % messages.length];
  counter++;
  return { id: `live-${Date.now()}-${counter}`, timestamp: new Date(), level: level as LiveLogEntry["level"], source, host, message };
};

const [logs, setLogs] = createSignal<LiveLogEntry[]>(Array.from({ length: 80 }, generateEntry));
const [paused, setPaused] = createSignal(false);
const [filterLevel, setFilterLevel] = createSignal<string>("ALL");

let intervalId: ReturnType<typeof setInterval>;

const start = () => {
  intervalId = setInterval(() => {
    if (!paused()) {
      setLogs(prev => [generateEntry(), ...prev.slice(0, 499)]);
    }
  }, 800);
};

const stop = () => clearInterval(intervalId);

export const liveTailStore = { logs, paused, setPaused, filterLevel, setFilterLevel, start, stop, levelColors };
