/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: "#FAF9FF",
          100: "#F3F0FF",
          200: "#E7E1FF",
          300: "#D4C9FF",
          400: "#B7A5FF",
          500: "#9B82F5",
          600: "#7C5CE0",
          700: "#6446BD",
        },
        ink: {
          900: "#1E1B2E",
          700: "#4A4560",
          500: "#767089",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(124, 92, 224, 0.15)",
        card: "0 2px 10px -2px rgba(30, 27, 46, 0.06)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.35s ease-out both",
        popIn: "popIn 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
