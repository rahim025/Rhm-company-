import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          500: "#3b6fed",
          600: "#2f57c4",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
};
export default config;
