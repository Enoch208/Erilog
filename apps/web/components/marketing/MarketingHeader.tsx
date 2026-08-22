'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/content';

const NAV_ITEMS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Integrity', href: '#integrity' },
  { label: 'Verifier', href: '#verifier' },
  { label: 'Built with Kiro', href: '#kiro' },
  { label: 'GitHub', href: ROUTES.github, external: true },
];

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-wide items-center justify-between px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-[17px] font-heading tracking-tight text-ink"
        >
          Erilog
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] text-muted transition-colors hover:text-ink"
              {...(item.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          href={ROUTES.judge}
          className="hidden rounded-full bg-evidence px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 lg:inline-flex"
          style={{ boxShadow: '0 6px 18px -6px rgba(13,19,16,.4)' }}
        >
          Open Dashboard
        </Link>

        {/* Mobile menu button — 44px touch target */}
        <button
          type="button"
          className="-mr-2.5 flex h-11 w-11 items-center justify-center text-ink lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {menuOpen ? (
              <>
                <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" />
                <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" />
              </>
            ) : (
              <>
                <line x1="3" y1="6.5" x2="17" y2="6.5" />
                <line x1="3" y1="13.5" x2="17" y2="13.5" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-border bg-canvas lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto max-w-wide px-6 py-4">
            <div className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex min-h-[44px] items-center text-sm text-muted transition-colors hover:text-ink"
                  onClick={() => setMenuOpen(false)}
                  {...(item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <Link
              href={ROUTES.judge}
              className="btn-primary mt-4 w-full"
              onClick={() => setMenuOpen(false)}
            >
              Open Dashboard
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
