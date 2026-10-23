import type { MouseEvent } from "react";
import { Shield, Github, Linkedin, Code2, Lock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

const team = [
  {
    name: "Almu'tasim Bellah Alatawnah",
    description: "Architected and built the full-stack platform, end-to-end encrypted file sharing, and zero-knowledge group collaboration system.",
    linkedin: "https://www.linkedin.com/in/motasem-alatawna-02583b272/",
    github: "https://github.com/MutasimAlatawneh/SafeShare",
    icon: Code2,
    initials: "MA",
  },
  {
    name: "Hassan Khaled Aldajah",
    description: "Spearheaded the system security strategy, threat modeling, and cryptographic access controls.",
    linkedin: "https://www.linkedin.com/in/hassan-aldajah04/",
    github: null,
    icon: Lock,
    initials: "HA",
  },
];

const linkClass =
  "text-sm text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const chipClass =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const Footer = () => {
  const location = useLocation();
  const { scrollToSection } = useSmoothScroll();

  const onSectionClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (location.pathname !== "/") return;
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <footer className="border-t border-border">
      {/* ── Meet the Team ─────────────────────────────────────────────────── */}
      <div className="py-20 bg-gradient-to-b from-transparent to-card/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">The People Behind It</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Meet the Engineering Team</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
              SafeShare is a graduation project built with care by two engineers who believe privacy is a right, not a
              feature.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {team.map((member, index) => (
              <Reveal
                key={member.name}
                delay={index * 0.1}
                className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/35 transition-colors duration-300"
              >
                {/* Subtle top accent line */}
                <div aria-hidden="true" className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground group-hover:border-primary/30 transition-colors">
                    {member.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <member.icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{member.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>

                    <div className="flex items-center gap-2 mt-4">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${chipClass} bg-primary/10 text-primary border-primary/25 hover:bg-primary/20`}
                        aria-label={`${member.name} on LinkedIn`}
                      >
                        <Linkedin className="h-3 w-3" aria-hidden="true" />
                        LinkedIn
                      </a>
                      {member.github && (
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${chipClass} bg-secondary text-foreground/80 border-border hover:text-foreground hover:border-primary/30`}
                          aria-label="SafeShare on GitHub"
                        >
                          <Github className="h-3 w-3" aria-hidden="true" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer columns ─────────────────────────────────────────────────── */}
      <div className="py-12 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2 mb-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-lg font-bold text-foreground" translate="no">SafeShare</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                End-to-end encrypted file sharing with zero-knowledge architecture. Your data is mathematically locked
                before it leaves your device.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://github.com/MutasimAlatawneh/SafeShare"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="SafeShare on GitHub"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://www.linkedin.com/in/motasem-alatawna-02583b272/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/#features" className={linkClass} onClick={(e) => onSectionClick(e, "features")}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="/#how-it-works" className={linkClass} onClick={(e) => onSectionClick(e, "how-it-works")}>
                    How It Works
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className={linkClass}>
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Account</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/signin" className={linkClass}>
                    Log In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className={linkClass}>
                    Create Account
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/hassanaldajah" target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Contact Developer
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2026 SafeShare. Co-developed by{" "}
              <a
                href="https://www.linkedin.com/in/motasem-alatawna-02583b272/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Almu'tasim Bellah Alatawnah
              </a>{" "}
              &amp;{" "}
              <a
                href="https://www.linkedin.com/in/hassan-aldajah04/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Hassan Khaled Aldajah
              </a>
              .
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/MutasimAlatawneh/SafeShare"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Open Source
              </a>
              <a href="https://github.com/hassanaldajah" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
