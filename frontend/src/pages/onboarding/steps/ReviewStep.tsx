import { Card } from "../../../design-system/components/Card";
import { Badge } from "../../../design-system/components/Badge";

interface ReviewStepProps {
    data: {
        orgName: string;
        posture: string;
        syslogPort: number;
        hecPort: number;
    };
}

export default function ReviewStep(props: ReviewStepProps) {
    return (
        <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-gradient">Review & Initialize</h2>
                <p class="text-secondary">Confirm your sovereign configuration before starting the engines.</p>
            </div>

            <Card class="max-w-md mx-auto space-y-4">
                <div class="flex justify-between border-b border-white/5 pb-2">
                    <span class="text-sm text-secondary">Organization</span>
                    <span class="text-sm font-semibold">{props.data.orgName}</span>
                </div>
                <div class="flex justify-between border-b border-white/5 pb-2">
                    <span class="text-sm text-secondary">Posture</span>
                    <Badge variant={props.data.posture === "sovereign" ? "success" : "accent" as any}>
                        {props.data.posture}
                    </Badge>
                </div>
                <div class="flex justify-between border-b border-white/5 pb-2">
                    <span class="text-sm text-secondary">Syslog Port</span>
                    <span class="text-sm font-mono text-accent">{props.data.syslogPort}</span>
                </div>
                <div class="flex justify-between border-b border-white/5 pb-2">
                    <span class="text-sm text-secondary">HEC Port</span>
                    <span class="text-sm font-mono text-accent">{props.data.hecPort}</span>
                </div>

                <p class="text-[11px] text-muted text-center pt-2 italic">
                    By clicking finish, OBLIVRA will generate cryptographic keys and initialize the BadgerDB storage layer.
                </p>
            </Card>
        </div>
    );
}
