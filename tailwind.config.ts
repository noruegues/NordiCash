import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0D10",
        surface: "#13161B",
        surface2: "#1A1E25",
        border: "#23272F",
        muted: "#8A93A2",
        primary: "#3B82F6",
        primary2: "#6366F1",
        accent: "#22D3EE",
        success: "#22C55E",
        danger: "#EF4444",
        warn: "#F59E0B",
        loan: "#F472B6",
      },
      fontFamily: { sans: ["DM Sans", "Inter", "system-ui", "sans-serif"] },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.4), 0 4px 16px -8px rgba(0,0,0,0.3)",
        glow: "0 0 40px -10px rgba(59,130,246,0.45)",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
      },
    },
  },
  plugins: [],
};
export default config;
