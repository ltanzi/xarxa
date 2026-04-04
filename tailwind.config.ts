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
        bg: "#EDE8E0",
        fg: "#1A1A1A",
        muted: "#8A8A8A",
        accent: "#E63B2E",
        soft: "#E0DBD2",
      },
      fontFamily: {
        mono: ["var(--font-inconsolata)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
