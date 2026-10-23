import type { PointerEvent } from "react";
import { motion } from "framer-motion";
import { KeyRound, ScrollText, Send } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { reveal, staggerChildren } from "@/lib/motion";

const features = [
  {
    icon: KeyRound,
    title: "Zero-Knowledge Encryption",
    description: "Files are encrypted on your device before upload. We never see your encryption keys — only you and your recipients can decrypt.",
  },
  {
    icon: ScrollText,
    title: "Audit Logs & Permissions",
    description: "Track every access, download, and share. Set granular permissions for who can view, edit, or forward your files.",
  },
  {
    icon: Send,
    title: "Direct Vault Transfer",
    description: "Safely grant file access to specific users or groups. We use advanced public-key cryptography so only your chosen recipients can decrypt the data.",
  },
];

// Moves the card's light to the pointer (read inside the event, never during render)
const followPointer = (e: PointerEvent<HTMLDivElement>) => {
  const box = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - box.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - box.top}px`);
};

const FeatureCards = () => {
  return (
    <section id="features" className="py-20 lg:py-28 relative scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <Reveal className="text-center mb-14 lg:mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Security That <span className="text-primary">Just Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security features that protect your most sensitive files without complexity.
          </p>
        </Reveal>

        {/* Feature cards */}
        <motion.div
          variants={staggerChildren(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={reveal}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              onPointerMove={followPointer}
              className="spotlight-card p-8 rounded-2xl bg-card border border-border"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-6">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureCards;
