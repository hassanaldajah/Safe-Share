import { Shield, Github, Linkedin, Code2, Lock } from "lucide-react";

const team = [
  {
    name: "Almu'tasim Bellah Alatawnah",
    description: "Architected and built the full-stack platform, end-to-end encrypted file sharing, and zero-knowledge group collaboration system.",
    linkedin: "https://www.linkedin.com/in/motasem-alatawna-02583b272/",
    github: "https://github.com/MutasimAlatawneh/SafeShare",
    icon: <Code2 className="h-5 w-5 text-emerald-400" />,
    initials: "MA",
  },
  {
    name: "Hassan Khaled Aldajah",
    description: "Spearheaded the system security strategy, threat modeling, and cryptographic access controls.",
    linkedin: "https://www.linkedin.com/in/hassan-aldajah04/",
    github: null,
    icon: <Lock className="h-5 w-5 text-sky-400" />,
    initials: "HA",
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border">

      {/* ── Meet the Team Section ─────────────────────────────────────────── */}
      <div className="py-16 bg-gradient-to-b from-slate-900/0 to-slate-900/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase mb-3">
              The People Behind It
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
              Meet the Engineering Team
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              SafeShare is a graduation project built with care by two engineers
              who believe privacy is a right, not a feature.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {team.map((member) => (
              <div
                key={member.name}
                className="group relative bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-full" />

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-700/70 border border-slate-600/50 flex items-center justify-center font-bold text-sm text-gray-200 group-hover:border-emerald-500/30 transition-colors">
                    {member.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {member.icon}
                      <h3 className="font-semibold text-gray-100 text-sm leading-snug">
                        {member.name}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-emerald-400 mb-2">
                      {member.role}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>

                    {/* Links */}
                    <div className="flex items-center gap-2 mt-4">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium hover:bg-sky-500/20 hover:border-sky-400/40 transition-all duration-200"
                        aria-label={`${member.name} on LinkedIn`}
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                      </a>
                      {member.github && (
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 text-gray-300 border border-slate-600/50 text-xs font-medium hover:bg-slate-700 hover:text-gray-100 transition-all duration-200"
                          aria-label="SafeShare on GitHub"
                        >
                          <Github className="h-3 w-3" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer columns ─────────────────────────────────────────────────── */}
      <div className="py-12 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-12">

            {/* Brand */}
            <div>
              <a href="/" className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">SafeShare</span>
              </a>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                End-to-end encrypted file sharing with zero-knowledge architecture.
                Your data is mathematically locked before it leaves your device.
              </p>
              {/* Project social links */}
              <div className="flex gap-3">
                <a
                  href="https://github.com/MutasimAlatawneh/SafeShare"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/motasem-alatawna-02583b272/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="mailto:mutasim.alatawneh@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Almu'tasim Bellah Alatawnah
              </a>{" "}
              &amp;{" "}
              <a
                href="https://www.linkedin.com/in/hassan-aldajah04/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 transition-colors font-medium"
              >
                Hassan Khaled Aldajah
              </a>
              .
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://github.com/MutasimAlatawneh/SafeShare"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Open Source
              </a>
              <a href="mailto:mutasim.alatawneh@gmail.com" className="hover:text-foreground transition-colors">
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