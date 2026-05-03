"use client";
import * as React from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-bg-base">
      {/* Grid background */}
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(123,110,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(123,110,246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial fade over grid */}
      <div className="absolute inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #05070F 100%)" }}
      />

      {/* Glow blobs */}
      <div className="glow-blob w-[700px] h-[500px] opacity-[0.14]"
        style={{ background: "radial-gradient(circle, #7B6EF6 0%, transparent 70%)", top: "-100px", left: "-200px" }} />
      <div className="glow-blob w-[500px] h-[500px] opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #1DD9A0 0%, transparent 70%)", bottom: "-80px", right: "-100px" }} />

      {/* Horizontal accent lines */}
      <div className="absolute top-1/3 left-0 right-0 h-px opacity-20"
        style={{ background: "linear-gradient(90deg, transparent, #7B6EF6 30%, #1DD9A0 70%, transparent)" }} />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* ── Left ── */}
          <motion.div variants={container} initial="hidden" animate="show" className="flex-1 text-center lg:text-left">

            {/* Eyebrow */}
            <motion.div variants={item} className="inline-flex items-center gap-2 mb-5">
              <span className="font-mono text-[11px] text-purple-400 tracking-[0.15em] uppercase">
                [ 0G Modular AI Infrastructure ]
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={item} className="mb-5 leading-[0.95]">
              <span className="block font-black text-[clamp(48px,8vw,80px)] text-white tracking-tight">
                The Trust Layer
              </span>
              <span
                className="block font-black text-[clamp(48px,8vw,80px)] tracking-tight glitch gradient-text"
                data-text="for AI Data."
              >
                for AI Data.
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p variants={item}
              className="text-[17px] text-text-secondary max-w-[500px] mx-auto lg:mx-0 mb-8 leading-relaxed">
              Upload datasets → AI poison scan → mint on-chain certificate.
              <br />
              <span className="text-white/60">No middlemen. No blind trust. Slashable stakes.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div variants={item} className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
              <Link href="/marketplace"
                className="btn-neon px-7 py-3 rounded-xl text-[14px] font-bold tracking-wide">
                Browse Datasets →
              </Link>
              <Link href="/upload"
                className="px-7 py-3 rounded-xl border border-white/10 text-[14px] font-semibold text-text-secondary hover:border-purple-500/40 hover:text-white transition-all duration-200">
                Certify Your Data
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={item} className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {[
                { v: "100%", l: "On-chain" },
                { v: "60s",  l: "Cert time" },
                { v: "3",    l: "AI checks" },
                { v: "0G",   l: "Powered by" },
              ].map((s) => (
                <div key={s.l} className="text-center lg:text-left">
                  <div className="font-mono text-[20px] font-bold text-purple-400">{s.v}</div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: floating card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 relative"
            style={{ perspective: "1000px" }}
          >
            {/* Glow behind */}
            <div className="absolute inset-[-20px] rounded-3xl blur-3xl opacity-40"
              style={{ background: "radial-gradient(circle, #7B6EF6 0%, transparent 70%)" }} />
            <div className="relative animate-float">
              <HeroCard />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, transparent, #05070F)" }} />
    </section>
  );
}

function HeroCard() {
  return (
    <div className="card-neon w-[300px] p-5 shadow-purple-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-text-muted">DATASEAL</span>
          <span className="font-mono text-[11px] text-purple-400">#047</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">Certified</span>
        </div>
      </div>

      {/* Score + name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <ScoreBadge score={94} size="lg" animate />
        </div>
        <div>
          <div className="text-[15px] font-bold text-white leading-tight">Twitter Sentiment v2</div>
          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/20">
            <span className="text-[10px] font-mono text-purple-300">NLP_CLASSIFICATION</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { l: "SAMPLES", v: "12,400" },
          { l: "PRICE",   v: "2.5 $0G" },
          { l: "STAKE",   v: "100 $0G" },
          { l: "SCORE",   v: "94 / 100" },
        ].map((s) => (
          <div key={s.l} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
            <div className="text-[9px] font-mono text-text-muted tracking-widest">{s.l}</div>
            <div className="text-[13px] font-bold text-white mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Checks */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        {["LABEL", "OUTLIER", "DUP"].map((c) => (
          <div key={c} className="flex items-center gap-1 text-[10px] font-mono text-teal-400">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1.5 5 4 7.5 8.5 2.5"/>
            </svg>
            {c}
          </div>
        ))}
        <div className="ml-auto text-[9px] font-mono text-text-muted">0G CHAIN</div>
      </div>
    </div>
  );
}
