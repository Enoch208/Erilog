import Link from 'next/link';
import { ROUTES } from '@/lib/content';

export function FinalCTA() {
  return (
    <section className="section-container py-24 sm:py-32 text-center">
      <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-6 max-w-[600px] mx-auto">
        See what happens when two offline histories disagree.
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link href={ROUTES.judge} className="btn-primary">
          Launch Judge Mode
        </Link>
        <Link href={ROUTES.verify} className="btn-secondary">
          Verify an audit bundle
        </Link>
        <a
          href={ROUTES.github}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          View source
        </a>
      </div>
    </section>
  );
}
