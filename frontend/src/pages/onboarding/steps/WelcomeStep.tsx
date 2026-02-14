import { Shield } from "lucide-solid";
import { Input } from "../../../design-system/components/Input";

interface WelcomeStepProps {
    data: { orgName: string };
    updateData: (fields: Partial<{ orgName: string }>) => void;
}

export default function WelcomeStep(props: WelcomeStepProps) {
    return (
        <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex flex-col items-center text-center space-y-4">
                <div class="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                    <Shield class="text-white" size={32} />
                </div>
                <h2 class="text-3xl font-bold text-gradient">Welcome to OBLIVRA</h2>
                <p class="text-secondary max-w-md">
                    Let's initialize your sovereign security environment. Start by naming your command center.
                </p>
            </div>

            <div class="max-w-sm mx-auto">
                <Input
                    id="orgName"
                    label="Organization Name"
                    placeholder="e.g. LCO Sovereign Operations"
                    value={props.data.orgName}
                    onInput={(e) => props.updateData({ orgName: e.currentTarget.value })}
                />
            </div>
        </div>
    );
}
