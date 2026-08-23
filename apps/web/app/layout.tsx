import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Caveat } from 'next/font/google';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import './globals.css';

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Erilog — Offline-first evidence reconciliation',
  description: 'Record distributions offline, preserve every accepted event when devices reconnect, and export a signed audit bundle that anyone can independently verify.',
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html id="top" lang="en" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable} ${caveat.variable}`}>
      <body className="font-sans">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
