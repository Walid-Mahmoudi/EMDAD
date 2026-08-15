/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#161A1D",
        paper: "#F7F5F0",
        brand: {
          DEFAULT: "#0E5C4A",
          light: "#E8F0EC",
          dark: "#0A4336",
        },
        accent: "#C9622D",
        line: "#DDD8CC",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Arabic'", "system-ui", "sans-serif"],
        body: ["'IBM Plex Sans Arabic'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
