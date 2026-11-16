import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.2 });

  return (
    <motion.div
      style={{ scaleX: width }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-(--color-accent) z-[70]"
    />
  );
}
