import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Judge Mode routes render as client components, so they cannot export
 * metadata individually. This layout gives every Judge page a document
 * title, which assistive technology relies on for orientation.
 */
export const metadata: Metadata = {
  title: 'Judge Mode · Erilog',
  description:
    'Deterministic seed-42 workspace for recording offline handouts, reconciling peer events, and exporting independently verifiable evidence.',
};

export default function JudgeLayout({ children }: { children: ReactNode }) {
  return children;
}
