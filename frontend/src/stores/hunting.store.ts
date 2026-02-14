import { createSignal } from "solid-js";

export interface HuntingQuery {
    id: string;
    name: string;
    query: string;
    category: string;
    lastRun?: string;
}

const [queries, setQueries] = createSignal<HuntingQuery[]>([]);
const [activeQuery, setActiveQuery] = createSignal<string | null>(null);

export const huntingStore = {
    queries,
    setQueries,
    activeQuery,
    setActiveQuery
};
