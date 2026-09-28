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
        // Saturation is what makes these read as green and blue, not the
        // contrast ratio. The first attempt cleared AA comfortably (5.0 and
        // 5.8) but sat at L* 41/38 against muted's L* 44 — the same
        // perceived darkness as the grey it replaced — so on an 11px
        // uppercase label the eye saw "dark" and no hue at all. These are
        // darker and far more saturated (76%/80% vs 56%/62%), which is the
        // axis that actually separates them. Compare accent #C22D22: it
        // reads loudly at L* 43 purely because it is 82% saturated.
        //
        // Against the #EDE8E0 paper ground: offer 6.65:1, request 7.66:1.
        // Green/blue rather than green/red — red is taken by accent (urgent
        // posts, errors), and green/blue survives the common colourblindness
        // types. The word itself is always shown, so colour reinforces the
        // label rather than carrying it alone.
        offer: "#2E5A16",
        request: "#164A70",
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
