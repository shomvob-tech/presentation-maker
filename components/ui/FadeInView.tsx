"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type FadeDirection = "up" | "down" | "left" | "right";

export function FadeInView({
  children,
  delay = 0,
  className = "",
  direction = "up",
  duration = 0.6,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: FadeDirection;
  duration?: number;
}) {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 50 },
    right: { x: -50 },
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
