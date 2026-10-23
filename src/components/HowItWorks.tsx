import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Upload, Lock, Share2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { reveal, staggerChildren } from "@/lib/motion";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Client-Side Encryption",
    description: "Drop your file into SafeShare. It is mathematically locked in your browser before it ever leaves your device.",
  },
  {
    icon: Lock,
    step: "02",
    title: "Public Key Exchange",
    description: "Select a recipient by their @username. We use their unique Public Key to cryptographically lock the file specifically for them.",
  },
  {
    icon: Share2,
    step: "03",
    title: "Vault-to-Vault Delivery",
    description: "The file arrives securely in their dashboard. Only their Private Key can decrypt it, leaving our servers completely blind to your data.",
  },
];

const HowItWorks = () => {
  // The line between the steps draws itself as the section scrolls through the screen
  const stepsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ["start 85%", "end 55%"] });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <section id="how-it-works" className="py-20 lg:py-28 relative scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14 lg:mb-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Three Steps</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Secure file sharing in three simple steps. No technical knowledge required.
          </p>
        </Reveal>

        <motion.div
          ref={stepsRef}
          variants={staggerChildren(0.18)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-12 md:gap-8 relative"
        >
          {/* Connecting line, from the first icon to the last */}
          <div aria-hidden="true" className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-border">
            <motion.div
              style={{ scaleX: reduceMotion ? 1 : lineProgress }}
              className="h-full origin-left bg-gradient-to-r from-primary/30 via-primary to-primary/30"
            />
          </div>

          {steps.map((step) => (
            <motion.div key={step.step} variants={reveal} className="relative text-center">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 rounded-2xl bg-card border border-primary/30 flex items-center justify-center mx-auto shadow-lg shadow-primary/10">
                  <step.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center tabular-nums">
                  {step.step}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
