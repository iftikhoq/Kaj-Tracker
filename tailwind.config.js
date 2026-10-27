/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Bengali"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans Bengali"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#052E16',
        },
        executive: {
          base: '#111827',
          sidebar: '#0F172A',
          card: '#FFFFFF',
          cardDark: '#1E293B',
          accent: '#10B981',
          gold: '#F59E0B',
          border: 'rgba(226, 232, 240, 0.8)',
        }
      },
      boxShadow: {
        'depth-sm': '0 2px 8px -1px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        'depth': '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'depth-lg': '0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
