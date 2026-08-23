'use client';

import Link from 'next/link';
import { HERO, ROUTES } from '@/lib/content';

function Word({
  children,
  delay,
  className = '',
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block animate-[wordReveal_0.7s_cubic-bezier(.22,.68,.34,1)_forwards] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </span>
  );
}

export function MarketingHero() {
  return (
    <>
      <div className="relative z-30 flex justify-center pt-8 -mb-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] py-2 pl-3 pr-4 text-xs font-medium text-white shadow-xl shadow-black/20">
          <span
            className="h-1.5 w-1.5 rounded-full bg-mint"
            style={{ boxShadow: '0 0 8px rgba(24,184,137,.9)' }}
            aria-hidden="true"
          />
          Offline-first reconciliation
        </div>
      </div>

      <section className="relative mx-auto flex min-h-[610px] max-w-wide flex-col justify-center px-6 pb-14 pt-16 text-center sm:min-h-[680px] lg:min-h-[720px]">
        <h1 className="mx-auto max-w-[1120px] font-heading" style={{ lineHeight: '0.98' }}>
          <span className="block text-[2.8rem] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            <Word delay={0}>Offline</Word>{' '}
            <Word delay={0.06} className="inline-flex align-middle">
              <span className="mx-1 inline-flex -translate-y-1 items-center justify-center rounded-full bg-gradient-to-br from-mint to-mint-dark px-4 py-1.5 text-[10px] font-semibold tracking-tight text-white sm:px-5 sm:py-2 sm:text-xs">
                EVIDENCE
              </span>
            </Word>{' '}
            <span className="text-mint">
              <Word delay={0.12}>Reconciliation</Word>
            </span>
          </span>

          <span className="mt-1 block text-[2.8rem] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            <span className="text-[#9a9a9a]">
              <Word delay={0.24}>from</Word>
            </span>{' '}
            <Word delay={0.3}>Real</Word>{' '}
            <Word delay={0.36}>Evidence</Word>
          </span>

          <span className="mt-1 block text-[2.8rem] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            <span className="text-[#9a9a9a]">
              <Word delay={0.42}>ready</Word>{' '}
              <Word delay={0.48}>to</Word>
            </span>{' '}
            <Word delay={0.54}>Verify</Word>
          </span>
        </h1>

        <p className="mx-auto mt-9 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {HERO.description}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={ROUTES.judge} className="btn-primary group cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-mint/30 active:translate-y-0 active:scale-[0.98]">
            Launch Judge Mode
            <span className="text-base transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </Link>
          <Link href={ROUTES.verify} className="btn-secondary cursor-pointer bg-white/60 hover:bg-white hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]">
            Verify a bundle
          </Link>
        </div>

        <p className="mt-12 text-xl text-mint sm:text-2xl" style={{ fontFamily: 'var(--font-caveat), cursive' }}>
          ( from conflict to evidence )
        </p>
      </section>
    </>
  );
}
