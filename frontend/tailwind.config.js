/** @type {import('tailwindcss').Config} */
// frontend/tailwind.config.js
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
 theme: {
  extend: {
    colors: {
      'brand-orange': '#f9a61a',
      'brand-dark': '#141b2d',
    },
  },
},
  plugins: [],
};