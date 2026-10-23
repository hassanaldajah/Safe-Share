import { Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Reveal } from "@/components/Reveal";
import { reveal, staggerChildren } from "@/lib/motion";

// Paying for a year costs 20% less per month
const ANNUAL_FACTOR = 0.8;

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

// $9.99 becomes $7.99, $15 becomes $12
const annualPrice = (monthly: number) => Math.round(monthly * ANNUAL_FACTOR * 100) / 100;

type Plan = {
  name: string;
  description: string;
  monthly: number;
  unit: string;
  features: string[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: "Basic",
    description: "For individuals sending occasional secure files.",
    monthly: 0,
    unit: "/ month",
    features: ["5GB Encrypted Storage", "2GB Max File Size", "End-to-End Encryption", "7-Day Link Expiry"],
  },
  {
    name: "Pro",
    description: "For professionals who need absolute privacy and control.",
    monthly: 9.99,
    unit: "/ month",
    features: ["1TB Encrypted Storage", "50GB Max File Size", "Custom Link Expiry", "Password-Protected Links", "Download Audit Logs"],
    popular: true,
  },
  {
    name: "Teams",
    description: "For businesses managing sensitive client data.",
    monthly: 15,
    unit: "/ user / month",
    features: ["3TB Pooled Storage", "Centralized Admin Console", "Team Access Policies", "Priority Support", "Custom Branding"],
  },
];

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const handleUpgradeToPro = async () => {
    try {
      const response = await authFetch("/api/payments/create-checkout-session", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to start checkout", error);
    }
  };

  const priceOf = (plan: Plan) => (isAnnual && plan.monthly > 0 ? annualPrice(plan.monthly) : plan.monthly);

  return (
    <section id="pricing" className="py-20 lg:py-28 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 gradient-radial" />

      <div className="container px-4 mx-auto max-w-6xl relative z-10">
        <Reveal className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Pricing</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your secure file sharing needs. No hidden fees.
          </p>

          {/* Billing period */}
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/60 px-4 py-2">
            <label htmlFor="billing" className={`text-sm font-medium cursor-pointer ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </label>
            <Switch id="billing" checked={isAnnual} onCheckedChange={setIsAnnual} aria-label="Pay annually" />
            <label htmlFor="billing" className={`text-sm font-medium cursor-pointer ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annually <span className="text-primary text-xs ml-1">Save 20%</span>
            </label>
          </div>
        </Reveal>

        <motion.div
          variants={staggerChildren(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid md:grid-cols-3 gap-8 md:items-center"
        >
          {plans.map((plan) => {
            const price = priceOf(plan);
            return (
              <motion.div
                key={plan.name}
                variants={reveal}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className={`relative rounded-2xl p-8 flex flex-col h-full border transition-[border-color,box-shadow] duration-300 ${
                  plan.popular
                    ? "bg-card border-primary/60 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.35)] md:-my-4 md:py-12"
                    : "bg-card/60 border-border hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_18px_hsl(var(--primary)/0.5)]">
                    Most Popular
                  </div>
                )}

                <h2 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h2>
                <p className="text-muted-foreground text-sm mb-6 min-h-10">{plan.description}</p>

                <div className="mb-1 flex items-baseline gap-1.5">
                  <motion.span
                    key={price}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-bold text-foreground tabular-nums"
                  >
                    {usd(price)}
                  </motion.span>
                  <span className="text-muted-foreground">{plan.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6 h-4">
                  {plan.monthly > 0 && isAnnual ? `Billed yearly at ${usd(Math.round(price * 12 * 100) / 100)}` : ""}
                </p>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-foreground/85">
                      <Check className="h-5 w-5 text-primary mr-3 shrink-0" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === "Basic" && (
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/signup">Get Started Free</Link>
                  </Button>
                )}
                {plan.name === "Pro" && (
                  <Button size="lg" className="w-full" onClick={handleUpgradeToPro}>
                    Upgrade to Pro
                  </Button>
                )}
                {plan.name === "Teams" && (
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <a href="https://github.com/hassanaldajah" target="_blank" rel="noopener noreferrer">
                      Contact Sales
                    </a>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
