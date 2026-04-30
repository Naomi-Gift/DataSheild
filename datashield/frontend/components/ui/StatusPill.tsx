import * as React from "react";
import { cn } from "@/lib/utils";

type Status = "complete" | "pending" | "failed" | "slashed" | "active";

const config: Record<Status, { bg: string; text: string; dot: string; border?: string }> = {
  complete: { bg: "bg-teal-500/15",  text: "text-teal-500",  dot: "bg-teal-500" },
  active:   { bg: "bg-teal-500/15",  text: "text-teal-500",  dot: "bg-teal-500" },
  pending:  { bg: "bg-amber-500/15", text: "text-amber-500", dot: "bg-amber-500" },
  failed:   { bg: "bg-coral-500/15", text: "text-coral-500", dot: "bg-coral-500" },
  slashed:  { bg: "bg-coral-500/20", text: "text-coral-500", dot: "bg-coral-500", border: "border border-coral-500/40" },
};

export function StatusPill({ status }: { status: Status }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold uppercase tracking-wide",
        c.bg, c.text, c.border
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {status}
    </span>
  );
}
