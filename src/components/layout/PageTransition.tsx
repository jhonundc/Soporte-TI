"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: ReactNode;
}

const enterTransition = { duration: 0.3, ease: "easeOut" as const };
const exitTransition = { duration: 0.2, ease: "easeIn" as const };

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: enterTransition }}
        exit={{ opacity: 0, y: -4, transition: exitTransition }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
