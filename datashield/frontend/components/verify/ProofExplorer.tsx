"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { fetchSeal } from "@/lib/api";
import { DATASEAL_ABI, DATASEAL_ADDRESS } from "@/lib/contracts";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { HashDisplay } from "@/components/ui/HashDisplay";
import { GradientText } from "@/components/ui/GradientText";
import { formatAddress, formatTimestamp, relativeTime, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

function isBytes32(v: string) { return /^0x[0-9a-fA-F]{64}$/.test(v); }

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/6 last:border-0">
      <span className="text-[12px] text-text-muted flex-shrink-0 w-32">{label}</span>
      <div className="text-[13px] text-text-secondary text-right flex items-center gap-2 flex-wrap justify-end">{children}</div>
    </div>
  );
}

function CheckSection({ name, passed, detail }: { name: string; passed: boolean; detail?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-[14px] font-medium text-text-primary">{name}</span>
        <div className="flex items-center gap-2">
          <StatusPill status={passed ? "complete" : "failed"} />
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={cn("text-text-muted transition-transform", open && "rotate-180")}>
            <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-[13px] text-text-secondary border-t border-white/6 pt-3">
              {detail || (passed ? "All samples passed this check." : "Some samples failed this check.")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProofExplorer() {
  const sp = useSearchParams();
  const [input, setInput]   = React.useState(sp.get("tokenId") || "");
  const [mode, setMode]     = React.useState<"tokenId" | "rootHash">("tokenId");
  const [seal, setSeal]     = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!input) return;
    setMode(isBytes32(input) ? "rootHash" : "tokenId");
  }, [input]);

  // Auto-lookup if tokenId in URL
  React.useEffect(() => {
    const tid = sp.get("tokenId");
    if (tid && !seal) {
      const n = Number(tid);
      if (n > 0) {
        setLoading(true);
        fetchSeal(n).then(setSeal).catch(() => {}).finally(() => setLoading(false));
      }
    }
  }, []);

  const hashToToken = useReadContract({
    address: DATASEAL_ADDRESS,
    abi: DATASEAL_ABI,
    functionName: "hashToToken",
    args: mode === "rootHash" && isBytes32(input) ? [input as `0x${string}`] : undefined,
    query: { enabled: mode === "rootHash" && isBytes32(input) },
  });

  const tokenIdFromHash = hashToToken.data ? Number(hashToToken.data) : 0;

  const getSeal = useReadContract({
    address: DATASEAL_ADDRESS,
    abi: DATASEAL_ABI,
    functionName: "getSeal",
    args: mode === "rootHash" && tokenIdFromHash > 0 ? [BigInt(tokenIdFromHash)] : undefined,
    query: { enabled: mode === "rootHash" && tokenIdFromHash > 0 },
  });

  React.useEffect(() => {
    if (mode === "rootHash" && getSeal.data) setSeal(getSeal.data);
  }, [mode, getSeal.data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSeal(null);
    if (!input.trim()) return;
    if (mode === "tokenId") {
      const n = Number(input);
      if (!Number.isFinite(n) || n <= 0) { toast.error("Enter a valid token ID"); return; }
      setLoading(true);
      try { setSeal(await fetchSeal(n)); }
      catch (err: any) { toast.error(err?.message || "Failed to fetch seal"); }
      finally { setLoading(false); }
    }
  }

  function fillExample() { setInput("1"); }

  // Normalise seal data (array or object)
  const t = seal && Array.isArray(seal) ? {
    datasetHash: String(seal[0]), scanResultHash: String(seal[1]), daProofRoot: String(seal[2]),
    score: Number(seal[3]), timestamp: String(seal[4]), uploader: String(seal[5]),
    stake: String(seal[6]), slashed: Boolean(seal[7]), datasetName: String(seal[8]),
    modelType: String(seal[9]), sampleCount: Number(seal[10]),
  } : seal ? {
    datasetHash: String(seal.datasetHash || ""), scanResultHash: String(seal.scanResultHash || ""),
    daProofRoot: String(seal.daProofRoot || ""), score: Number(seal.score || 0),
    timestamp: String(seal.timestamp || ""), uploader: String(seal.uploader || ""),
    stake: String(seal.stake || ""), slashed: Boolean(seal.slashed), datasetName: String(seal.datasetName || ""),
    modelType: String(seal.modelType || ""), sampleCount: Number(seal.sampleCount || 0),
  } : null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold mb-2">
          <GradientText>Proof Explorer</GradientText>
        </h1>
        <p className="text-[15px] text-text-secondary">Verify any DataSeal certificate — trustlessly</p>
      </div>

      {/* Search */}
      <form onSubmit={onSubmit} className="glass rounded-2xl border border-white/10 p-2 flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter Token ID or dataset root hash (0x...)"
          className="flex-1 h-12 px-4 rounded-[10px] bg-bg-input border border-white/10 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-purple-500/60 transition-colors"
        />
        <button type="submit"
          className="h-12 px-6 rounded-[10px] bg-purple-500 text-white text-[14px] font-semibold hover:bg-purple-400 hover:shadow-purple-glow transition-all">
          Verify →
        </button>
      </form>
      <button onClick={fillExample} className="text-[12px] text-text-muted hover:text-purple-400 transition-colors">
        Try an example →
      </button>

      {/* Loading */}
      {loading && (
        <div className="mt-8 glass rounded-2xl border border-white/10 p-8 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span className="text-[14px] text-text-secondary">Loading certificate...</span>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {!loading && t && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Left: on-chain record */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B6EF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span className="text-[16px] font-semibold text-text-primary">On-Chain Record</span>
              </div>

              <DataRow label="Dataset Name"><span className="text-text-primary font-medium">{t.datasetName || "—"}</span></DataRow>
              <DataRow label="Score"><ScoreBadge score={t.score} size="sm" animate={t.score >= 80} /></DataRow>
              <DataRow label="Status"><StatusPill status={t.slashed ? "slashed" : "active"} /></DataRow>
              <DataRow label="Model Type">
                <span className="text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{t.modelType || "—"}</span>
              </DataRow>
              <DataRow label="Sample Count"><span>{formatNumber(t.sampleCount)}</span></DataRow>
              <DataRow label="Uploader">
                <span className="font-mono">{formatAddress(t.uploader)}</span>
                <a href={`https://chainscan-galileo.0g.ai/address/${t.uploader}`} target="_blank" rel="noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors text-[11px]">↗</a>
              </DataRow>
              <DataRow label="Stake Bonded"><span>{t.stake ? `${(Number(t.stake) / 1e18).toFixed(0)} $0G` : "—"}</span></DataRow>
              <DataRow label="Certified">
                <span>{t.timestamp ? formatTimestamp(t.timestamp) : "—"}</span>
                <span className="text-text-muted text-[11px]">{t.timestamp ? relativeTime(t.timestamp) : ""}</span>
              </DataRow>
              <DataRow label="Dataset Hash"><HashDisplay hash={t.datasetHash} truncate /></DataRow>
              <DataRow label="Scan Result Hash"><HashDisplay hash={t.scanResultHash} truncate /></DataRow>
              <DataRow label="DA Proof Root">
                <div className="flex items-center gap-2">
                  <HashDisplay hash={t.daProofRoot} truncate />
                  {t.daProofRoot && t.daProofRoot !== "0x" + "0".repeat(64) && (
                    <span className="text-[10px] font-semibold text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded">Anchored on 0G DA</span>
                  )}
                </div>
              </DataRow>
            </div>

            {/* Right: scan details */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1DD9A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="text-[16px] font-semibold text-text-primary">AI Scan Report</span>
              </div>

              <div className="space-y-2 mb-6">
                <CheckSection name="Label Consistency" passed={!t.slashed} detail="Checks label distribution for anomalies and inconsistencies across the dataset." />
                <CheckSection name="Outlier Detection" passed={!t.slashed} detail="Scans for statistical outliers that could indicate data poisoning or injection attacks." />
                <CheckSection name="Duplicate Injection" passed={!t.slashed} detail="Detects duplicate or near-duplicate samples that could bias model training." />
              </div>

              {/* DA Proof section */}
              <div className="bg-bg-elevated rounded-xl p-4 border border-white/8 mb-4">
                <div className="text-[13px] font-semibold text-text-primary mb-2">Scan log archived on 0G DA</div>
                <HashDisplay hash={t.daProofRoot} truncate />
                <button className="mt-3 w-full py-2 rounded-[10px] border border-white/10 text-[12px] text-text-secondary hover:border-white/18 hover:text-text-primary transition-colors">
                  Replay scan from DA
                </button>
                <p className="text-[11px] text-text-muted mt-2">Verifies scan without trusting DataShield</p>
              </div>

              {/* Explorer links */}
              <div className="flex flex-wrap gap-2">
                <a href={`https://chainscan-galileo.0g.ai/address/${DATASEAL_ADDRESS}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-white/10 text-[12px] text-text-secondary hover:border-white/18 hover:text-text-primary transition-colors">
                  View NFT on 0G Explorer ↗
                </a>
                <a href="https://da-explorer.0g.ai" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-white/10 text-[12px] text-text-secondary hover:border-white/18 hover:text-text-primary transition-colors">
                  View DA Proof ↗
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolving state */}
      {!loading && !t && (hashToToken.isFetching || getSeal.isFetching) && (
        <div className="mt-8 glass rounded-2xl border border-white/10 p-6 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span className="text-[13px] text-text-secondary">Resolving on-chain...</span>
        </div>
      )}
    </div>
  );
}
