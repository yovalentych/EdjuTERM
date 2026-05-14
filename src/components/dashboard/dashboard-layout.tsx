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

export function DashboardLayout({
  children,
  variant = "main-aside",
}: {
  children: ReactNode;
  variant?: "main-aside" | "single" | "wide";
}) {
  const layoutClass = {
    "main-aside": "app-grid-main-aside",
    single: "app-stack",
    wide: "app-grid-dashboard",
  }[variant];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={layoutClass}
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
