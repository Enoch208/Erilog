'use client';

import { useEffect, useRef, useState } from 'react';
import { Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/content';

const NAV_ITEMS = [
  { label: 'Why Erilog', href: '#problem' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Built with Kiro', href: '#kiro' },
  { label: 'GitHub', href: ROUTES.github, external: true },
];

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="relative z-50 bg-canvas">
      <div className="mx-auto flex h-24 max-w-wide items-center justify-between px-6">
        <Link href="/" className="inline-flex cursor-pointer items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4" aria-label="Erilog home">
          <Image src="/logo.png" alt="Erilog" width={595} height={133} priority className="h-8 w-auto sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => <a key={item.label} href={item.href} className="cursor-pointer text-[13px] text-muted transition-colors duration-300 hover:text-ink focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint" {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}</a>)}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link href={ROUTES.verify} className="cursor-pointer rounded-full border border-mint/45 bg-mint-wash px-5 py-2.5 text-[13px] font-medium text-mint-dark transition-all duration-300 hover:-translate-y-0.5 hover:border-mint hover:bg-mint hover:text-white active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2">Verify a bundle</Link>
          <Link href={ROUTES.judge} className="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-xl hover:shadow-mint/20 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2">Open Dashboard</Link>
        </div>

        <button ref={menuButtonRef} type="button" className="-mr-2.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>

      {menuOpen && <nav id="mobile-menu" className="absolute inset-x-0 top-full border-t border-border bg-canvas shadow-xl shadow-black/5 lg:hidden" aria-label="Mobile navigation"><div className="mx-auto max-w-wide px-6 py-5"><div className="flex flex-col">{NAV_ITEMS.map((item) => <a key={item.label} href={item.href} className="flex min-h-11 cursor-pointer items-center border-b border-border/70 text-sm text-muted transition-colors hover:text-ink last:border-0" onClick={() => setMenuOpen(false)} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}</a>)}</div><Link href={ROUTES.judge} className="btn-primary mt-5 w-full cursor-pointer" onClick={() => setMenuOpen(false)}>Open Dashboard</Link><Link href={ROUTES.verify} className="mt-2.5 inline-flex w-full cursor-pointer items-center justify-center rounded-full border-2 border-mint bg-mint-wash px-6 py-3.5 text-sm font-medium text-mint-dark" onClick={() => setMenuOpen(false)}>Verify a bundle</Link></div></nav>}
    </header>
  );
}
