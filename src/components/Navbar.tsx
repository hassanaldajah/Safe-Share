import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { EASE_OUT } from "@/lib/motion";

const sections = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "testimonials", label: "Testimonials" },
];

const linkClass =
  "text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const { scrollToSection } = useSmoothScroll();

  // Only hide on scroll down on the landing page
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 8);
      if (!isLandingPage || isOpen || y < 100) setIsHidden(false);
      else if (y > lastY + 4) setIsHidden(true);
      else if (y < lastY - 4) setIsHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLandingPage, isOpen]);

  // On the landing page the section links glide there; elsewhere they open /#section
  const onSectionClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    setIsOpen(false);
    if (!isLandingPage) return;
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-in-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      } ${isScrolled || isOpen ? "glass shadow-lg shadow-black/20" : "border-b border-transparent"}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-foreground" translate="no">SafeShare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {sections.map((s) => (
              <a key={s.id} href={`/#${s.id}`} className={linkClass} onClick={(e) => onSectionClick(e, s.id)}>
                {s.label}
              </a>
            ))}
            <Link
              to="/pricing"
              className={`${linkClass} ${location.pathname === "/pricing" ? "text-foreground" : ""}`}
              aria-current={location.pathname === "/pricing" ? "page" : undefined}
            >
              Pricing
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/signin">Log In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-1 py-4 border-t border-border">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`/#${s.id}`}
                    className={`${linkClass} py-2.5`}
                    onClick={(e) => onSectionClick(e, s.id)}
                  >
                    {s.label}
                  </a>
                ))}
                <Link to="/pricing" className={`${linkClass} py-2.5`} onClick={() => setIsOpen(false)}>
                  Pricing
                </Link>

                <div className="flex gap-3 pt-4 mt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <Link to="/signin">Log In</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
