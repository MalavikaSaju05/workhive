/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0543c8',     // Blue - primary actions (Orbit brand blue)
        secondary: '#111827',   // Black - typography
        accent: '#DBEAFE',      // Light blue - highlights
        border: '#E5E7EB',      // Light gray - borders
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
