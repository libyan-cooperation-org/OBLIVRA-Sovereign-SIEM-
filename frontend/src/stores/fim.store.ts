import { createSignal } from "solid-js";

export interface FIMEntry {
  id: string;
  path: string;
  status: "clean" | "modified" | "deleted" | "new";
  hash: string;
  previousHash?: string;
  lastModified: Date;
  owner: string;
  permissions: string;
  size: number;
  severity: "critical" | "high" | "medium" | "info";
}

const mockFiles: FIMEntry[] = [
  { id: "f1", path: "/etc/passwd", status: "modified", hash: "sha256:d14a028c...", previousHash: "sha256:7f83b165...", lastModified: new Date(Date.now() - 7200000), owner: "root", permissions: "-rw-r--r--", size: 2847, severity: "critical" },
  { id: "f2", path: "/etc/shadow", status: "clean", hash: "sha256:9a4bfb32...", lastModified: new Date(Date.now() - 86400000), owner: "root", permissions: "-rw-------", size: 1203, severity: "info" },
  { id: "f3", path: "/etc/sudoers", status: "clean", hash: "sha256:ab3f7e21...", lastModified: new Date(Date.now() - 172800000), owner: "root", permissions: "-r--r-----", size: 894, severity: "info" },
  { id: "f4", path: "C:\\Windows\\System32\\drivers\\etc\\hosts", status: "modified", hash: "sha256:4c1f88ad...", previousHash: "sha256:2b3e9f77...", lastModified: new Date(Date.now() - 3600000), owner: "SYSTEM", permissions: "rw-r--r--", size: 3621, severity: "high" },
  { id: "f5", path: "/usr/bin/sudo", status: "clean", hash: "sha256:ee11cbb1...", lastModified: new Date(Date.now() - 604800000), owner: "root", permissions: "-rwsr-xr-x", size: 182056, severity: "info" },
  { id: "f6", path: "C:\\Windows\\System32\\cmd.exe", status: "new", hash: "sha256:cc3f9d22...", lastModified: new Date(Date.now() - 1800000), owner: "SYSTEM", permissions: "rwxr-xr-x", size: 298496, severity: "high" },
  { id: "f7", path: "/etc/crontab", status: "deleted", hash: "sha256:00000000...", lastModified: new Date(Date.now() - 900000), owner: "root", permissions: "-rw-r--r--", size: 0, severity: "medium" },
];

const [files, setFiles] = createSignal<FIMEntry[]>(mockFiles);
const [statusFilter, setStatusFilter] = createSignal<FIMEntry["status"] | "all">("all");

const filteredFiles = () => files().filter(f => statusFilter() === "all" || f.status === statusFilter());
const changeCount = () => files().filter(f => f.status !== "clean").length;

export const fimStore = { files, filteredFiles, statusFilter, setStatusFilter, changeCount };
