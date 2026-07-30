/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#eff0ea",
        surface: "#f9faf5",
        surface2: "#e5e7dc",
        line: "#cacdbe",
        "line-strong": "#a9ad9a",
        ink: "#1a1d15",
        "ink-muted": "#565b4c",
        "ink-faint": "#82877a",
        brass: { DEFAULT: "#9a4e1e", strong: "#7c3d16", tint: "#f1e2d2" },
        good: { DEFAULT: "#1f7a4d", tint: "#e3f1e4", border: "#bfe0c4" },
        warn: { DEFAULT: "#8a5a05", tint: "#f6ebd3", border: "#e7ce97" },
        bad: { DEFAULT: "#9e2b2b", tint: "#f7e3e1", border: "#efc0bc" },
        scope: { DEFAULT: "#1c6e82", tint: "#e1eff1", border: "#b7d9df" },
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
