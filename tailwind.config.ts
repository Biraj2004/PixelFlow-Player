import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: '#0b0e11',
          low: '#101417',
          container: '#161a1e',
          bright: '#282d31',
        },
        primary: {
          DEFAULT: '#99f7ff',
          container: '#00f1fe',
          foreground: '#000000',
        },
        tertiary: {
          DEFAULT: '#ff59e3',
          foreground: '#ffffff',
        },
        status: {
          healthy: '#99f7ff',
          unstable: '#ff59e3',
          critical: '#ff0000',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(153, 247, 255, 0.12)',
        'glow-tertiary': '0 0 20px rgba(255, 89, 227, 0.12)',
      },
      spacing: {
        gutter: '5.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
