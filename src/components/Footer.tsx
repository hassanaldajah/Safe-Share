import { Shield, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border">
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
            {/* Social links — GitHub & LinkedIn only */}
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

          {/* Product — only real anchor links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="mailto:mutasim.alatawneh@gmail.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Developer
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 SafeShare. Developed by Almu'tasim Bellah Alatawnah.
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
    </footer>
  );
};

export default Footer;