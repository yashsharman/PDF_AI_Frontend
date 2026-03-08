/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#d4111b",
        accent: "#FFC30B",
        charcoal: "#181111",
        "background-light": "#f8f6f6",
        "background-dark": "#221011",
      },
      fontFamily: {
        display: ["Be Vietnam Pro", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
