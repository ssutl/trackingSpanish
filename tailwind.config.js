/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f0f10",
        secondary: "#201c1c",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundOpacity: {
        0.5: "0.008",
        1: "0.01",
        2: "0.02",
        3: "0.03",
        4: "0.04",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
