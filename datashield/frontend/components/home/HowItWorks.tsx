"use client";
import * as React from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    num: "01",
    emoji: "📤",
    glow: "#7B6EF6",
    tag: "0G_STORAGE",
    title: "Upload",
    body: "Dataset stored immutably on 0G. Merkle root hash = your cryptographic identity forever.",
  },
  {
    num: "02",
    emoji: "🤖",
    glow: "#1DD9A0",
    tag: "0G_COMPUTE",
    title: "AI Scan",
    body: "3 poison detection algorithms run in parallel on decentralised GPU nodes. Cryptographically verified.",
  },
  {
    num: "03",
    emoji: "🛡",
    glow: "#7B6EF6",
    tag: "0G_CHAIN",
    title: "Mint NFT",
    body: "Score ≥ 70 mints a DataSeal NFT. 100 $0G staked as quality bond — slashable if fraud proven.",
  },
  {
    num: "04",
    emoji: "💸",
    glow: "#1DD9A0",
    tag: "MARKETPLACE",
    title: "Trade",
    body: "Buyers purchase with $0G. Atomic escrow. Staked tokens back every transaction on-chain.",
  },
];

export function HowItWorks() {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-bg-base relative overflow-hidden" ref={ref}>
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(123,110,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(123,110,246,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <div className="font-mono text-[11px] text-purple-400 tracking-[0.2em] uppercase mb-3">[ Protocol Flow ]</div>
          <h2 className="font-black text-[clamp(32px,5vw,52px)] text-white tracking-tight leading-tight">
            How it <span className="gradient-text">works</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Connector */}
          <div className="hidden md:block absolute top-[56px] left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] h-px z-0"
            style={{ background: "linear-gradient(90deg, rgba(123,110,246,0.4), rgba(29,217,160,0.4))" }} />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, boxShadow: `0 0 40px ${s.glow}30` }}
              className="relative card-neon p-6 z-10 cursor-default transition-all duration-200"
            >
              {/* Step number */}
              <div className="absolute top-3 right-3 font-mono text-[10px] text-text-muted">{s.num}</div>

              {/* Tag */}
              <div className="font-mono text-[9px] tracking-[0.15em] mb-3 px-2 py-1 rounded-md inline-block"
                style={{ color: s.glow, background: `${s.glow}15`, border: `1px solid ${s.glow}30` }}>
                {s.tag}
              </div>

              {/* Emoji icon */}
              <div className="text-3xl mb-3">{s.emoji}</div>

              <h3 className="text-[17px] font-bold text-white mb-2">{s.title}</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
