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
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
      },
      animation: {
        'fade-in':        'fadeIn 0.35s ease-out',
        'fade-in-up':     'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':       'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'shimmer':        'shimmer 1.8s infinite',
        'blob':           'blob 8s ease-in-out infinite',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(20px, -20px) scale(1.05)' },
          '66%':      { transform: 'translate(-15px, 10px) scale(0.96)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
      boxShadow: {
        'card':       '0 1px 4px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 16px rgba(15, 23, 42, 0.1)',
        'soft-xl':    '0 20px 40px -15px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
