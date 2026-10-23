import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "@/components/Reveal";

const CTASection = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5" />
      <div aria-hidden="true" className="absolute inset-0 hero-dots opacity-60" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal className="max-w-3xl mx-auto text-center">
          {/* Icon with a slowly turning light ring */}
          <div className="ring-spin inline-flex p-4 rounded-2xl bg-primary/15 border border-primary/30 mb-8">
            <Shield className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">Ready to Protect Your Files?</h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join security-conscious individuals who trust SafeShare for their most sensitive file sharing needs. Get started
            for free — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                {isAuthenticated ? "Go to Dashboard" : "Start Sharing Securely"}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>

            <Button variant="hero-outline" size="xl" asChild>
              <a href="https://github.com/hassanaldajah" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" aria-hidden="true" />
                Contact Developer
              </a>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required • Open source • Zero-knowledge architecture
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
