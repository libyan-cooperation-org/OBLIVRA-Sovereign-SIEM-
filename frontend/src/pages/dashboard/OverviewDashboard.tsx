import { For, createSignal } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { PulseIndicator } from "../../effects/index";
import { dashboardStore, alertStore, agentStore } from "../../stores/registry";
import {
  Activity, AlertTriangle, Shield, Server, TrendingUp,
  Eye, Cpu, HardDrive, Zap, Globe, Target
} from "lucide-solid";

const severityColor = (s: string) => ({
  critical: "error", high: "warning", medium: "warning", low: "success", info: "info"
} as any)[s] ?? "muted";

const MiniSparkline = (props: { data: number[] }) => {
  const max = Math.max(...props.data);
  const w = 120, h = 36;
  const pts = props.data.map((v, i) => `${(i / (props.data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} class="overflow-visible">
      <polyline points={pts} fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

const RiskGauge = (props: { score: number }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const arc = (props.score / 100) * circ * 0.75;
  const color = props.score > 80 ? "#ef4444" : props.score > 50 ? "#f97316" : "#22c55e";
  return (
    <svg width="128" height="100" viewBox="0 0 128 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10"
        stroke-dasharray={`${circ * 0.75} ${circ}`} stroke-dashoffset={circ * 0.125} stroke-linecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} stroke-width="10"
        stroke-dasharray={`${arc} ${circ}`} stroke-dashoffset={circ * 0.125} stroke-linecap="round"
        style="transition: stroke-dasharray 0.8s ease" />
      <text x={cx} y={cy - 4} text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="JetBrains Mono">{props.score}</text>
      <text x={cx} y={cy + 14} text-anchor="middle" fill="#64748b" font-size="9" font-family="Inter">RISK SCORE</text>
    </svg>
  );
};

const GeoMap = () => {
  const dots = [
    { x: 20, y: 40, label: "US", color: "#6366f1" },
    { x: 48, y: 32, label: "EU", color: "#22c55e" },
    { x: 55, y: 38, label: "LY", color: "#ef4444" },
    { x: 68, y: 44, label: "CN", color: "#f97316" },
    { x: 78, y: 55, label: "AU", color: "#6366f1" },
  ];
  return (
    <div class="relative bg-white/5 rounded-lg overflow-hidden" style="height:120px">
      <svg viewBox="0 0 100 60" class="w-full h-full opacity-20">
        <rect width="100" height="60" fill="none" />
        {[10, 20, 30, 40, 50].map(y => <line x1="0" y1={y} x2="100" y2={y} stroke="white" stroke-width="0.2" />)}
        {[20, 40, 60, 80].map(x => <line x1={x} y1="0" x2={x} y2="60" stroke="white" stroke-width="0.2" />)}
      </svg>
      <For each={dots}>
        {(d) => (
          <div class="absolute flex flex-col items-center" style={`left:${d.x}%; top:${d.y}%;`}>
            <div class="w-2 h-2 rounded-full animate-ping absolute" style={`background:${d.color}; opacity:0.5`} />
            <div class="w-2 h-2 rounded-full relative" style={`background:${d.color}`} />
            <span class="text-[8px] mt-1 font-mono" style={`color:${d.color}`}>{d.label}</span>
          </div>
        )}
      </For>
    </div>
  );
};

const mitreData = [
  { tactic: "Initial Access", coverage: 72 },
  { tactic: "Execution", coverage: 88 },
  { tactic: "Persistence", coverage: 65 },
  { tactic: "Privilege Esc.", coverage: 91 },
  { tactic: "Defense Evasion", coverage: 54 },
  { tactic: "Lateral Movement", coverage: 78 },
  { tactic: "Exfiltration", coverage: 42 },
  { tactic: "C2", coverage: 69 },
];

export default function OverviewDashboard() {
  const { epsHistory, totalEvents, riskScore, activeAlertCount } = dashboardStore;
  const { alerts } = alertStore;
  const { agents } = agentStore;
  const onlineAgents = () => agents().filter(a => a.status === "online").length;
  const currentEps = () => epsHistory()[epsHistory().length - 1];
  const openAlerts = () => alerts().filter(a => a.status === "open");

  return (
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gradient">Command Center</h1>
          <p class="text-sm text-muted mt-0.5">Sovereign SIEM — Real-time operational overview</p>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <PulseIndicator /> SYSTEM NOMINAL
        </div>
      </div>

      {/* KPI Row */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Events/sec", value: currentEps().toLocaleString(), icon: Activity, sub: "+12% vs avg", color: "text-accent" },
          { label: "Total Events", value: (totalEvents() / 1e6).toFixed(2) + "M", icon: Zap, sub: "Last 30 days", color: "text-blue-400" },
          { label: "Active Alerts", value: activeAlertCount(), icon: AlertTriangle, sub: `${openAlerts().length} open`, color: "text-amber-400" },
          { label: "Agents Online", value: `${onlineAgents()}/${agents().length}`, icon: Server, sub: "1 throttled", color: "text-emerald-400" },
        ].map(kpi => (
          <Card class="flex items-center gap-4">
            <div class={`p-3 rounded-xl bg-white/5 ${kpi.color}`}><kpi.icon size={22} /></div>
            <div>
              <p class="text-xs text-muted font-medium">{kpi.label}</p>
              <p class={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
              <p class="text-[10px] text-muted">{kpi.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* EPS Sparkline */}
        <Card class="lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold">Event Ingestion Rate</h3>
              <p class="text-xs text-muted">Events per second — last 15 samples</p>
            </div>
            <span class="text-2xl font-bold font-mono text-accent">{currentEps().toLocaleString()} <span class="text-xs text-muted font-normal">EPS</span></span>
          </div>
          <div class="relative h-32 flex items-end">
            <For each={epsHistory()}>
              {(v, i) => {
                const max = Math.max(...epsHistory());
                const pct = (v / max) * 100;
                return (
                  <div class="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <div
                      class="w-full rounded-t transition-all duration-500"
                      style={{ height: `${pct}%`, background: `rgba(99,102,241,${0.3 + (pct / 100) * 0.7})` }}
                    />
                  </div>
                );
              }}
            </For>
          </div>
        </Card>

        {/* Risk Gauge */}
        <Card class="flex flex-col items-center justify-center gap-2">
          <h3 class="font-semibold self-start w-full">Organizational Risk</h3>
          <RiskGauge score={riskScore()} />
          <div class="grid grid-cols-3 gap-2 w-full mt-2">
            {[{ label: "Critical", v: "2", c: "text-red-400" }, { label: "High", v: "4", c: "text-amber-400" }, { label: "Open", v: "6", c: "text-accent" }].map(s => (
              <div class="text-center p-2 rounded-lg bg-white/5">
                <p class={`text-lg font-bold font-mono ${s.c}`}>{s.v}</p>
                <p class="text-[9px] text-muted uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <Card class="lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold flex items-center gap-2"><AlertTriangle size={16} class="text-amber-400" /> Recent Alerts</h3>
            <a href="/alerts" class="text-xs text-accent hover:underline">View all →</a>
          </div>
          <div class="space-y-2">
            <For each={openAlerts().slice(0, 5)}>
              {(alert) => (
                <div class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <Badge variant={severityColor(alert.severity)}>{alert.severity}</Badge>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">{alert.title}</p>
                    <p class="text-xs text-muted">{alert.source} • {alert.mitre}</p>
                  </div>
                  <span class="text-[10px] text-muted font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              )}
            </For>
          </div>
        </Card>

        {/* Geo Map */}
        <Card>
          <h3 class="font-semibold mb-4 flex items-center gap-2"><Globe size={16} class="text-blue-400" /> Geographic Activity</h3>
          <GeoMap />
          <div class="mt-3 space-y-1.5">
            {[["Libya (LY)", "#ef4444", "247 events"], ["United States", "#6366f1", "1,204 events"], ["EU Region", "#22c55e", "89 events"]].map(([name, color, count]) => (
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full" style={`background:${color}`} /><span class="text-secondary">{name}</span></div>
                <span class="text-muted font-mono">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MITRE Coverage */}
        <Card>
          <h3 class="font-semibold mb-4 flex items-center gap-2"><Target size={16} class="text-accent" /> MITRE ATT&amp;CK Coverage</h3>
          <div class="space-y-2.5">
            <For each={mitreData}>
              {(m) => (
                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-secondary">{m.tactic}</span>
                    <span class="text-muted font-mono">{m.coverage}%</span>
                  </div>
                  <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700"
                      style={{ width: `${m.coverage}%`, background: m.coverage > 75 ? "#22c55e" : m.coverage > 50 ? "#6366f1" : "#f97316" }} />
                  </div>
                </div>
              )}
            </For>
          </div>
        </Card>

        {/* Agent Health */}
        <Card>
          <h3 class="font-semibold mb-4 flex items-center gap-2"><Server size={16} class="text-emerald-400" /> Agent Fleet</h3>
          <div class="space-y-2">
            <For each={agentStore.agents().slice(0, 5)}>
              {(agent) => (
                <div class="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <PulseIndicator active={agent.status === "online"} color={agent.status === "online" ? "#22c55e" : agent.status === "throttled" ? "#f97316" : "#64748b"} />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white font-mono">{agent.hostname}</p>
                    <p class="text-xs text-muted">{agent.ip}</p>
                  </div>
                  <span class="text-xs font-mono text-accent">{agent.eps} EPS</span>
                  <Badge variant={agent.status === "online" ? "success" : agent.status === "throttled" ? "warning" : "muted"}>{agent.status}</Badge>
                </div>
              )}
            </For>
          </div>
        </Card>
      </div>
    </div>
  );
}
