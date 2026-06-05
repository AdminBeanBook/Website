import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "rgb(var(--bb-green-rgb) / <alpha-value>)",
          header: "rgb(var(--bb-header-rgb) / <alpha-value>)",
          beige: "rgb(var(--bb-beige-rgb) / <alpha-value>)",
          cream: "rgb(var(--bb-cream-rgb) / <alpha-value>)",
          accent: "rgb(var(--bb-accent-rgb) / <alpha-value>)",
          text: {
            DEFAULT: "rgb(var(--bb-text-body-rgb) / <alpha-value>)",
            heading: "rgb(var(--bb-text-heading-rgb) / <alpha-value>)",
            body: "rgb(var(--bb-text-body-rgb) / <alpha-value>)",
            muted: "rgb(var(--bb-text-muted-rgb) / <alpha-value>)",
            link: "rgb(var(--bb-text-link-rgb) / <alpha-value>)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
