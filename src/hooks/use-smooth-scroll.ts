import { createContext, useContext } from "react";
import type Lenis from "lenis";

type SmoothScrollState = {
  lenis: Lenis | null;
  scrollToSection: (id: string) => void;
};

export const SmoothScrollContext = createContext<SmoothScrollState>({
  lenis: null,
  scrollToSection: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);
