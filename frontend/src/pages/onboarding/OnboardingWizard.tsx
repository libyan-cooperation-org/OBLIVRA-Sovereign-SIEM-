import { createSignal, Switch, Match, createMemo } from "solid-js";
import { Button } from "../../design-system/components/Button";
import { Card } from "../../design-system/components/Card";
import WelcomeStep from "./steps/WelcomeStep";
import SecurityPosture from "./steps/SecurityPosture";
import IngestionSetup from "./steps/IngestionSetup";
import ReviewStep from "./steps/ReviewStep";
import { ChevronRight, ChevronLeft, Check } from "lucide-solid";

export default function OnboardingWizard() {
    const [step, setStep] = createSignal(1);
    const totalSteps = 4;

    const [data, setData] = createSignal({
        orgName: "",
        posture: "sovereign",
        syslogPort: 514,
        hecPort: 8088,
    });

    const updateData = (fields: Partial<ReturnType<typeof data>>) => {
        setData((prev) => ({ ...prev, ...fields }));
    };

    const nextStep = () => {
        if (step() < totalSteps) setStep(step() + 1);
    };

    const prevStep = () => {
        if (step() > 1) setStep(step() - 1);
    };

    const progress = createMemo(() => (step() / totalSteps) * 100);

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-base/95 backdrop-blur-md overflow-y-auto py-12">
            <div class="w-full max-w-2xl px-6">
                <div class="mb-8 space-y-4">
                    <div class="flex justify-between items-end">
                        <div class="space-y-1">
                            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Initialization Phase</span>
                            <h1 class="text-lg font-semibold">OBLIVRA Sovereign Setup</h1>
                        </div>
                        <span class="text-xs font-mono text-muted">Step {step()} of {totalSteps}</span>
                    </div>
                    <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-accent transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progress()}%` }}
                        />
                    </div>
                </div>

                <Card class="min-h-[450px] flex flex-col justify-between border-white/5">
                    <div class="py-4">
                        <Switch>
                            <Match when={step() === 1}>
                                <WelcomeStep data={data()} updateData={updateData} />
                            </Match>
                            <Match when={step() === 2}>
                                <SecurityPosture data={data()} updateData={updateData} />
                            </Match>
                            <Match when={step() === 3}>
                                <IngestionSetup data={data()} updateData={updateData} />
                            </Match>
                            <Match when={step() === 4}>
                                <ReviewStep data={data()} />
                            </Match>
                        </Switch>
                    </div>

                    <div class="flex items-center justify-between pt-8 border-t border-white/5 mt-8">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={step() === 1}
                            class={step() === 1 ? "invisible" : ""}
                        >
                            <ChevronLeft size={18} class="mr-2" /> Back
                        </Button>

                        <div class="flex items-center gap-4">
                            <Button variant="ghost" class="text-muted hover:text-white" onClick={() => window.location.href = "/"}>
                                Skip initialization
                            </Button>
                            {step() < totalSteps ? (
                                <Button onClick={nextStep} class="min-w-[120px]">
                                    Next <ChevronRight size={18} class="ml-2" />
                                </Button>
                            ) : (
                                <Button onClick={() => window.location.href = "/dashboard"} class="min-w-[120px]">
                                    Finish <Check size={18} class="ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                <p class="text-[10px] text-muted text-center mt-8 uppercase tracking-widest selection:bg-accent selection:text-white">
                    Cryptographically Verified Setup • OBLIVRA V2 Sovereign
                </p>
            </div>
        </div>
    );
}
