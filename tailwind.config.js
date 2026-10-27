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
      fontSize: {
        '2xs': ['0.72rem', { lineHeight: '1.05rem' }],
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px (was 12px)
        'sm': ['0.925rem', { lineHeight: '1.375rem' }], // 14.8px (was 14px)
        'base': ['1.05rem', { lineHeight: '1.625rem' }], // 16.8px (was 16px)
        'lg': ['1.2rem', { lineHeight: '1.75rem' }], // 19.2px (was 18px)
        'xl': ['1.35rem', { lineHeight: '1.875rem' }], // 21.6px (was 20px)
        '2xl': ['1.65rem', { lineHeight: '2.125rem' }], // 26.4px (was 24px)
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
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

