/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0B0D12",
          900: "#12141B",
          800: "#1A1D27",
          700: "#242835",
          600: "#333849",
        },
        mist: {
          100: "#F5F6FA",
          300: "#C7CAD9",
          500: "#8B90A6",
        },
        signal: {
          DEFAULT: "#6C5CE7",
          light: "#8B7CF0",
          dark: "#5645C9",
        },
        ember: "#F5A623",
      },
      boxShadow: {
        bubble: "0 2px 10px rgba(12, 13, 20, 0.18)",
      },
    },
  },
  plugins: [],
};
