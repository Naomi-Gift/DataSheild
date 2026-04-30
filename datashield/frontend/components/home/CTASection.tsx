"use client";
import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

export function CTASection() {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-24 relative overflow-hidden bg-bg-surface" ref={ref}>
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] rounded-full opacity-[0.08] blur-[100px]"
          style={{ background: "radial-gradient(circle, #7B6EF6 0%, #1DD9A0 100%)" }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(123,110,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,110,246,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-[1200px] px-6 text-center"
      >
        <div className="font-mono text-[11px] text-purple-400 tracking-[0.2em] uppercase mb-4">[ Get Started ]</div>
        <h2 className="font-black text-[clamp(36px,6vw,64px)] text-white tracking-tight leading-tight mb-4">
          Certify your data.<br />
          <span className="gradient-text">Own the proof.</span>
        </h2>
        <p className="text-[16px] text-text-secondary mb-10 max-w-[440px] mx-auto">
          First marketplace where AI data quality is enforced on-chain. No trust required.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/upload"
            className="btn-neon px-8 py-4 rounded-xl text-[15px] font-bold tracking-wide">
            Start Uploading →
          </Link>
          <Link href="/marketplace"
            className="px-8 py-4 rounded-xl border border-white/10 text-[15px] font-semibold text-text-secondary hover:border-purple-500/40 hover:text-white transition-all duration-200">
            Browse Market
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
