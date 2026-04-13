import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        canvas: "var(--bg-canvas)",
        subtle: "var(--bg-subtle)",
        panel: "var(--bg-panel)",
        "panel-strong": "var(--bg-panel-strong)",
        "panel-soft": "var(--bg-panel-soft)",
        "border-subtle": "var(--border-subtle)",
        border: "var(--border-default)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      spacing: {
        sidebar: "var(--sidebar-width)"
      },
      boxShadow: {
        panel: "var(--shadow-sm)",
        float: "var(--shadow-md)",
        deep: "var(--shadow-lg)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "fade-up": "fade-up 220ms ease-out",
        "fade-in": "fade-in 180ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
