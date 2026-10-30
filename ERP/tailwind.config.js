/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '420px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
      '5xl': '3840px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        /* Brand Palette Aliases */
        'stone-warm': '#E8E9DF',
        'sage': '#A9B887',
        'forest': '#2E3D28',
        'forest-hover': '#3C4E34',
        'card-light': '#F7F7F0',
        'border-light': '#D5D8CA',
        /* Dark Mode Surfaces */
        'page-dark': '#0F1117',
        'card-dark': '#161922',
        'surface-dark': '#1D212C',
        'hover-dark': '#222736',
        'border-dark': '#2A2F3D',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info, #38BDF8)',
        chart: {
          violet: 'var(--color-chart-violet, #A78BFA)',
          teal: 'var(--color-chart-teal, #2DD4BF)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
          3: 'var(--color-surface-3)',
          elevated: 'var(--color-surface-2)',
          hover: 'var(--color-surface-3)',
        },
        background: 'var(--color-bg-base)',
        foreground: 'var(--color-text-primary)',
        muted: 'var(--color-text-muted)',
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--border-strong, #D4D4D8)',
          dark: '#2A2F3D',
        },
        input: 'var(--color-input-bg)',
        placeholder: 'var(--placeholder, #A1A1AA)',
        ring: 'var(--color-input-focus)',
        overlay: 'var(--overlay, rgba(0, 0, 0, 0.5))',
        sidebar: {
          DEFAULT: 'var(--color-sidebar-bg)',
          active: 'var(--color-sidebar-active-bg)',
          hover: 'var(--color-sidebar-hover-bg)',
          text: 'var(--color-sidebar-text)',
        },
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
        'sidebar-collapsed': '72px',
        'sidebar-expanded': '260px',
      },
      transitionDuration: {
        'micro': '120ms',
        'standard': '200ms',
        'large': '280ms',
      },
      transitionTimingFunction: {
        'enter': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
        'move': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in':        'fadeIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-up':     'fadeInUp 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up':       'slideUp 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slideInRight 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
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
        '2xs':        '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs':         '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card':       '0 1px 4px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 16px rgba(15, 23, 42, 0.1)',
        'soft-xl':    '0 20px 40px -15px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
