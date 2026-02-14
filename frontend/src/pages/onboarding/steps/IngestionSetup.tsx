import { Input } from "../../../design-system/components/Input";

interface IngestionSetupProps {
    data: { syslogPort: number; hecPort: number };
    updateData: (fields: Partial<{ syslogPort: number; hecPort: number }>) => void;
}

export default function IngestionSetup(props: IngestionSetupProps) {
    return (
        <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-gradient">Ingestion Configuration</h2>
                <p class="text-secondary">Define the ports OBLIVRA will listen on for incoming telemetry.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
                <Input
                    id="syslogPort"
                    label="Syslog Port (UDP/TCP)"
                    type="number"
                    value={props.data.syslogPort}
                    onInput={(e) => props.updateData({ syslogPort: parseInt(e.currentTarget.value) })}
                />
                <Input
                    id="hecPort"
                    label="HEC Endpoint Port"
                    type="number"
                    value={props.data.hecPort}
                    onInput={(e) => props.updateData({ hecPort: parseInt(e.currentTarget.value) })}
                />
            </div>

            <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-4 max-w-xl mx-auto mt-4">
                <div class="bg-blue-500 p-1 rounded-full text-white text-[10px]">ℹ️</div>
                <p class="text-xs text-blue-400">
                    These ports must be open in your system firewall. OBLIVRA will attempt to bind to these ports upon initialization.
                </p>
            </div>
        </div>
    );
}
