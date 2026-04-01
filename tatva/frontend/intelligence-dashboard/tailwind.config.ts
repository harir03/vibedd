import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                tatva: {
                    teal: "#0d9488",
                    "teal-light": "#f0fdfa",
                    dark: "#0a0c10",
                    card: "#12161b",
                    border: "#1d2127",
                    input: "#080a0d",
                    accent: "#0d9488",
                    text: {
                        primary: "#ffffff",
                        secondary: "#94a3b8",
                        muted: "#475569",
                    }
                },
                domain: {
                    geopolitics: "#3b82f6",
                    economics: "#22c55e",
                    defense: "#ef4444",
                    technology: "#a855f7",
                    climate: "#f97316",
                    society: "#eab308",
                },
            },
            boxShadow: {
                'glow': '0 0 20px rgba(13, 148, 136, 0.15)',
                'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
            }
        },
    },
    plugins: [],
};
export default config;
