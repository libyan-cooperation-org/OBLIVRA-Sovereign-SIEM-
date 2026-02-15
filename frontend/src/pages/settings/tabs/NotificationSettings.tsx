import { createSignal, onMount, Show } from "solid-js";
import { Card } from "../../../design-system/components/Card";
import { Mail, MessageSquare, AlertTriangle, Save, RefreshCw, Check } from "lucide-solid";
import { api } from "../../../services/api";
import { addToast } from "../../../stores/registry";

interface NotifCfg {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_from: string;
    smtp_to: string;
    smtp_tls: boolean;
    slack_webhook: string;
    slack_channel: string;
    teams_webhook: string;
    min_severity: string;
}

const SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function NotificationSettings() {
    const empty: NotifCfg = {
        smtp_host: "", smtp_port: 587, smtp_user: "", smtp_password: "",
        smtp_from: "", smtp_to: "", smtp_tls: true,
        slack_webhook: "", slack_channel: "", teams_webhook: "",
        min_severity: "HIGH",
    };

    const [cfg, setCfg] = createSignal<NotifCfg>(empty);
    const [loading, setLoading] = createSignal(true);
    const [saving, setSaving] = createSignal(false);

    onMount(async () => {
        setLoading(true);
        try {
            const raw = await api.getNotificationSettings();
            if (raw) setCfg({
                smtp_host: raw.SMTPHost ?? "",
                smtp_port: raw.SMTPPort ?? 587,
                smtp_user: raw.SMTPUser ?? "",
                smtp_password: raw.SMTPPassword ?? "",
                smtp_from: raw.SMTPFrom ?? "",
                smtp_to: raw.SMTPTo ?? "",
                smtp_tls: raw.SMTPTLS ?? true,
                slack_webhook: raw.SlackWebhook ?? "",
                slack_channel: raw.SlackChannel ?? "",
                teams_webhook: raw.TeamsWebhook ?? "",
                min_severity: raw.MinSeverity ?? "HIGH",
            });
        } finally {
            setLoading(false);
        }
    });

    const set = (k: keyof NotifCfg, v: any) => setCfg(c => ({ ...c, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            await api.updateNotificationSettings({
                SMTPHost: cfg().smtp_host,
                SMTPPort: cfg().smtp_port,
                SMTPUser: cfg().smtp_user,
                SMTPPassword: cfg().smtp_password,
                SMTPFrom: cfg().smtp_from,
                SMTPTo: cfg().smtp_to,
                SMTPTLS: cfg().smtp_tls,
                SlackWebhook: cfg().slack_webhook,
                SlackChannel: cfg().slack_channel,
                TeamsWebhook: cfg().teams_webhook,
                MinSeverity: cfg().min_severity,
            });
            addToast({ type: "success", message: "Notification settings saved" });
        } catch (e: any) {
            addToast({ type: "error", message: "Save failed: " + e?.message });
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent transition-all font-mono";
    const labelCls = "text-xs text-muted mb-1 block font-medium";

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-bold text-white">Notification Channels</h2>
                    <p class="text-xs text-muted mt-0.5">Configure how OBLIVRA alerts your team when threats are detected</p>
                </div>
                <button
                    onClick={save}
                    disabled={saving()}
                    class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-50 hover:scale-[1.02] transition-all shadow-lg shadow-accent/20"
                >
                    <Show when={saving()} fallback={<><Save size={15} /> Save Changes</>}>
                        <RefreshCw size={15} class="animate-spin" /> Saving…
                    </Show>
                </button>
            </div>

            {/* Severity gate */}
            <Card class="p-4 space-y-3">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2"><AlertTriangle size={16} class="text-amber-400" /> Alert Threshold</h3>
                <p class="text-xs text-muted">Only notify when alert severity is at or above this level.</p>
                <div class="flex items-center gap-3">
                    {SEVERITIES.map(s => (
                        <button
                            onClick={() => set("min_severity", s)}
                            class={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                                cfg().min_severity === s
                                    ? "bg-accent text-white border-accent shadow-lg shadow-accent/30"
                                    : "bg-white/5 text-muted border-white/10 hover:border-accent/40"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </Card>

            {/* SMTP */}
            <Card class="p-4 space-y-4">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2"><Mail size={16} class="text-blue-400" /> Email (SMTP)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class={labelCls}>SMTP Host</label>
                        <input class={inputCls} placeholder="smtp.gmail.com" value={cfg().smtp_host} onInput={e => set("smtp_host", e.currentTarget.value)} />
                    </div>
                    <div>
                        <label class={labelCls}>SMTP Port</label>
                        <input class={inputCls} type="number" placeholder="587" value={cfg().smtp_port} onInput={e => set("smtp_port", parseInt(e.currentTarget.value) || 587)} />
                    </div>
                    <div>
                        <label class={labelCls}>SMTP Username</label>
                        <input class={inputCls} placeholder="alerts@yourcompany.com" value={cfg().smtp_user} onInput={e => set("smtp_user", e.currentTarget.value)} />
                    </div>
                    <div>
                        <label class={labelCls}>SMTP Password</label>
                        <input class={inputCls} type="password" placeholder="••••••••" value={cfg().smtp_password} onInput={e => set("smtp_password", e.currentTarget.value)} />
                    </div>
                    <div>
                        <label class={labelCls}>From Address</label>
                        <input class={inputCls} placeholder="oblivra-alerts@yourcompany.com" value={cfg().smtp_from} onInput={e => set("smtp_from", e.currentTarget.value)} />
                    </div>
                    <div>
                        <label class={labelCls}>To (comma-separated)</label>
                        <input class={inputCls} placeholder="soc@yourcompany.com, ciso@yourcompany.com" value={cfg().smtp_to} onInput={e => set("smtp_to", e.currentTarget.value)} />
                    </div>
                </div>
                <label class="flex items-center gap-3 cursor-pointer">
                    <div
                        class={`relative w-10 h-5 rounded-full transition-colors ${cfg().smtp_tls ? "bg-accent" : "bg-white/20"}`}
                        onClick={() => set("smtp_tls", !cfg().smtp_tls)}
                    >
                        <div class={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cfg().smtp_tls ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span class="text-sm text-secondary">Use TLS / STARTTLS</span>
                    <Show when={cfg().smtp_tls}><Check size={14} class="text-emerald-400" /></Show>
                </label>
            </Card>

            {/* Slack */}
            <Card class="p-4 space-y-4">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare size={16} class="text-purple-400" /> Slack
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class={labelCls}>Incoming Webhook URL</label>
                        <input class={inputCls} placeholder="https://hooks.slack.com/services/T.../B.../..." value={cfg().slack_webhook} onInput={e => set("slack_webhook", e.currentTarget.value)} />
                    </div>
                    <div>
                        <label class={labelCls}>Channel (optional override)</label>
                        <input class={inputCls} placeholder="#soc-alerts" value={cfg().slack_channel} onInput={e => set("slack_channel", e.currentTarget.value)} />
                    </div>
                </div>
            </Card>

            {/* Teams */}
            <Card class="p-4 space-y-4">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare size={16} class="text-cyan-400" /> Microsoft Teams
                </h3>
                <div>
                    <label class={labelCls}>Incoming Webhook URL</label>
                    <input class={inputCls} placeholder="https://yourorg.webhook.office.com/webhookb2/..." value={cfg().teams_webhook} onInput={e => set("teams_webhook", e.currentTarget.value)} />
                </div>
            </Card>
        </div>
    );
}
