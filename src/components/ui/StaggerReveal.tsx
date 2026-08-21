// src/components/ui/StaggerReveal.tsx
// New component for staggered children animations

"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode, Children, isValidElement, cloneElement } from "react";

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  amount?: number;
  once?: boolean;
}

export function StaggerReveal({
  children,
  className = "",
  staggerDelay = 0.1,
  duration = 0.5,
  direction = "up",
  amount = 0.2,
  once = true,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount, once });

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 40 };
      case "down":
        return { opacity: 0, y: -40 };
      case "left":
        return { opacity: 0, x: -40 };
      case "right":
        return { opacity: 0, x: 40 };
      case "none":
        return { opacity: 0 };
      default:
        return { opacity: 0, y: 40 };
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const childVariants = {
    hidden: getInitial(),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
          return cloneElement(child, {
            variants: childVariants,
          } as any);
        }
        return child;
      })}
    </motion.div>
  );
}