/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#0a0c10',
          surface: '#12151e',
          hover: '#191e2b',
        },
        accent: {
          DEFAULT: '#d97706',
          hover: '#b45309',
        },
        border: {
          hairline: '#202638',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
