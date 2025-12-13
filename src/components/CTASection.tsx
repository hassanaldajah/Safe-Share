import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Icon */}
          <div className="inline-flex p-4 rounded-2xl bg-primary/20 border border-primary/30 mb-8">
            <Shield className="h-10 w-10 text-primary" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Protect Your Files?
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of security-conscious professionals who trust VaultShare 
            for their most sensitive file sharing needs. Get started for free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl">
              Start Sharing Securely
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="hero-outline" size="xl">
              Contact Sales
            </Button>
          </div>

          {/* Trust note */}
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required • Free tier available • GDPR compliant
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;