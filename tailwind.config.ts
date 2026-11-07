import type { Config } from 'tailwindcss';

// Colours come from CSS variables (see globals.css) so the app can be dark
// while the bill itself (".paper") stays light like a real receipt.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        card: v('card'),
        slate: {
          50: v('slate-50'),
          100: v('slate-100'),
          200: v('slate-200'),
          300: v('slate-300'),
          400: v('slate-400'),
          500: v('slate-500'),
          600: v('slate-600'),
          700: v('slate-700'),
          800: v('slate-800'),
          900: v('slate-900'),
          950: v('slate-950'),
        },
        brand: {
          50: v('brand-50'),
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: v('brand-700'),
          900: v('brand-900'),
        },
        red: {
          50: v('red-50'),
          200: v('red-200'),
          600: v('red-600'),
          700: v('red-700'),
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
