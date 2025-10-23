import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,jsx,js}"
  ],
  theme: {
    extend: {
      colors: {
        "scene-night": "#0b1424",
        "scene-overlay": "rgba(9,17,31,0.55)",
        "dialogue-bg": "rgba(5,9,18,0.85)"
      },
      boxShadow: {
        "scene-card": "0 28px 60px rgba(5, 12, 28, 0.55)",
        "dialogue": "0 32px 60px rgba(0, 0, 0, 0.55)"
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [
    forms,
    typography
  ]
};

export default config;
