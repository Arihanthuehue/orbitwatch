/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#050505',
          900: '#0A0A0A',
          850: '#121212',
          800: '#181818',
          700: '#222222',
          600: '#2E2E2E'
        },
        orbit: {
          red: '#DC2626',
          darkred: '#991B1B',
          yellow: '#D97706',
          amber: '#B45309',
          gold: '#CA8A04',
          cyan: '#D97706',   // Deep warm golden yellow replacing cyan
          violet: '#B91C1C', // Deep rich red replacing violet
          green: '#16A34A'
        }
      },
      fontFamily: {
        heading: ['Arial', 'Helvetica', 'sans-serif'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        mono: ['Arial', 'Helvetica', 'sans-serif']
      },
      boxShadow: {
        '3d-card': '0 12px 28px -5px rgba(0, 0, 0, 0.9), 0 4px 10px -2px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        '3d-panel': '0 20px 40px -10px rgba(0, 0, 0, 0.95), 0 8px 16px -4px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        '3d-btn': '0 4px 12px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }
    }
  },
  plugins: []
};
