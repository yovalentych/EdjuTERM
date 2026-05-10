"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      {children}
    </motion.div>
  );
}

export function DashboardSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section variants={item} className={className}>
      {children}
    </motion.section>
  );
}
