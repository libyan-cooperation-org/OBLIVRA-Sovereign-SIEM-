import { createSignal } from "solid-js";

const [locale, setLocale] = createSignal<"en" | "ar">("en");
const [translations, setTranslations] = createSignal<Record<string, string>>({});

export const i18nStore = {
    locale,
    setLocale,
    translations,
    setTranslations,
    t: (key: string) => translations()[key] || key
};
