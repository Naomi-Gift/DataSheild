"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlowColor = "purple" | "teal" | "coral";

const glowMap: Record<GlowColor, string> = {
  purple: "0 0 32px rgba(123,110,246,0.25)",
  teal:   "0 0 32px rgba(29,217,160,0.22)",
  coral:  "0 0 32px rgba(245,97,74,0.22)",
};

type Props = {
  children: React.ReactNode;
  glowColor?: GlowColor;
  className?: string;
  onClick?: () => void;
};

export function GlowCard({ children, glowColor = "purple", className, onClick }: Props) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: glowMap[glowColor] }}
      transition={{ duration: 0.2 }}
      className={cn(
        "glass rounded-2xl border border-white/8 transition-colors duration-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
