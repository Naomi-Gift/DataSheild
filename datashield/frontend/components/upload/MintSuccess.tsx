"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/GradientText";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

type Props = {
  tokenId?: number;
  txHash?: string;
  score: number;
  datasetName: string;
  onReset: () => void;
};

export function MintSuccess({ tokenId, txHash, score, datasetName, onReset }: Props) {
  const confettiRef = React.useRef(false);

  React.useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    import("canvas-confetti").then((m) => {
      const confetti = m.default;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#7B6EF6", "#1DD9A0", "#9B91F8", "#4DE6B8"] });
      setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 }, colors: ["#7B6EF6", "#1DD9A0"] }), 300);
    });
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="glass rounded-2xl border border-teal-500/20 p-8 text-center shadow-teal-glow"
    >
      {/* Shield icon */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulseRing scale-150" />
        <div className="relative w-20 h-20 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L4 6.5V13c0 5.5 4.2 10.6 10 12 5.8-1.4 10-6.5 10-12V6.5L14 2z"
              fill="url(#mintShield)"/>
            <path d="M9 14l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="mintShield" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1DD9A0"/>
                <stop offset="1" stopColor="#4DE6B8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <h2 className="text-[28px] font-bold mb-1">
        <GradientText variant="default">
          {tokenId ? `DataSeal #${tokenId} Minted!` : "DataSeal Minted!"}
        </GradientText>
      </h2>
      <p className="text-[14px] text-text-secondary mb-6">Your dataset is now certified on 0G Chain</p>

      <div className="flex items-center justify-center gap-4 mb-8">
        <ScoreBadge score={score} size="lg" animate />
        <div className="text-left">
          <div className="text-[15px] font-semibold text-text-primary">{datasetName}</div>
          <div className="text-[12px] text-teal-400 mt-1">Certified · Stake bonded</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {txHash && (
          <a
            href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-[10px] border border-white/10 text-[13px] text-text-secondary hover:border-white/18 hover:text-text-primary transition-colors"
          >
            View on Explorer ↗
          </a>
        )}
        <Link
          href="/marketplace"
          className="px-5 py-2.5 rounded-[10px] bg-purple-500 text-white text-[13px] font-semibold hover:bg-purple-400 hover:shadow-purple-glow transition-all"
        >
          List on Marketplace →
        </Link>
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-[10px] border border-white/10 text-[13px] text-text-secondary hover:border-white/18 transition-colors"
        >
          Upload Another
        </button>
      </div>
    </motion.div>
  );
}
