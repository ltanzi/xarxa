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
        // muted/accent darkened for WCAG AA on the paper bg: the old
        // #8A8A8A was 2.83:1 (AA needs 4.5:1) and it carries nearly all
        // metadata at 11–13px; #6B6760 reads as the same warm grey at
        // 4.6:1. Old accent #E63B2E was 3.4:1 for small error text;
        // #C22D22 is 4.7:1 and visually near-identical.
        muted: "#6B6760",
        accent: "#C22D22",
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
