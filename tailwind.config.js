/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b9fd',
          400: '#8191fa',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9fc',
          100: '#f1f3f9',
          200: '#e4e8f4',
          300: '#d1d8ed',
          400: '#9aa3c2',
          500: '#6b748f',
          600: '#4a5168',
          700: '#333a52',
          800: '#1e2336',
          900: '#111522',
        }
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'glass-lg': '0 8px 40px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'pin': '0 2px 8px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pop': 'pop 0.15s cubic-bezier(0.34,1.56,0.64,1)',
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pop: { from: { transform: 'scale(0.92)' }, to: { transform: 'scale(1)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-6px)' }, '40%,80%': { transform: 'translateX(6px)' } },
      }
    },
  },
  plugins: [],
}
