import ContactWidget from "@/components/ContactWidget";
import CtaSection from "@/components/CtaSection";
import FaqSection from "@/components/FaqSection";
import FeaturesSection from "@/components/FeaturesSection";
import FooterSection from "@/components/FooterSection";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <FooterSection />

      {/* Floating contact widget */}
      <ContactWidget />
    </div>
  );
};

export default Index;
