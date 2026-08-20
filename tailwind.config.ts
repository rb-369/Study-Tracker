import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: {
          DEFAULT: "#0f1624",
          subtle: "#141e30",
          card: "#0d1422",
          elevated: "#182338",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          DEFAULT: "rgba(255, 255, 255, 0.12)",
          bright: "rgba(255, 255, 255, 0.2)",
        },
        focus: {
          DEFAULT: "#10b981", // Emerald
          glow: "rgba(16, 185, 129, 0.25)",
          light: "#34d399",
          dark: "#059669",
        },
        deepwork: {
          DEFAULT: "#6366f1", // Indigo
          glow: "rgba(99, 102, 241, 0.25)",
          light: "#818cf8",
          dark: "#4f46e5",
        },
        ping: {
          DEFAULT: "#f59e0b", // Amber
          glow: "rgba(245, 158, 11, 0.25)",
          light: "#fbbf24",
          dark: "#d97706",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-focus": "glowFocus 3s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        glowFocus: {
          "0%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.15)" },
          "100%": { boxShadow: "0 0 30px rgba(16, 185, 129, 0.35)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
