import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: "var(--ink)",
        "ink-raised": "var(--ink-raised)",
        "ink-line": "var(--ink-line)",
        paper: "var(--paper)",
        "paper-dim": "var(--paper-dim)",
        signal: "var(--signal)",
        "signal-dim": "var(--signal-dim)",
      },
    },
  },
  plugins: [],
};
export default config;
