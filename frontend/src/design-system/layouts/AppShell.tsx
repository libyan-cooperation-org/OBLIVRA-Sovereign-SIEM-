import type { ParentProps } from "solid-js";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const AppShell = (props: ParentProps) => {
    return (
        <div class="flex min-h-screen bg-base text-white">
            <Sidebar />
            <div class="flex-1 flex flex-col min-h-screen">
                <TopBar />
                <main class="flex-1 p-8 overflow-y-auto">
                    {props.children}
                </main>
            </div>
        </div>
    );
};
