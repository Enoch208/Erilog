import { ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import { ROUTES } from '@/lib/content';

const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Integrity', href: '#integrity' },
      { label: 'Verify a bundle', href: ROUTES.verify },
      { label: 'Open Judge Mode', href: ROUTES.judge },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: `${ROUTES.github}/blob/main/README.md`, external: true },
      { label: 'GitHub', href: ROUTES.github, external: true },
      { label: 'Built with Kiro', href: '#kiro' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="mx-auto max-w-wide px-6 pb-6">
      <div className="relative overflow-hidden rounded-feature-lg bg-[radial-gradient(ellipse_at_50%_135%,#205c44_0%,#10261c_35%,#080d0a_72%)] text-white">
        <div className="relative z-10 grid gap-12 p-8 pb-10 sm:grid-cols-2 sm:p-14 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Image src="/logo.png" alt="Erilog" width={595} height={133} className="h-10 w-auto brightness-0 invert" />
            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-white/45">Offline-first evidence reconciliation for small distribution teams.</p>
            <p className="mt-7 mono text-[9px] uppercase tracking-[0.16em] text-white/25">Ready, Spec, Ship Hackathon · August 2026</p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-white/30">{group.title}</p>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}><a href={link.href} className="cursor-pointer text-[13px] text-white/55 transition-colors hover:text-white" {...('external' in link && link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col gap-4 border-t border-white/10 px-8 py-5 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between sm:px-14">
          <span>© 2026 Erilog. Evidence should outlive connectivity.</span>
          <a href="#top" className="inline-flex cursor-pointer items-center gap-2 text-mint transition-colors hover:text-white">Back to top <HugeiconsIcon icon={ArrowUp01Icon} size={15} strokeWidth={1.5} aria-hidden="true" /></a>
        </div>

        <div className="relative h-24 overflow-hidden select-none sm:h-36 lg:h-44">
          <div className="absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(ellipse_at_50%_130%,rgba(24,184,137,.36),transparent_66%)]" />
          <p className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap font-heading text-[6rem] leading-[0.82] tracking-[-0.04em] text-white sm:text-[10rem] lg:text-[13rem]" style={{ textShadow: '0 0 120px rgba(24,184,137,.3)' }} aria-hidden="true">Erilog</p>
        </div>
      </div>
    </footer>
  );
}
