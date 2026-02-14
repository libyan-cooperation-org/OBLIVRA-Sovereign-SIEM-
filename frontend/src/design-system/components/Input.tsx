import { type JSX, splitProps } from "solid-js";
import { cn } from "../../utils/cn";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = (props: InputProps) => {
    const [local, others] = splitProps(props, ["label", "error", "class", "id"]);

    return (
        <div class="space-y-1.5 w-full">
            {local.label && (
                <label
                    for={local.id}
                    class="text-sm font-medium text-secondary selection:bg-accent selection:text-white"
                >
                    {local.label}
                </label>
            )}
            <input
                id={local.id}
                class={cn(
                    "flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all",
                    "placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    local.error ? "border-red-500/50 focus:ring-red-500/50" : "",
                    local.class
                )}
                {...others}
            />
            {local.error && (
                <p class="text-[11px] text-red-500 font-medium">{local.error}</p>
            )}
        </div>
    );
};
