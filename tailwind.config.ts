import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // WVH design tokens. The "cream" scale is kept as the app's neutral
        // surface/border palette but is now a light-blue tint (#cfddea family)
        // so every page background, border and hover recolours in one place.
        cream: {
          DEFAULT: "#CFDDEA",
          50: "#EAF2F8",
          100: "#DCE8F2",
          200: "#BFD2E3",
          300: "#A6C0D6",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#1A1A1A",
          muted: "#6B7280",
        },
        wvh: {
          DEFAULT: "#0F172A",
          blue: "#1E3A8A",
          yellow: "#F0C948",
          yellowSoft: "#F5DE8A",
        },
      },
      fontFamily: {
        // Aptos-first stack — natively renders as Aptos on Windows 11,
        // Segoe UI on older Windows, Helvetica on macOS, Arial anywhere else.
        sans: [
          "Aptos",
          "Aptos Display",
          "Segoe UI Variable",
          "Segoe UI",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Aptos Display",
          "Aptos",
          "Segoe UI Variable",
          "Segoe UI",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        card: "0 2px 8px rgba(15,23,42,0.05)",
        chunky: "0 2px 0 rgba(0,0,0,1)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
