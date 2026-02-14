import { createEffect } from "solid-js";
import type { ParentProps } from "solid-js";
import { settingsStore } from "../../stores/settings.store";

export const RTLProvider = (props: ParentProps) => {
    createEffect(() => {
        const lang = settingsStore.language();
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    });

    return <>{props.children}</>;
};
