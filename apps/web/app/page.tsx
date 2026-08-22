import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { SeedConflictPreview } from '@/components/marketing/SeedConflictPreview';
import { IntegrityStrip } from '@/components/marketing/IntegrityStrip';
import { OfflineProblemStory } from '@/components/marketing/OfflineProblemStory';
import { EvidenceStageStack } from '@/components/marketing/EvidenceStageStack';
import { FieldOperatorPreview } from '@/components/marketing/FieldOperatorPreview';
import { CoordinatorPreview } from '@/components/marketing/CoordinatorPreview';
import { AuditTamperPreview } from '@/components/marketing/AuditTamperPreview';
import { IntegrityMatrix } from '@/components/marketing/IntegrityMatrix';
import { KiroBuildStory } from '@/components/marketing/KiroBuildStory';
import { HonestLimitation } from '@/components/marketing/HonestLimitation';
import { FAQ } from '@/components/marketing/FAQ';
import { FinalCTA } from '@/components/marketing/FinalCTA';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <MarketingHero />
        <SeedConflictPreview />
        <IntegrityStrip />
        <OfflineProblemStory />
        <EvidenceStageStack />
        <FieldOperatorPreview />
        <CoordinatorPreview />
        <AuditTamperPreview />
        <IntegrityMatrix />
        <KiroBuildStory />
        <HonestLimitation />
        <FAQ />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </>
  );
}
