"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWriteContract } from "wagmi";
import { toast } from "sonner";
import { UploadZone } from "@/components/upload/UploadZone";
import { ScanProgress } from "@/components/upload/ScanProgress";
import { MintSuccess } from "@/components/upload/MintSuccess";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { GradientText } from "@/components/ui/GradientText";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn, scoreTier } from "@/lib/utils";
import type { ScanResult } from "@/lib/api";
import { DATASEAL_ABI, DATASEAL_ADDRESS, DATAMARKET_ABI, DATAMARKET_ADDRESS, ERC20_ABI, OG_TOKEN_ADDRESS } from "@/lib/contracts";
import { parseEther } from "viem";
import { usePublicClient } from "wagmi";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { n: 1, label: "Upload" },
  { n: 2, label: "Scan" },
  { n: 3, label: "Review" },
  { n: 4, label: "Certify" },
  { n: 5, label: "List" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = current > s.n;
        const active = current === s.n;
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all duration-300",
                done   ? "bg-teal-500 text-white" :
                active ? "bg-purple-500 text-white shadow-purple-glow" :
                         "bg-bg-elevated text-text-muted border border-white/10"
              )}>
                {done ? "✓" : s.n}
              </div>
              <span className={cn("text-[11px] font-medium", active ? "text-text-primary" : "text-text-muted")}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-2 mb-5 transition-colors duration-300", done ? "bg-teal-500/40" : "bg-white/8")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PreviewCard({ step, result, fileName }: { step: Step; result: ScanResult | null; fileName?: string }) {
  const score = result?.score ?? 0;
  const listing = result?.listing || {};

  if (step === 1) {
    return (
      <div className="glass rounded-2xl border-2 border-dashed border-white/10 p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
        <div className="text-3xl mb-3">🛡</div>
        <div className="text-[15px] font-medium text-text-muted">Your DataSeal will appear here</div>
        <div className="text-[12px] text-text-muted mt-1">Upload a dataset to begin</div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-6 min-h-[280px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <div className="text-[14px] text-text-secondary">Scanning {fileName || "dataset"}...</div>
        <div className="text-[12px] text-text-muted">0G Compute nodes are running AI checks</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <ScoreBadge score={score} size="lg" animate={score >= 80} />
        <div>
          <div className="text-[15px] font-semibold text-text-primary">{listing.name || fileName || "Dataset"}</div>
          <div className="text-[12px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded mt-1 inline-block">{listing.modelType || "Unknown"}</div>
        </div>
      </div>
      <div className="space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-text-muted">Score</span>
          <span className={score >= 70 ? "text-teal-400" : "text-coral-400"}>{score} — {scoreTier(score)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Samples</span>
          <span className="text-text-secondary">{result?.sampleCount?.toLocaleString() || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Stake required</span>
          <span className="text-text-secondary">100 $0G</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Status</span>
          <StatusPill status={score >= 70 ? "complete" : "failed"} />
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [step, setStep]     = React.useState<Step>(1);
  const [jobId, setJobId]   = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [fileName, setFileName] = React.useState<string | undefined>();
  const [txHash, setTxHash] = React.useState<string | undefined>();
  const [tokenId, setTokenId] = React.useState<number | undefined>();
  const [minted, setMinted] = React.useState(false);
  const [listPrice, setListPrice] = React.useState("10");
  const [listing, setListing] = React.useState(false);
  const [listed, setListed] = React.useState(false);

  const { writeContractAsync, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  function onUpload(id: string, immediateResult?: ScanResult) {
    setJobId(id);
    if (immediateResult?.status === "complete") {
      // Backend returned full result inline — skip polling step
      setResult(immediateResult);
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function onScanComplete(r: ScanResult) { setResult(r); setStep(3); }

  async function mint() {
    if (!result || result.status !== "complete") return;
    if (!result.rootHash || !result.scanResultHash || !result.oracleSig) {
      toast.error("Missing scan result fields for minting");
      return;
    }
    if (result.oracleSig === "0x") {
      toast.error("Oracle signature missing — check ORACLE_PRIVATE_KEY is set correctly in the backend environment variables");
      return;
    }
    if (!DATASEAL_ADDRESS || DATASEAL_ADDRESS === "0x") {
      toast.error("Contract address not configured — check NEXT_PUBLIC_DATASEAL_ADDRESS env var");
      return;
    }
    const listingData = result.listing || {};
    const datasetName = String(listingData.name || "Unnamed Dataset");
    const modelType   = String(listingData.modelType || "other");
    const sampleCount = BigInt(result.sampleCount || 0);
    const score       = Number(result.score || 0);

    try {
      setStep(4);
      const hash = await writeContractAsync({
        address: DATASEAL_ADDRESS,
        abi: DATASEAL_ABI,
        functionName: "mint",
        args: [
          result.rootHash as `0x${string}`,
          result.scanResultHash as `0x${string}`,
          score,
          datasetName,
          modelType,
          sampleCount,
          result.oracleSig as `0x${string}`,
        ],
        value: 100n * 10n ** 18n,
      });
      setTxHash(hash);

      // Extract tokenId from receipt logs
      if (publicClient && hash) {
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          // The Sealed event: Sealed(uint256 indexed tokenId, ...)
          // topic[1] is the tokenId
          const sealedLog = receipt.logs.find(
            (l) => l.address.toLowerCase() === DATASEAL_ADDRESS.toLowerCase() && l.topics.length >= 2
          );
          if (sealedLog?.topics[1]) {
            setTokenId(Number(BigInt(sealedLog.topics[1])));
          }
        } catch {
          // tokenId extraction failed, continue without it
        }
      }

      setMinted(true);
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Mint failed");
      setStep(3);
    }
  }

  async function listOnMarket() {
    if (!tokenId) { toast.error("Token ID not found"); return; }
    const priceWei = parseEther(listPrice || "0");
    if (priceWei <= 0n) { toast.error("Enter a valid price"); return; }
    try {
      setListing(true);
      // Approve NFT transfer to DataMarket
      await writeContractAsync({
        address: DATASEAL_ADDRESS,
        abi: DATASEAL_ABI,
        functionName: "approve",
        args: [DATAMARKET_ADDRESS, BigInt(tokenId)],
      });
      // List on market
      await writeContractAsync({
        address: DATAMARKET_ADDRESS,
        abi: DATAMARKET_ABI,
        functionName: "list",
        args: [BigInt(tokenId), priceWei],
      });
      setListed(true);
      toast.success(`DataSeal #${tokenId} listed for ${listPrice} $0G`);
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Listing failed");
    } finally {
      setListing(false);
    }
  }

  function reset() {
    setStep(1); setJobId(null); setResult(null); setFileName(undefined);
    setTxHash(undefined); setTokenId(undefined); setMinted(false);
    setListPrice("10"); setListing(false); setListed(false);
  }

  const score    = result?.score ?? 0;
  const canMint  = result?.status === "complete" && score >= 70;
  const listingData  = result?.listing || {};

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-text-primary">
            <GradientText>Upload & Certify</GradientText>
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Upload a dataset, run AI poison detection, then mint a DataSeal certificate on 0G.
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: step content */}
          <div>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <UploadZone onUpload={(id, result) => { onUpload(id, result); }} />
                </motion.div>
              )}

              {step === 2 && jobId && (
                <motion.div key="step2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <ScanProgress jobId={jobId} onComplete={onScanComplete} />
                </motion.div>
              )}

              {step === 3 && result && !minted && (
                <motion.div key="step3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <div className="glass rounded-2xl border border-white/10 p-6">
                    <div className="text-[17px] font-semibold text-text-primary mb-4">Scan Results</div>

                    {/* Check breakdown */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: "Label Check",    passed: result.checks?.label?.passed !== false },
                        { label: "Outlier Check",  passed: result.checks?.embed?.passed !== false },
                        { label: "Duplicate Check",passed: result.checks?.dup?.passed !== false },
                      ].map((c) => (
                        <div key={c.label} className={cn(
                          "rounded-xl p-3 border text-center",
                          c.passed ? "bg-teal-500/10 border-teal-500/20" : "bg-coral-500/10 border-coral-500/20"
                        )}>
                          <div className="text-[11px] text-text-muted mb-1">{c.label}</div>
                          <div className={cn("text-[13px] font-semibold", c.passed ? "text-teal-400" : "text-coral-400")}>
                            {c.passed ? "Passed" : "Failed"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI listing preview */}
                    {listingData.name && (
                      <div className="bg-bg-elevated rounded-xl p-4 mb-5 border border-white/8">
                        <div className="text-[11px] text-text-muted mb-2 uppercase tracking-wider">AI-Generated Listing</div>
                        <div className="text-[14px] font-semibold text-text-primary">{listingData.name}</div>
                        {listingData.description && <div className="text-[12px] text-text-secondary mt-1">{listingData.description}</div>}
                        {listingData.modelType && <div className="text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded mt-2 inline-block">{listingData.modelType}</div>}
                      </div>
                    )}

                    {canMint ? (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-4 text-[13px] text-teal-400">
                          ✓ Dataset verified — ready to certify on 0G Chain
                        </div>
                        <div className="flex items-center justify-between text-[13px] text-text-muted bg-bg-elevated rounded-xl px-4 py-3">
                          <span>Stake required</span>
                          <span className="text-text-primary font-semibold">100 $0G</span>
                        </div>
                        <button
                          onClick={mint}
                          disabled={isPending}
                          className="w-full py-3 rounded-[10px] bg-purple-500 text-white text-[15px] font-semibold hover:bg-purple-400 hover:shadow-purple-glow disabled:opacity-60 transition-all duration-200"
                        >
                          {isPending ? "Minting..." : "Certify Dataset →"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-coral-500/10 border border-coral-500/20 p-4 text-[13px] text-coral-400">
                          ✕ Dataset rejected — score {score} is below the minimum threshold of 70
                        </div>
                        <button onClick={reset}
                          className="w-full py-3 rounded-[10px] border border-white/10 text-[14px] text-text-secondary hover:border-white/18 transition-colors">
                          Try Another Dataset
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {(step === 4 || (minted && step !== 5)) && (
                <motion.div key="step4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  {minted ? (
                    <MintSuccess
                      txHash={txHash}
                      tokenId={tokenId}
                      score={score}
                      datasetName={listingData.name || "Dataset"}
                      onReset={reset}
                      onList={() => setStep(5)}
                    />
                  ) : (
                    <div className="glass rounded-2xl border border-white/10 p-8 text-center">
                      <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
                      <div className="text-[17px] font-semibold text-text-primary mb-2">Minting your DataSeal NFT...</div>
                      <div className="text-[13px] text-text-secondary">Confirm the transaction in your wallet</div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <div className="glass rounded-2xl border border-white/10 p-6">
                    {listed ? (
                      <div className="text-center py-6">
                        <div className="text-4xl mb-4">🎉</div>
                        <div className="text-[20px] font-bold text-text-primary mb-2">Listed on Marketplace!</div>
                        <div className="text-[13px] text-text-secondary mb-6">
                          DataSeal {tokenId ? `#${tokenId}` : ""} is now live for {listPrice} $0G
                        </div>
                        <div className="flex gap-3 justify-center">
                          <a href="/marketplace"
                            className="px-5 py-2.5 rounded-[10px] bg-purple-500 text-white text-[13px] font-semibold hover:bg-purple-400 hover:shadow-purple-glow transition-all">
                            View in Marketplace →
                          </a>
                          <button onClick={reset}
                            className="px-5 py-2.5 rounded-[10px] border border-white/10 text-[13px] text-text-secondary hover:border-white/18 transition-colors">
                            Upload Another
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-[17px] font-semibold text-text-primary mb-1">List on Marketplace</div>
                        <div className="text-[13px] text-text-secondary mb-5">
                          Set a price in $0G. Two wallet confirmations: approve NFT transfer, then list.
                        </div>

                        {tokenId && (
                          <div className="bg-bg-elevated rounded-xl px-4 py-3 mb-5 border border-white/8 flex items-center justify-between text-[13px]">
                            <span className="text-text-muted">DataSeal</span>
                            <span className="text-text-primary font-semibold font-mono">#{tokenId}</span>
                          </div>
                        )}

                        <div className="mb-5">
                          <label className="text-[12px] text-text-muted mb-2 block uppercase tracking-wider">Price ($0G)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={listPrice}
                              onChange={(e) => setListPrice(e.target.value)}
                              className="flex-1 h-11 px-4 rounded-[10px] bg-bg-input border border-white/10 text-[15px] text-text-primary outline-none focus:border-purple-500/60 transition-colors"
                              placeholder="e.g. 50"
                            />
                            <span className="text-[13px] text-purple-400 font-semibold">$0G</span>
                          </div>
                        </div>

                        <button
                          onClick={listOnMarket}
                          disabled={listing || isPending}
                          className="w-full py-3 rounded-[10px] bg-purple-500 text-white text-[15px] font-semibold hover:bg-purple-400 hover:shadow-purple-glow disabled:opacity-60 transition-all duration-200"
                        >
                          {listing ? "Listing..." : "List on Marketplace →"}
                        </button>
                        <button onClick={() => setStep(4)}
                          className="w-full mt-2 py-2.5 rounded-[10px] border border-white/10 text-[13px] text-text-secondary hover:border-white/18 transition-colors">
                          Skip for now
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: sticky preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-3">DataSeal Preview</div>
            <PreviewCard step={step} result={result} fileName={fileName} />
          </div>
        </div>
      </div>
    </main>
  );
}
