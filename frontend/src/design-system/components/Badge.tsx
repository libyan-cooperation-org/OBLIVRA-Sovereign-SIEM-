import { type ParentProps } from "solid-js";
import { cn } from "../../utils/cn";

interface BadgeProps extends ParentProps {
    variant?: "info" | "success" | "warning" | "error" | "accent" | "muted";
    class?: string;
}

export const Badge = (props: BadgeProps) => {
    const variants = {
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        accent: "bg-accent/10 text-accent border-accent/20",
        muted: "bg-white/5 text-muted border-white/10",
    };

    return (
        <span
            class={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                variants[props.variant || "muted"],
                props.class
            )}
        >
            {props.children}
        </span>
    );
};
