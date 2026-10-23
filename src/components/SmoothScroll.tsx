import { useCallback, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { SmoothScrollContext } from "@/hooks/use-smooth-scroll";

// Height of the fixed navbar, so sections do not end up under it after a jump
const NAV_OFFSET = -72;

// Weighted, smooth scrolling for the public pages (Lenis). The scroll position stays native, so
// framer-motion's useScroll and the 3D hero follow it. People who ask for reduced motion keep the
// browser's own scrolling; the dashboard does not use this, its panels scroll natively.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: { offset: NAV_OFFSET },
      stopInertiaOnNavigate: true,
    });
    setLenis(instance);
    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, []);

  const scrollToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1.2 });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
        window.scrollTo({ top });
      }
    },
    [lenis],
  );

  // Arriving from another page with /#section: go there once the page has rendered
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(() => scrollToSection(id), 120);
    return () => window.clearTimeout(timer);
  }, [scrollToSection]);

  return (
    <SmoothScrollContext.Provider value={{ lenis, scrollToSection }}>{children}</SmoothScrollContext.Provider>
  );
}
