import type { ParentProps } from "solid-js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends ParentProps {
    class?: string;
}

export const Card = (props: CardProps) => {
    return (
        <div class={cn("glass-card p-6", props.class)}>
            {props.children}
        </div>
    );
};
