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
    <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur-sm border-b border-border">
      <div className="section-container flex items-center justify-between h-16">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-lg font-heading tracking-tight text-ink"
        >
          Erilog
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-muted hover:text-ink transition-colors"
              {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          href={ROUTES.judge}
          className="hidden lg:inline-flex btn-primary text-sm py-2 px-4"
        >
          Open Dashboard
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="lg:hidden p-2 -mr-2 text-ink"
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
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="lg:hidden border-t border-border bg-canvas py-4"
          aria-label="Mobile navigation"
        >
          <div className="section-container flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-muted hover:text-ink py-2 transition-colors"
                onClick={() => setMenuOpen(false)}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={ROUTES.judge}
              className="btn-primary text-sm mt-2 w-full"
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
