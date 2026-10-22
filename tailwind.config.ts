import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#16a34a",
          dark: "#14532d",
          light: "#4ade80",
        },
        carbon: {
          950: "#0a0a0b",
          900: "#111113",
          800: "#1a1a1d",
          700: "#26262b",
          600: "#3a3a41",
        },
        gold: "#eab308",
      },
      fontFamily: {
        sport: ["var(--font-oswald)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
