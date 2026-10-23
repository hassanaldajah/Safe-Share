import { lazy, Suspense, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Lock, Shield, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { EASE_OUT } from "@/lib/motion";

// three.js is loaded on demand so it does not slow down the first paint of the page
const HeroScene3D = lazy(() => import("./HeroScene3D"));

const trust = [
  { icon: Shield, label: "Cryptographically Private" },
  { icon: Lock, label: "AES-256 Encryption" },
  { icon: Eye, label: "Zero-Knowledge Architecture" },
];

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
});

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const { scrollToSection } = useSmoothScroll();
  const reduceMotion = useReducedMotion();

  // As the hero scrolls away the text drifts up and fades, while the 3D vault opens (see HeroScene3D)
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduceMotion ? 1 : 0]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center pt-24 pb-20 lg:pt-20 overflow-hidden"
    >
      {/* Background: soft teal light from above and a faint dot grid */}
      <div aria-hidden="true" className="absolute inset-0 gradient-radial" />
      <div aria-hidden="true" className="absolute inset-0 hero-dots" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-4">
          {/* Text */}
          <motion.div style={{ y: textY, opacity: textOpacity }} className="order-2 lg:order-1 text-center lg:text-left">
            <motion.div
              {...enter(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-7"
            >
              <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm text-primary font-medium">Zero-Knowledge Security</span>
            </motion.div>

            <motion.h1
              {...enter(0.08)}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-5"
            >
              End-to-End Encrypted <span className="text-primary glow-text">File Sharing</span>
            </motion.h1>

            <motion.p {...enter(0.16)} className="text-xl sm:text-2xl font-medium text-foreground/85 mb-4">
              Even admins can’t read your files.
            </motion.p>

            <motion.p
              {...enter(0.22)}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed"
            >
              Share sensitive files with complete privacy. Your data is encrypted on your device before it ever
              leaves — we literally can’t see what you’re sharing.
            </motion.p>

            <motion.div
              {...enter(0.3)}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" onClick={() => scrollToSection("how-it-works")}>
                <Play className="h-5 w-5" aria-hidden="true" />
                How It Works
              </Button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground"
            >
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* 3D vault */}
          <motion.div
            style={{ y: sceneY }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
            className="relative order-1 lg:order-2 h-60 sm:h-80 lg:h-[600px] -mx-4 sm:mx-0"
          >
            <div aria-hidden="true" className="absolute inset-[18%] rounded-full bg-primary/15 blur-3xl animate-pulse-glow" />
            <Suspense fallback={null}>
              <HeroScene3D />
            </Suspense>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <button
        type="button"
        onClick={() => scrollToSection("features")}
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
        aria-label="Scroll to features"
      >
        <span className="scroll-cue" aria-hidden="true" />
        Scroll
      </button>
    </section>
  );
};

export default HeroSection;
