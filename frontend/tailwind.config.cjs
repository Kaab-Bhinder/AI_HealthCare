/** Clinical Calm design system — calm teal/emerald, airy, medical-grade trust. */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Primary brand — calm teal/emerald (retuned from the old electric cyan
        // so every existing `healthcare-*` class becomes serene automatically).
        healthcare: {
          50: '#f0fdfa',
          100: '#cffafe',
          200: '#a7f3eb',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        brand: {
          50: '#f0fdfa',
          100: '#cffafe',
          200: '#a7f3eb',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Warm secondary accent for highlights / illustrations.
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
        },
        // Neutral canvas / ink built on slate for a clean clinical feel.
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b1120',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(2, 6, 23, 0.04), 0 2px 8px rgba(2, 6, 23, 0.05)',
        card: '0 4px 24px -6px rgba(2, 6, 23, 0.10), 0 2px 6px -2px rgba(2, 6, 23, 0.06)',
        lift: '0 12px 40px -12px rgba(13, 148, 136, 0.28)',
        glow: '0 0 0 1px rgba(20, 184, 166, 0.12), 0 8px 30px -8px rgba(20, 184, 166, 0.25)',
        inner_soft: 'inset 0 1px 3px rgba(2, 6, 23, 0.05)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
