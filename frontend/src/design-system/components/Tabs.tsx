import { For } from "solid-js";
import { cn } from "../../utils/cn";

interface Tab { label: string; value: string; }
interface TabsProps { tabs: Tab[]; active: string; onChange: (v: string) => void; class?: string; }

export const Tabs = (props: TabsProps) => (
  <div class={cn("flex gap-1 border-b border-white/10", props.class)}>
    <For each={props.tabs}>
      {(tab) => (
        <button
          onClick={() => props.onChange(tab.value)}
          class={cn(
            "px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
            props.active === tab.value
              ? "border-accent text-white"
              : "border-transparent text-muted hover:text-white hover:border-white/20"
          )}
        >
          {tab.label}
        </button>
      )}
    </For>
  </div>
);
