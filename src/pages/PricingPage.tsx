import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import "@/styles/landing.css";

const PricingPage = () => {
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
        <div className="min-h-screen landing-page overflow-x-clip pt-16">
          <Navbar />
          <main id="main">
            <PricingSection />
          </main>
          <Footer />
        </div>
      </MotionConfig>
    </SmoothScroll>
  );
};

export default PricingPage;
