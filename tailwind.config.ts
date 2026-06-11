import type { Config } from "tailwindcss";

// Channel-triplet tokens from app/globals.css, wrapped so Tailwind opacity
// modifiers work (e.g. bg-primary/15).
const rgb = (token: string) => `rgb(var(${token}) / <alpha-value>)`;

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // Flynet components ship their classes in the published package — include it
    // so Tailwind keeps their styles.
    "./node_modules/@flynetdev/react/dist/**/*.{js,cjs}",
  ],
  theme: {
    extend: {
      // Semantic names over the CSS variables in app/globals.css. Components
      // use these classes (bg-surface-low, text-muted, …) — never raw hexes.
      colors: {
        background: rgb("--surface-bg"),
        "background-darker": rgb("--surface-bg-darker"),
        surface: {
          lowest: rgb("--surface-container-lowest"),
          low: rgb("--surface-container-low"),
          DEFAULT: rgb("--surface-container"),
          high: rgb("--surface-container-high"),
          highest: rgb("--surface-container-highest"),
        },
        foreground: rgb("--on-surface"),
        muted: rgb("--on-surface-alt"),
        subtle: rgb("--outline"),
        primary: {
          DEFAULT: rgb("--core-primary"),
          dim: rgb("--core-primary-dim"),
          bright: rgb("--core-primary-bright"),
          foreground: rgb("--core-on-primary"),
        },
        success: rgb("--success"),
        failure: rgb("--failure"),
        "brand-yellow": rgb("--brand-yellow"),
      },
      borderColor: {
        DEFAULT: "var(--border)",
        strong: "var(--border-strong)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
    },
  },
} satisfies Config;
