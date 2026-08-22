'use client';

import { useState } from 'react';
import { FAQ_ITEMS } from '@/lib/content';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section-container py-24 sm:py-32" id="faq">
      <div className="max-w-[700px] mx-auto">
        <h2 className="text-3xl sm:text-4xl font-heading tracking-tight text-center mb-12">
          Questions.
        </h2>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-border rounded-card overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="text-sm font-heading pr-4">{item.question}</span>
                <span
                  className="flex-shrink-0 text-muted text-lg transition-transform duration-200"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              {openIndex === i && (
                <div
                  id={`faq-answer-${i}`}
                  className="px-5 pb-5 text-sm text-muted leading-relaxed"
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
