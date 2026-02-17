import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        plum: "#221A2E",
        surface: "#17171F",
        borderSubtle: "#23232D",
        textPrimary: "#F2F2F7",
        textSecondary: "#A8A8B3",
        textMuted: "#6F6F7A",
        lavender: "#CDBDFF",
        rose: "#F4C6D7",
        peach: "#FFD6C9",
        mint: "#CFF5E7"
      },
      borderRadius: {
        soft: "18px"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(10, 8, 20, 0.35)",
        quote: "0 0 24px rgba(205, 189, 255, 0.14)"
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      keyframes: {
        fadeCalm: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" }
        },
        music: {
          "0%, 100%": { transform: "translateY(0) scale(1)", opacity: "0.95" },
          "50%": { transform: "translateY(-2px) scale(1.03)", opacity: "1" }
        },
        breatheSimple: {
          "0%, 100%": { transform: "scale(0.92)", opacity: "0.76" },
          "50%": { transform: "scale(1.08)", opacity: "1" }
        },
        breatheCalm: {
          "0%": { transform: "scale(0.9)", opacity: "0.72" },
          "28.57%": { transform: "scale(1.08)", opacity: "1" },
          "42.86%": { transform: "scale(1.08)", opacity: "1" },
          "85.71%": { transform: "scale(0.9)", opacity: "0.72" },
          "100%": { transform: "scale(0.9)", opacity: "0.72" }
        },
        breatheBox: {
          "0%": { transform: "scale(0.9)", opacity: "0.72" },
          "25%": { transform: "scale(1.06)", opacity: "1" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
          "75%": { transform: "scale(0.9)", opacity: "0.72" },
          "100%": { transform: "scale(0.9)", opacity: "0.72" }
        }
      },
      animation: {
        fadeCalm: "fadeCalm 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
        music: "music 2.8s ease-in-out infinite",
        breatheSimple: "breatheSimple 8s ease-in-out infinite",
        breatheCalm: "breatheCalm 14s ease-in-out infinite",
        breatheBox: "breatheBox 16s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
