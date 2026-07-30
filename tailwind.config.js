/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#121411",
        surface: "#1a1d17",
        surface2: "#262a21",
        line: "#363b30",
        "line-strong": "#4c5242",
        ink: "#edefe6",
        "ink-muted": "#a3a798",
        "ink-faint": "#767a6c",
        brass: { DEFAULT: "#e0924c", strong: "#f0ab6d", tint: "#2e2013" },
        good: { DEFAULT: "#4fc189", tint: "#16281d", border: "#274a34" },
        warn: { DEFAULT: "#e8b94a", tint: "#2c230f", border: "#4a3a16" },
        bad: { DEFAULT: "#f0776b", tint: "#2e1815", border: "#4e2a24" },
        scope: { DEFAULT: "#5fc4da", tint: "#102428", border: "#1e434b" },
      },
      fontFamily: {
        serif: ["Georgia", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Cascadia Mono", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};
