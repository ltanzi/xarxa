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
        // Offer vs request is the first thing anyone wants to know on the
        // board, and it's a binary — the one distinction colour is actually
        // good at. Categories deliberately stay monochrome: there are 17 of
        // them and a post can carry three, so there'd be no answer to which
        // colour wins.
        //
        // Measured against the #EDE8E0 paper ground: offer 5.01:1, request
        // 5.78:1, both clear of AA's 4.5 for the 11px label they colour.
        // Green/blue rather than green/red — red is taken by accent (urgent
        // posts, errors), and green/blue survives the common colourblindness
        // types. The word itself is always shown, so colour reinforces the
        // label rather than carrying it alone.
        offer: "#4A6B2F",
        request: "#2F5D7C",
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
