/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#05060a', 900: '#0a0c14', 800: '#11141f', 700: '#1a1e2e', 600: '#262b40', 500: '#3a4060' },
        volt: { DEFAULT: '#c6ff3d', dim: '#9ccc2a' },
        plasma: '#7c5cff',
        ember: '#ff5c39',
        ice: '#3dd6ff',
        gold: '#ffc83d',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        pulseGlow: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
      },
      animation: { pulseGlow: 'pulseGlow 2.2s ease-in-out infinite' },
    },
  },
  plugins: [],
}
