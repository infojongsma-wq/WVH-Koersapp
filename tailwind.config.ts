import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // WVH design tokens — cream + yellow + ink + brand blue.
        cream: {
          DEFAULT: "#F5F1E6",
          50: "#FAF7EE",
          100: "#EFE9D9",
          200: "#E5DFCF",
          300: "#D8CFB8",
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
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: ["Georgia", "ui-serif", "serif"],
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
