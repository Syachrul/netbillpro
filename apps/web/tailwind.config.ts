import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',
      },
    },
  },
  plugins: [],
};

export default config;
