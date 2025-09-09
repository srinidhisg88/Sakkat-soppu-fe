/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#166534',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        cream: {
          100: '#fef9c3',
          200: '#fafaf9',
        },
        orange: {
          500: '#f97316',
        },
      },
    },
  },
  plugins: [],
}
