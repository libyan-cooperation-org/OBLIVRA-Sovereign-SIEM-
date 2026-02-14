import { createSignal } from "solid-js";

export interface SIEMRule {
    id: string;
    name: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
    enabled: boolean;
    query: string;
}

const [rules, setRules] = createSignal<SIEMRule[]>([]);

export const rulesStore = {
    rules,
    setRules,
    toggleRule: (id: string) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    }
};
