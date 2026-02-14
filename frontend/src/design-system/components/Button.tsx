import { type JSX, type ParentProps, splitProps } from "solid-js";
import { cn } from "../../utils/cn";

interface ButtonProps extends ParentProps, JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
}

export const Button = (props: ButtonProps) => {
    const [local, others] = splitProps(props, ["variant", "size", "class", "children"]);

    const variants = {
        primary: "bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-white/10 text-white hover:bg-white/20 active:bg-white/5",
        outline: "border border-white/10 text-secondary hover:text-white hover:bg-white/5 active:bg-white/10",
        ghost: "text-secondary hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30",
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base font-semibold",
        icon: "h-10 w-10 flex items-center justify-center p-0",
    };

    return (
        <button
            class={cn(
                "inline-flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
                variants[local.variant || "primary"],
                sizes[local.size || "md"],
                local.class
            )}
            {...others}
        >
            {local.children}
        </button>
    );
};
