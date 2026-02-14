import { createSignal } from "solid-js";

const [theme, setTheme] = createSignal<"dark" | "light">("dark");
const [language, setLanguage] = createSignal<"en" | "ar">("en");
const [notifications, setNotifications] = createSignal({
    enabled: true,
    sound: true,
    severity: "info"
});

export const settingsStore = {
    theme,
    setTheme,
    language,
    setLanguage,
    notifications,
    setNotifications
};
