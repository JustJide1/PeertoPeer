/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bowen: {
          maroon: '#7A1F2B',
          gold: '#D4A017',
        },
      },
    },
  },
  plugins: [],
};
