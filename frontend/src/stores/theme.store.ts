import { createSignal, createEffect } from "solid-js";

const [isDark, setIsDark] = createSignal(true);

// Effect to apply theme class to document
createEffect(() => {
    if (isDark()) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

export const themeStore = {
    isDark,
    toggleTheme: () => setIsDark(!isDark())
};
