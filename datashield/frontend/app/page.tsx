import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedDatasets } from "@/components/home/FeaturedDatasets";
import { WhyDataShield } from "@/components/home/WhyDataShield";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <FeaturedDatasets />
      <WhyDataShield />
      <CTASection />
    </main>
  );
}
