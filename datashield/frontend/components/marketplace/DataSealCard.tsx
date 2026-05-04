"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { WalletButton } from "@/components/ui/WalletButton";
import { formatAddress, formatNumber } from "@/lib/utils";
import { DATAMARKET_ABI, DATAMARKET_ADDRESS, ERC20_ABI, OG_TOKEN_ADDRESS } from "@/lib/contracts";
import { parseEther } from "viem";

export type SealCardData = {
  tokenId: number;
  datasetName: string;
  modelType: string;
  score: number;
  price: string;
  stake: string;
  uploader: string;
  sampleCount: number;
  slashed: boolean;
  checks?: { label?: { passed: boolean }; embed?: { passed: boolean }; dup?: { passed: boolean } };
};

function scoreAccent(score: number) {
  if (score >= 80) return "#1DD9A0";
  if (score >= 70) return "#4DE6B8";
  if (score >= 50) return "#F5A623";
  return "#F5614A";
}

export function DataSealCard({ seal }: { seal: SealCardData }) {
  const { isConnected, address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const accent = scoreAccent(seal.score);

  async function purchase() {
    try {
      // Step 2: approve ERC20 spend
      setStep(2);
      const priceWei = parseEther(seal.price);
      await writeContractAsync({
        address: OG_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [DATAMARKET_ADDRESS, priceWei],
      });

      // Step 3: purchase
      setStep(3);
      await writeContractAsync({
        address: DATAMARKET_ADDRESS,
        abi: DATAMARKET_ABI,
        functionName: "purchase",
        args: [BigInt(seal.tokenId)],
      });
      toast.success(`DataSeal #${seal.tokenId} is yours.`, {
        action: { label: "Explorer ↗", onClick: () => window.open("https://chainscan-galileo.0g.ai", "_blank") },
      });
      setOpen(false);
      setStep(1);
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Purchase failed");
      setStep(1);
    }
  }

  const labelPassed = seal.checks?.label?.passed !== false;
  const embedPassed = seal.checks?.embed?.passed !== false;
  const dupPassed   = seal.checks?.dup?.passed !== false;

  return (
    <>
      <motion.div
        whileHover={{ y: -6, boxShadow: `0 0 40px ${accent}20, 0 0 0 1px ${accent}20` }}
        transition={{ duration: 0.2 }}
        className="card-neon overflow-hidden transition-all duration-200 relative"
      >
        {seal.slashed && (
          <div className="absolute inset-0 bg-coral-500/5 z-10 pointer-events-none" />
        )}

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-muted">DATASEAL</span>
            <span className="font-mono text-[10px] text-purple-400">#{seal.tokenId}</span>
          </div>
          {seal.slashed ? (
            <span className="font-mono text-[9px] font-bold text-coral-500 bg-coral-500/10 border border-coral-500/20 px-2 py-0.5 rounded-full tracking-widest">
              ⚠ SLASHED
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
              <span className="font-mono text-[9px] font-bold tracking-widest" style={{ color: accent }}>CERTIFIED</span>
            </div>
          )}
        </div>

        {/* Score + name */}
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <ScoreBadge score={seal.score} size="md" animate={seal.score >= 80} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-white truncate">{seal.datasetName}</div>
            <div className="font-mono text-[9px] mt-1 tracking-wider px-1.5 py-0.5 rounded inline-block"
              style={{ color: "#9B91F8", background: "rgba(123,110,246,0.1)", border: "1px solid rgba(123,110,246,0.15)" }}>
              {seal.modelType.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted tracking-wider">SAMPLES</span>
            <span className="font-mono text-[12px] text-white">{formatNumber(seal.sampleCount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted tracking-wider">UPLOADER</span>
            <span className="font-mono text-[11px] text-text-secondary">{formatAddress(seal.uploader)}</span>
          </div>
          {/* Checks */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted tracking-wider">CHECKS</span>
            <div className="flex items-center gap-2">
              {[["L", labelPassed], ["O", embedPassed], ["D", dupPassed]].map(([l, p]) => (
                <span key={String(l)} className="font-mono text-[10px] font-bold"
                  style={{ color: p ? "#1DD9A0" : "#F5614A" }}>
                  {p ? "✓" : "✕"}{l}
                </span>
              ))}
            </div>
          </div>
          <Link href={`/verify?tokenId=${seal.tokenId}`}
            className="block font-mono text-[10px] text-text-muted hover:text-purple-400 transition-colors tracking-wider">
            VIEW_PROOF →
          </Link>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-white/5"
          style={{ background: "rgba(255,255,255,0.015)" }}>
          <div>
            <div className="font-mono text-[18px] font-bold text-white">{seal.price}
              <span className="text-[11px] text-purple-400 ml-1">$0G</span>
            </div>
            <div className="font-mono text-[9px] text-text-muted">stake: {seal.stake} $0G</div>
          </div>
          {seal.slashed ? (
            <button disabled className="px-4 py-2 rounded-xl font-mono text-[11px] font-bold text-coral-500 bg-coral-500/10 border border-coral-500/20 cursor-not-allowed">
              UNAVAILABLE
            </button>
          ) : !isConnected ? (
            <WalletButton />
          ) : (
            <button onClick={() => setOpen(true)}
              className="btn-neon px-4 py-2 rounded-xl font-mono text-[12px] font-bold tracking-wide">
              BUY NOW
            </button>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[380px] px-4">
            <div className="card-neon p-6 shadow-purple-glow">
              <div className="font-mono text-[10px] text-purple-400 tracking-[0.15em] mb-3">
                {step === 1 ? "[ CONFIRM_PURCHASE ]" : step === 2 ? "[ APPROVING_ERC20 ]" : "[ PROCESSING... ]"}
              </div>
              <Dialog.Title className="text-[20px] font-bold text-white mb-1">
                {step === 1 ? "Confirm Purchase" : step === 2 ? "Approving..." : "Purchasing..."}
              </Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-secondary mb-5">
                {step === 1 ? seal.datasetName : step === 2 ? "Approve $0G spend in your wallet" : "Confirm purchase in your wallet"}
              </Dialog.Description>

              {step === 1 && (
                <>
                  <div className="space-y-2 mb-5 font-mono text-[12px]">
                    {[
                      ["DATASET", seal.datasetName],
                      ["PRICE",   `${seal.price} $0G`],
                      ["TOKEN",   `#${seal.tokenId}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-text-muted">{k}</span>
                        <span className="text-white font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-text-muted mb-4 bg-bg-elevated rounded-xl px-3 py-2 border border-white/8">
                    Two wallet confirmations required: (1) approve $0G spend, (2) purchase
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 font-mono text-[12px] text-text-secondary hover:border-white/20 transition-colors">
                      CANCEL
                    </button>
                    <button onClick={purchase} disabled={isPending}
                      className="flex-1 btn-neon py-2.5 rounded-xl font-mono text-[12px] font-bold disabled:opacity-60">
                      CONFIRM
                    </button>
                  </div>
                </>
              )}
              {(step === 2 || step === 3) && (
                <div className="flex flex-col items-center py-6 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <span className="font-mono text-[12px] text-text-secondary">
                    {step === 2 ? "Step 1/2 — Approve in wallet..." : "Step 2/2 — Confirm purchase..."}
                  </span>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
