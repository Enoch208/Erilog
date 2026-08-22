import type { Config } from 'tailwindcss';

/**
 * Colors are declared as literal hex values so Tailwind's opacity
 * modifiers (bg-mint/10, border-white/8) work correctly.
 * The CSS custom properties in globals.css remain available for
 * future theming via direct var() usage.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F1F2EE',
        surface: '#FEFEFC',
        ink: '#151816',
        muted: '#69716C',
        border: '#DDE4DF',
        mint: {
          DEFAULT: '#18B889',
          dark: '#0E5C47',
          wash: '#DCF7EC',
        },
        amber: '#B86B00',
        danger: '#C73F46',
        evidence: '#0D1310',
      },
      borderRadius: {
        control: '14px',
        card: '20px',
        'card-lg': '24px',
        feature: '28px',
        'feature-lg': '32px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontWeight: {
        heading: '600',
      },
      maxWidth: {
        prose: '640px',
        narrow: '840px',
        content: '1080px',
        wide: '1240px',
      },
    },
  },
  plugins: [],
};

export default config;
