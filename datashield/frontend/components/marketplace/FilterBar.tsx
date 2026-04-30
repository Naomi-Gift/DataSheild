"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const MODEL_TYPES = ["all", "text-classification", "image-segmentation", "object-detection", "nlp", "tabular", "other"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "score",  label: "Score ↓" },
  { value: "price",  label: "Price ↑" },
];

export function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const [modelType, setModelType] = React.useState(sp.get("modelType") || "all");
  const [minScore,  setMinScore]  = React.useState(Number(sp.get("minScore") || 0));
  const [sort,      setSort]      = React.useState(sp.get("sort") || "newest");

  function apply() {
    const params = new URLSearchParams();
    if (modelType !== "all") params.set("modelType", modelType);
    if (minScore > 0) params.set("minScore", String(minScore));
    if (sort !== "newest") params.set("sort", sort);
    router.push(`/marketplace?${params.toString()}`);
  }

  const scoreColor = minScore >= 80 ? "text-teal-500" : minScore >= 70 ? "text-teal-400" : minScore >= 50 ? "text-amber-500" : "text-text-muted";

  return (
    <div className="card-neon px-4 py-3 flex flex-wrap items-center gap-4">
      {/* Model type */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-text-muted tracking-wider">TYPE</span>
        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value)}
          className={cn(
            "h-8 px-3 rounded-[8px] text-[12px] font-medium bg-bg-input border transition-colors outline-none",
            modelType !== "all" ? "border-purple-500 text-purple-400" : "border-white/10 text-text-secondary"
          )}
        >
          {MODEL_TYPES.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All types" : t}</option>
          ))}
        </select>
      </div>

      {/* Min score */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-text-muted tracking-wider">MIN SCORE</span>
        <input
          type="range" min={0} max={100} step={5}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-24 accent-purple-500"
        />
        <span className={cn("text-[12px] font-semibold w-6 text-center", scoreColor)}>{minScore}</span>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-text-muted tracking-wider">SORT</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={cn(
            "h-8 px-3 rounded-[8px] text-[12px] font-medium bg-bg-input border transition-colors outline-none",
            sort !== "newest" ? "border-purple-500 text-purple-400" : "border-white/10 text-text-secondary"
          )}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={apply}
        className="ml-auto h-8 px-4 rounded-[8px] btn-neon text-[11px] font-mono font-bold tracking-widest"
      >
        APPLY
      </button>
    </div>
  );
}
