import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        income: "hsl(var(--income))",
        expense: "hsl(var(--expense))",
        transfer: "hsl(var(--transfer))",
        c1: "hsl(var(--c1))", c2: "hsl(var(--c2))", c3: "hsl(var(--c3))",
        c4: "hsl(var(--c4))", c5: "hsl(var(--c5))", c6: "hsl(var(--c6))",
        c7: "hsl(var(--c7))", c8: "hsl(var(--c8))",
      },
      borderRadius: { lg: "1rem", md: "0.75rem", sm: "0.5rem" },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { "fade-in": "fade-in 0.25s ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
