import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureCards from "@/components/FeatureCards";
import ZeroKnowledgeDiagram from "@/components/ZeroKnowledgeDiagram";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen landing-page" style={{ 
      background: "hsl(222 47% 6%)",
      color: "hsl(210 40% 98%)"
    }}>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureCards />
        <ZeroKnowledgeDiagram />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;