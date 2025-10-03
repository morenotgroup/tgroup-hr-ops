import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // 👇 conecta a var(--font-sans) do next/font
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
