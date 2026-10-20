/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ussf: {
          navy: '#001489',
          blue: '#1E3A8A',
          dark: '#2E3440',
          slate: '#434C5E',
          red: '#DA291C',
          gold: '#C69214',
          emerald: '#00D26A',
          bg: '#F8FAFC',
          sidebar: '#F8F9FA',
        }
      }
    },
  },
  plugins: [],
}
