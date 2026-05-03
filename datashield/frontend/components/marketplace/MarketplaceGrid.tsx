"use client";
import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { DataSealCard, type SealCardData } from "./DataSealCard";

const easeOutQuart = [0.25, 0.46, 0.45, 0.94] as const;

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutQuart } },
};

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <div className="bg-bg-elevated p-4 flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
      <div className="border-t border-white/6 px-4 py-3 flex items-center justify-between">
        <div className="skeleton h-6 w-20 rounded" />
        <div className="skeleton h-8 w-24 rounded-[10px]" />
      </div>
    </div>
  );
}

type Props = {
  listings: SealCardData[];
  loading?: boolean;
};

export function MarketplaceGrid({ listings, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="glass rounded-2xl border border-white/8 p-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <div className="text-[17px] font-semibold text-text-primary mb-2">No datasets match your filters</div>
        <div className="text-[13px] text-text-secondary">Try adjusting the model type or minimum score</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {listings.map((l) => (
        <motion.div key={l.tokenId} variants={item}>
          <DataSealCard seal={l} />
        </motion.div>
      ))}
    </motion.div>
  );
}
