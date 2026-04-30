"use client";
import * as React from "react";
import { motion, useInView } from "framer-motion";

const cards = [
  {
    span: "md:col-span-2",
    tag: "ECONOMICS",
    emoji: "⚡",
    title: "Skin in the Game",
    body: "Every uploader bonds 100 $0G. Dataset causes model harm? Stake slashed, sent to reporter. First marketplace where data quality has real financial consequences.",
    accent: "#7B6EF6",
    extra: (
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        {["Bond 100 $0G", "→", "Fraud detected", "→", "Slash + reward"].map((t, i) => (
          t === "→"
            ? <span key={i} className="text-text-muted text-[16px]">→</span>
            : <span key={i} className="font-mono text-[11px] px-3 py-1.5 rounded-lg"
                style={i === 0
                  ? { background: "rgba(123,110,246,0.12)", color: "#9B91F8", border: "1px solid rgba(123,110,246,0.2)" }
                  : i === 2
                  ? { background: "rgba(245,97,74,0.12)", color: "#F7806C", border: "1px solid rgba(245,97,74,0.2)" }
                  : { background: "rgba(29,217,160,0.12)", color: "#4DE6B8", border: "1px solid rgba(29,217,160,0.2)" }
                }>
                {t}
              </span>
        ))}
      </div>
    ),
  },
  {
    span: "md:col-span-1",
    tag: "0G_COMPUTE",
    emoji: "🤖",
    title: "90% Cheaper AI",
    body: "All inference on 0G's decentralised GPU network. Cryptographically verified via TeeML. No AWS. No trust.",
    accent: "#1DD9A0",
    extra: (
      <div className="mt-4 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-pulseRing" style={{ background: "rgba(29,217,160,0.15)" }} />
          <div className="absolute inset-2 rounded-full animate-pulseRing" style={{ background: "rgba(29,217,160,0.1)", animationDelay: "0.6s" }} />
          <div className="relative w-full h-full rounded-full flex items-center justify-center"
            style={{ background: "rgba(29,217,160,0.08)", border: "1px solid rgba(29,217,160,0.3)" }}>
            <span className="font-mono text-[13px] font-bold text-teal-400">0G</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    span: "md:col-span-1",
    tag: "0G_STORAGE",
    emoji: "🗄",
    title: "Immutable Storage",
    body: "Datasets on 0G's decentralised network. Permanent. Tamper-proof. Merkle-rooted.",
    accent: "#7B6EF6",
  },
  {
    span: "md:col-span-1",
    tag: "0G_CHAIN",
    emoji: "⛓",
    title: "On-chain Proofs",
    body: "Every certificate is a verifiable NFT. No trust required. Verify without DataShield.",
    accent: "#1DD9A0",
  },
  {
    span: "md:col-span-1",
    tag: "0G_DA",
    emoji: "📡",
    title: "DA Replay",
    body: "Scan logs archived on 0G DA. Replay any audit independently. Fully trustless.",
    accent: "#7B6EF6",
  },
];

export function WhyDataShield() {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-24 bg-bg-base relative overflow-hidden" ref={ref}>
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-14 text-center">
          <div className="font-mono text-[11px] text-purple-400 tracking-[0.2em] uppercase mb-3">[ Why DataShield ]</div>
          <h2 className="font-black text-[clamp(32px,5vw,52px)] text-white tracking-tight">
            Built different<span className="gradient-text">.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -5, boxShadow: `0 0 40px ${c.accent}25` }}
              className={`card-neon p-6 transition-all duration-200 ${c.span}`}
            >
              <div className="font-mono text-[9px] tracking-[0.15em] mb-3 px-2 py-1 rounded-md inline-block"
                style={{ color: c.accent, background: `${c.accent}12`, border: `1px solid ${c.accent}25` }}>
                {c.tag}
              </div>
              <div className="text-2xl mb-2">{c.emoji}</div>
              <h3 className="text-[18px] font-bold text-white mb-2">{c.title}</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">{c.body}</p>
              {c.extra}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
