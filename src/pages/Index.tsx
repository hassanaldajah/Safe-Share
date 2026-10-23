import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureCards from "@/components/FeatureCards";
import ZeroKnowledgeDiagram from "@/components/ZeroKnowledgeDiagram";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import "@/styles/landing.css";

const Index = () => {
  useEffect(() => {
    // Add landing-page class to body for dark theme
    document.body.classList.add("landing-page");
    return () => {
      // Remove class when leaving landing page
      document.body.classList.remove("landing-page");
    };
  }, []);

  return (
    <SmoothScroll>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen landing-page overflow-x-clip">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main">
            <HeroSection />
            <FeatureCards />
            <ZeroKnowledgeDiagram />
            <HowItWorks />
            <Testimonials />
            <CTASection />
          </main>
          <Footer />
        </div>
      </MotionConfig>
    </SmoothScroll>
  );
};

export default Index;
