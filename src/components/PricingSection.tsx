import { Check } from "lucide-react";
import { useState } from "react";
import { authFetch } from "@/lib/api";

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

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your secure file sharing needs. No hidden fees.
          </p>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-[#00E5FF] transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
              Annually <span className="text-[#00E5FF] text-xs ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Basic Plan */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-8 flex flex-col h-full transition-transform hover:-translate-y-1 hover:border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Basic</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">For individuals sending occasional secure files.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-slate-400"> / month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {['5GB Encrypted Storage', '2GB Max File Size', 'End-to-End Encryption', '7-Day Link Expiry'].map((feature, i) => (
                <li key={i} className="flex items-start text-slate-300">
                  <Check className="h-5 w-5 text-[#00E5FF] mr-3 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 border border-white/20 text-white hover:bg-white/10">
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.15)] p-8 flex flex-col h-full relative transform md:-translate-y-4 transition-transform hover:-translate-y-5 hover:shadow-[0_0_40px_rgba(0,229,255,0.25)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00E5FF] text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.5)]">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">For professionals who need absolute privacy and control.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$9.99</span>
              <span className="text-slate-400"> / month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {['1TB Encrypted Storage', '50GB Max File Size', 'Custom Link Expiry', 'Password-Protected Links', 'Download Audit Logs'].map((feature, i) => (
                <li key={i} className="flex items-start text-slate-300">
                  <Check className="h-5 w-5 text-[#00E5FF] mr-3 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={handleUpgradeToPro}
              className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-[#00E5FF] text-slate-900 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              Upgrade to Pro
            </button>
          </div>

          {/* Teams Plan */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-8 flex flex-col h-full transition-transform hover:-translate-y-1 hover:border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Teams</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">For businesses managing sensitive client data.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$15</span>
              <span className="text-slate-400"> / user / month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {['3TB Pooled Storage', 'Centralized Admin Console', 'Team Access Policies', 'Priority Support', 'Custom Branding'].map((feature, i) => (
                <li key={i} className="flex items-start text-slate-300">
                  <Check className="h-5 w-5 text-[#00E5FF] mr-3 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 border border-white/20 text-white hover:bg-white/10">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
