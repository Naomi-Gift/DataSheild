"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
};

function colors(score: number) {
  if (score >= 80) return { bg: "bg-teal-500", shadow: "shadow-teal-glow", ring: "bg-teal-500" };
  if (score >= 70) return { bg: "bg-teal-400", shadow: "shadow-teal-glow", ring: "bg-teal-400" };
  if (score >= 50) return { bg: "bg-amber-500", shadow: "shadow-amber-glow", ring: "bg-amber-500" };
  return { bg: "bg-coral-500", shadow: "shadow-coral-glow", ring: "bg-coral-500" };
}

export function ScoreBadge({ score, size = "md", animate = false }: Props) {
  const c = colors(score);
  const shouldPulse = score >= 80 && animate;

  const dims = {
    sm: { outer: "w-6 h-6", text: "text-[10px]" },
    md: { outer: "w-10 h-10", text: "text-base font-bold" },
    lg: { outer: "w-16 h-16", text: "text-2xl font-bold" },
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      {shouldPulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-60 animate-pulseRing",
            c.ring
          )}
        />
      )}
      <div
        className={cn(
          "relative rounded-full flex flex-col items-center justify-center",
          dims.outer,
          c.bg,
          c.shadow
        )}
      >
        <span className={cn("text-white leading-none", dims.text)}>{score}</span>
        {size === "lg" && (
          <span className="text-white/60 text-[11px] leading-none mt-0.5">/ 100</span>
        )}
      </div>
    </div>
  );
}
