// Shared motion settings for the public pages, so every section moves the same way.

// Fast start, long soft landing (an "ease out quint"-like curve)
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

export const staggerChildren = (stagger = 0.1, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
