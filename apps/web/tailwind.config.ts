import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--erilog-canvas)',
        surface: 'var(--erilog-surface)',
        ink: 'var(--erilog-ink)',
        muted: 'var(--erilog-muted)',
        border: 'var(--erilog-border)',
        mint: {
          DEFAULT: 'var(--erilog-mint)',
          dark: 'var(--erilog-mint-dark)',
          wash: 'var(--erilog-mint-wash)',
        },
        amber: 'var(--erilog-amber)',
        red: 'var(--erilog-red)',
        evidence: 'var(--erilog-evidence)',
      },
      borderRadius: {
        control: '14px',
        card: '20px',
        'card-lg': '24px',
        feature: '28px',
        'feature-lg': '32px',
      },
      fontWeight: {
        heading: '600',
      },
    },
  },
  plugins: [],
};

export default config;
