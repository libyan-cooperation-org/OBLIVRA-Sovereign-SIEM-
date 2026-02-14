import { cn } from "../../utils/cn";

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; size?: "sm" | "md"; }

export const Toggle = (props: ToggleProps) => {
  const sizes = { sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" }, md: { track: "w-10 h-5", thumb: "w-3.5 h-3.5", translate: "translate-x-5" } };
  const s = sizes[props.size || "md"];
  return (
    <label class="flex items-center gap-3 cursor-pointer select-none group">
      <button role="switch" aria-checked={props.checked} onClick={() => props.onChange(!props.checked)}
        class={cn("relative rounded-full transition-colors duration-200 flex-shrink-0", s.track, props.checked ? "bg-accent" : "bg-white/10 hover:bg-white/15")}>
        <div class={cn("absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform duration-200", s.thumb, props.checked ? s.translate : "translate-x-0")} />
      </button>
      {props.label && <span class="text-sm text-secondary group-hover:text-white transition-colors">{props.label}</span>}
    </label>
  );
};
