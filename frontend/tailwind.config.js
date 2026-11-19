/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        royal: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#3B82F6' },
        navy: { DEFAULT: '#142B4F', light: '#1E3A66' },
        soft: '#DBEAFE',
        ink: '#1F2937',
        muted: '#64748B',
        line: '#E5E7EB',
        surface: '#F5F7FA',
        ok: { DEFAULT: '#15803D', bg: '#DCFCE7' },
        warn: { DEFAULT: '#B45309', bg: '#FEF3C7' },
        danger: { DEFAULT: '#B91C1C', bg: '#FEE2E2' },
      },
      fontFamily: { sans: ['Roboto', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(20,43,79,0.06)' },
      borderRadius: { card: '8px' },
    },
  },
  plugins: [],
};
