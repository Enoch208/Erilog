import Link from 'next/link';
import { ROUTES } from '@/lib/content';

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-wide px-6 py-32">
      <div
        className="overflow-hidden rounded-feature-lg px-8 py-20 text-center sm:px-16"
        style={{
          background:
            'radial-gradient(at 50% 130%, #16241D 0%, #0F1713 50%, #0A0F0C 100%)',
        }}
      >
        <h2 className="mx-auto max-w-[620px] text-3xl font-heading leading-[1.15] tracking-tight text-white sm:text-[2.75rem]">
          See what happens when two offline histories disagree.
        </h2>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={ROUTES.judge}
            className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-evidence"
          >
            Launch Judge Mode
            <span
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          <Link
            href={ROUTES.verify}
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white/90 transition-all duration-300 hover:border-white/30 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-evidence"
          >
            Verify an audit bundle
          </Link>
          <a
            href={ROUTES.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full px-6 py-3.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-evidence"
          >
            View source
          </a>
        </div>
      </div>
    </section>
  );
}
