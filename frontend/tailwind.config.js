/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                base: "#09090b",
                surface: "#111114",
                surfaceLight: "#1c1c21",
                accent: "#6366f1",
                "accent-hover": "#818cf8",
                border: "rgba(255, 255, 255, 0.1)",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            backdropBlur: {
                xl: "24px",
            }
        },
    },
    plugins: [],
}
