/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "Segoe UI", "sans-serif"],
        display: ['Fraunces', "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2,6,23,0.08)",
        glow: "0 12px 40px rgba(16, 185, 129, 0.2)",
        citrus: "0 12px 36px rgba(251, 146, 60, 0.18)",
        "inner-soft": "inset 0 1px 0 0 rgba(255,255,255,0.65)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

