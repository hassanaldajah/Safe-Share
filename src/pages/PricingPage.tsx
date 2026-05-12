import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen landing-page pt-16" style={{ 
      background: "hsl(222 47% 6%)",
      color: "hsl(210 40% 98%)"
    }}>
      <Navbar />
      <main>
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
