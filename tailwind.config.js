/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ussf: {
          navy: '#0A192F',
          blue: '#1E3A8A',
          red: '#C8102E',
          gold: '#D4AF37',
          emerald: '#10B981',
        }
      }
    },
  },
  plugins: [],
}
