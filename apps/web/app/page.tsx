import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingReveal } from '@/components/marketing/MarketingReveal';
import { SeedConflictPreview } from '@/components/marketing/SeedConflictPreview';
import { IntegrityStrip } from '@/components/marketing/IntegrityStrip';
import { OfflineProblemStory } from '@/components/marketing/OfflineProblemStory';
import { EvidenceStageStack } from '@/components/marketing/EvidenceStageStack';
import { ProductJourney } from '@/components/marketing/ProductJourney';
import { AuditTamperPreview } from '@/components/marketing/AuditTamperPreview';
import { KiroBuildStory } from '@/components/marketing/KiroBuildStory';
import { FAQ } from '@/components/marketing/FAQ';
import { FinalCTA } from '@/components/marketing/FinalCTA';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <MarketingHero />
        <MarketingReveal><SeedConflictPreview /></MarketingReveal>
        <IntegrityStrip />
        <MarketingReveal><OfflineProblemStory /></MarketingReveal>
        <EvidenceStageStack />
        <MarketingReveal><ProductJourney /></MarketingReveal>
        <MarketingReveal><AuditTamperPreview /></MarketingReveal>
        <MarketingReveal><KiroBuildStory /></MarketingReveal>
        <MarketingReveal><FAQ /></MarketingReveal>
        <MarketingReveal><FinalCTA /></MarketingReveal>
      </main>
      <MarketingFooter />
    </>
  );
}
