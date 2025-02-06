import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        Matter: ["Matter"],
      },
      colors: {
        orange: "#FD9D41",
        lightOrange: "#FFF6EC",
        darkGray: "#6C6C6C",
        midGray: "#D7D7D7",
        gray: "#B9B9B9",
        lightGray: "#F5F5F5",
        sand: "#F3F2F0",
        darkOrange: "#FC6432",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
