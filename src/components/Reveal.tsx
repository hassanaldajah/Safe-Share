import { motion, type HTMLMotionProps } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

type RevealProps = HTMLMotionProps<"div"> & { delay?: number; y?: number };

// One entrance for every landing section: a short rise and fade, played once when it scrolls into view.
export function Reveal({ delay = 0, y = 24, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
