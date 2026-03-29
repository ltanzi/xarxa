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
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FFF8F0",
        warmgray: "#F5F0EB",
        coral: "#F24445",
        lime: "#AEC340",
        violet: "#8F74FF",
        sky: "#6CC4E0",
        sunflower: "#FFD63F",
        peach: "#FFAB7B",
        blush: "#FFB5C2",
        mint: "#7EDAB5",
      },
      fontFamily: {
        display: ["'Nunito'", "sans-serif"],
        body: ["'Nunito'", "sans-serif"],
      },
      borderRadius: {
        blob: "30% 70% 70% 30% / 30% 30% 70% 70%",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "wiggle": "wiggle 3s ease-in-out infinite",
        "bounce-slow": "bounce 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
