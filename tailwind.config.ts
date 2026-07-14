import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,48,43,0.04), 0 4px 16px rgba(20,48,43,0.05)",
        lift: "0 8px 40px rgba(20,48,43,0.12)",
      },
      colors: {
        // Performa brand — light, warm, forest-green (from the approved mock)
        performa: {
          brand: "#4bb943", // fresh green wordmark
          forest: "#06280f", // sidebar / brand ink
          green: "#1f7a5c", // primary action green
          soft: "#e6f2ec", // green-tinted surface
          // legacy keys kept so older class references stay sensible
          navy: "#14302b",
          teal: "#1f7a5c",
          cyan: "#1f7a5c",
          onyx: "#06280f",
        },
        ink: {
          DEFAULT: "#14302b",
          soft: "#3a5650",
          mute: "#6b827c",
        },
        line: {
          DEFAULT: "#e0e4df",
          strong: "#cdd4cd",
        },
        surface: {
          DEFAULT: "#ffffff",
          2: "#fbfcfa",
        },
        paper: "#f3f4f1",
        clay: { DEFAULT: "#a8412b", soft: "#f6e4df" },
        amberink: { DEFAULT: "#9a6a16", soft: "#f6edda" },
        abyss: "#f3f4f1",
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "10px",
        xl: "12px",
        "2xl": "14px",
      },
    },
  },
  plugins: [],
};
export default config;
