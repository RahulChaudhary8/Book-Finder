/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 25px -10px rgba(15, 23, 42, 0.25)",
      }
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
