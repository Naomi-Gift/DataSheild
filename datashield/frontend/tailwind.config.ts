import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base":     "#05070F",
        "bg-surface":  "#080A18",
        "bg-elevated": "#0D1020",
        "bg-input":    "#0A0D1C",
        purple: { 300: "#C4BFFC", 400: "#9B91F8", 500: "#7B6EF6", 600: "#5B4FD6" },
        teal:   { 400: "#4DE6B8", 500: "#1DD9A0" },
        coral:  { 400: "#F7806C", 500: "#F5614A" },
        amber:  { 400: "#F7BC56", 500: "#F5A623" },
        "text-primary":   "#F0EFFF",
        "text-secondary": "#9B98C0",
        "text-muted":     "#4A4870",
      },
      fontFamily: {
        sans: ["Space Grotesk", "Inter", "-apple-system", "sans-serif"],
        mono: ["Space Mono", "JetBrains Mono", "monospace"],
      },
      borderColor: {
        subtle:  "rgba(255,255,255,0.05)",
        default: "rgba(255,255,255,0.09)",
        strong:  "rgba(255,255,255,0.16)",
      },
      boxShadow: {
        "purple-glow":  "0 0 30px rgba(123,110,246,0.35), 0 0 60px rgba(123,110,246,0.1)",
        "teal-glow":    "0 0 24px rgba(29,217,160,0.30), 0 0 48px rgba(29,217,160,0.08)",
        "coral-glow":   "0 0 24px rgba(245,97,74,0.30)",
        "amber-glow":   "0 0 24px rgba(245,166,35,0.25)",
        "card-hover":   "0 8px 40px rgba(123,110,246,0.20), 0 0 0 1px rgba(123,110,246,0.15)",
      },
      animation: {
        float:     "float 4s ease-in-out infinite",
        pulseRing: "pulseRing 2s ease-out infinite",
        shimmer:   "shimmer 1.6s infinite linear",
        ticker:    "ticker 30s linear infinite",
        blink:     "blink 1s step-end infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(-2deg)" },
          "50%":      { transform: "translateY(-10px) rotate(-2deg)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
      backdropBlur: { glass: "24px" },
    },
  },
  plugins: [],
} satisfies Config;
