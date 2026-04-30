import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "purple";
};

export function GradientText({ children, className, variant = "default" }: Props) {
  return (
    <span
      className={cn(
        variant === "purple" ? "gradient-text-purple" : "gradient-text",
        className
      )}
    >
      {children}
    </span>
  );
}
