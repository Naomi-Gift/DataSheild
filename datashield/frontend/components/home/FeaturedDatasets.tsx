"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

const featured = [
  { id: 1, name: "Twitter Sentiment v3",      type: "NLP",               score: 94, samples: 15200, price: "3.5",  hot: true },
  { id: 2, name: "Medical Image Segmentation",type: "Image",             score: 87, samples: 8400,  price: "12",   hot: false },
  { id: 3, name: "E-commerce Reviews",        type: "Text Classification",score: 91, samples: 22100, price: "5",   hot: true },
  { id: 4, name: "Autonomous Driving Frames", type: "Object Detection",  score: 78, samples: 45000, price: "28",   hot: false },
];

export function FeaturedDatasets() {
  return (
    <section className="py-20 bg-bg-surface relative overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="font-mono text-[11px] text-teal-400 tracking-[0.2em] uppercase mb-2">[ Recently Certified ]</div>
            <h2 className="font-black text-[28px] text-white tracking-tight">Hot Datasets</h2>
          </div>
          <Link href="/marketplace"
            className="font-mono text-[12px] text-purple-400 hover:text-purple-300 transition-colors tracking-wide uppercase">
            View all →
          </Link>
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {featured.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -6, boxShadow: "0 0 40px rgba(123,110,246,0.25)" }}
                className="card-neon flex-shrink-0 w-[240px] p-4 transition-all duration-200 cursor-pointer"
              >
                {/* Hot badge */}
                {d.hot && (
                  <div className="flex justify-end mb-2">
                    <span className="font-mono text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full tracking-widest">
                      🔥 HOT
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <ScoreBadge score={d.score} size="md" animate={d.score >= 80} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white leading-tight truncate">{d.name}</div>
                    <div className="font-mono text-[9px] text-purple-300 mt-1 tracking-wider">{d.type.toUpperCase()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[11px] text-text-muted font-mono">{d.samples.toLocaleString()} rows</span>
                  <span className="font-mono text-[14px] font-bold text-white">{d.price} <span className="text-purple-400 text-[11px]">$0G</span></span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-4 w-20 pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, #080A18)" }} />
        </div>
      </div>
    </section>
  );
}
