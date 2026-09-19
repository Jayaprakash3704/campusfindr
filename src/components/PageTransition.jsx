import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  initial:  { opacity: 0, y: 10 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -6 },
};

const transition = {
  duration: 0.24,
  ease: [0.4, 0, 0.2, 1],
};

/**
 * Wraps a page in a smooth fade+slide entrance/exit animation.
 * Uses framer-motion. CSS prefers-reduced-motion is also respected via index.css.
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      {children}
    </motion.div>
  );
}
