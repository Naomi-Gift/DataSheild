"use client";
import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  hash: string;
  label?: string;
  truncate?: boolean;
};

export function HashDisplay({ hash, label, truncate = true }: Props) {
  const [expanded, setExpanded] = React.useState(false);

  const display =
    truncate && !expanded && hash.length > 18
      ? `${hash.slice(0, 10)}...${hash.slice(-6)}`
      : hash;

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[13px] text-text-secondary">{label}</span>}
      <div className="flex items-center gap-1.5 bg-bg-surface border border-white/10 rounded-[10px] px-2 py-1">
        <span
          className={cn(
            "font-mono text-[12px] text-text-secondary cursor-pointer hover:text-text-primary transition-colors",
            truncate && "select-none"
          )}
          onClick={() => truncate && setExpanded((e) => !e)}
          title={truncate ? (expanded ? "Click to collapse" : "Click to expand") : undefined}
        >
          {display}
        </span>
        <button
          onClick={copy}
          className="text-text-muted hover:text-teal-400 transition-colors flex-shrink-0"
          title="Copy"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0 1h5a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
            <path d="M10 1h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-1V1z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
