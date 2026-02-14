import { createSignal } from "solid-js";

export interface NetflowRecord {
  id: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: "TCP" | "UDP" | "ICMP";
  bytes: number;
  packets: number;
  duration: number;
  timestamp: Date;
  country?: string;
  threat?: boolean;
}

const generateFlows = (): NetflowRecord[] => {
  const ips = ["10.0.0.5", "10.0.1.12", "192.168.1.45", "45.33.32.156", "203.0.113.42", "10.0.2.88", "172.16.0.3"];
  const protos: NetflowRecord["protocol"][] = ["TCP", "TCP", "TCP", "UDP", "ICMP"];
  return Array.from({ length: 100 }, (_, i) => ({
    id: `flow-${i}`,
    srcIp: ips[i % ips.length],
    dstIp: ips[(i + 3) % ips.length],
    srcPort: Math.floor(Math.random() * 60000 + 1024),
    dstPort: [80, 443, 22, 3389, 8080, 53, 25][i % 7],
    protocol: protos[i % protos.length],
    bytes: Math.floor(Math.random() * 1000000),
    packets: Math.floor(Math.random() * 1000),
    duration: Math.floor(Math.random() * 300),
    timestamp: new Date(Date.now() - i * 5000),
    country: i % 7 === 0 ? "Russia" : i % 5 === 0 ? "China" : "Local",
    threat: i % 11 === 0,
  }));
};

const [flows, setFlows] = createSignal<NetflowRecord[]>(generateFlows());
const [selectedFlow, setSelectedFlow] = createSignal<string | null>(null);

const topTalkers = () => {
  const map = new Map<string, number>();
  flows().forEach(f => { map.set(f.srcIp, (map.get(f.srcIp) || 0) + f.bytes); });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([ip, bytes]) => ({ ip, bytes }));
};

const bandwidthHistory = Array.from({ length: 30 }, (_, i) => ({
  time: `${String(i * 2).padStart(2, "0")}:00`,
  inbound: Math.floor(Math.random() * 500 + 100),
  outbound: Math.floor(Math.random() * 200 + 50),
}));

export const netflowStore = { flows, selectedFlow, setSelectedFlow, topTalkers, bandwidthHistory };
