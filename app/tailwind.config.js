/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#100a07', 900: '#180f0b', 800: '#21150f', 700: '#2e1d15', 600: '#40291d', 500: '#5c3e2c' },
        volt: { DEFAULT: '#ff7a1a', dim: '#e85d04' },
        plasma: '#ff3d6e',
        ember: '#ff3b30',
        ice: '#ffcf3f',
        gold: '#ffb000',
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
