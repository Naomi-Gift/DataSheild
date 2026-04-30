"use client";
import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import type { ScanResult } from "@/lib/api";
import { fetchScan } from "@/lib/api";
import { scoreTier } from "@/lib/utils";
import { cn } from "@/lib/utils";

type CheckState = "waiting" | "running" | "pass" | "fail";
type Props = { jobId: string; onComplete: (result: ScanResult) => void };

function StatusIcon({ state }: { state: CheckState }) {
  if (state === "running") return (
    <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin flex-shrink-0" />
  );
  if (state === "pass") return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "#1DD9A0", boxShadow: "0 0 12px rgba(29,217,160,0.6)" }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1.5 5 4 7.5 8.5 2.5"/>
      </svg>
    </motion.div>
  );
  if (state === "fail") return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "#F5614A", boxShadow: "0 0 12px rgba(245,97,74,0.6)" }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
      </svg>
    </motion.div>
  );
  return <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />;
}

function checkState(check: any, overall: ScanResult["status"]): CheckState {
  if (overall === "pending") return "waiting";
  if (overall === "running" && !check) return "running";
  if (!check || typeof check.passed !== "boolean") return "running";
  return check.passed ? "pass" : "fail";
}

function TerminalLine({ text, delay = 0, color = "text-teal-400" }: { text: string; delay?: number; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`font-mono text-[11px] ${color}`}
    >
      <span className="text-text-muted mr-2">$</span>{text}
    </motion.div>
  );
}

function ScoreReveal({ score }: { score: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const unsub = rounded.on("change", setDisplay);
    const ctrl = animate(count, score, { duration: 1.4, ease: "easeOut" });
    return () => { ctrl.stop(); unsub(); };
  }, [score, count, rounded]);

  const color = score >= 70 ? "#1DD9A0" : score >= 50 ? "#F5A623" : "#F5614A";
  const tier = scoreTier(score);

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 14 }}
      className="flex flex-col items-center gap-3 py-6"
    >
      {/* Big score */}
      <div className="relative">
        <div className="absolute inset-[-16px] rounded-full blur-2xl opacity-30" style={{ background: color }} />
        <span className="relative font-mono font-black text-[80px] leading-none tabular-nums" style={{ color }}>
          {display}
        </span>
      </div>
      <div className="font-mono text-[11px] text-text-muted tracking-[0.2em]">CLEANLINESS_SCORE</div>
      <div className="font-mono text-[11px] font-bold px-3 py-1 rounded-full tracking-widest"
        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
        {tier}
      </div>
    </motion.div>
  );
}

const checks = [
  { key: "label", cmd: "run label_consistency_check",  pass: "PASSED — distribution normal",    fail: "FAILED — anomalies detected" },
  { key: "embed", cmd: "run outlier_detection_scan",   pass: "PASSED — no outliers found",      fail: "FAILED — outliers detected" },
  { key: "dup",   cmd: "run duplicate_injection_check",pass: "PASSED — dataset clean",          fail: "FAILED — duplicates found" },
];

export function ScanProgress({ jobId, onComplete }: Props) {
  const [result, setResult] = React.useState<ScanResult>({ status: "pending" });

  React.useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetchScan(jobId);
        if (!alive) return;
        setResult(r);
        if (r.status === "complete" || r.status === "failed") onComplete(r);
      } catch (e: any) {
        if (!alive) return;
        const err = { status: "failed" as const, error: e?.message || "Scan failed" };
        setResult(err);
        onComplete(err);
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => { alive = false; clearInterval(id); };
  }, [jobId, onComplete]);

  const isComplete = result.status === "complete";
  const isFailed   = result.status === "failed";
  const score      = result.score ?? 0;

  return (
    <div className="card-neon overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-coral-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-teal-500/60" />
          </div>
          <span className="font-mono text-[11px] text-text-muted ml-2">datashield — poison_scan</span>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && !isFailed && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          )}
          <span className="font-mono text-[10px] text-text-muted">{jobId.slice(0, 8)}…</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-5 space-y-1 font-mono text-[11px]">
        <TerminalLine text={`connect 0g_compute_node --job ${jobId.slice(0, 8)}`} color="text-text-muted" />
        <TerminalLine text="initializing poison detection pipeline..." delay={0.1} color="text-purple-300" />
        <TerminalLine text={`dataset loaded — ${result.sampleCount || "?"} samples`} delay={0.2} color="text-text-secondary" />
        <div className="pt-2" />

        {/* Check rows */}
        {checks.map((c, i) => {
          const checkData = result.checks?.[c.key as keyof typeof result.checks];
          const state = checkState(checkData, result.status);

          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.25 }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <StatusIcon state={state} />
              <div className="flex-1">
                <div className="font-mono text-[11px] text-text-muted">$ {c.cmd}</div>
                {state !== "waiting" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "font-mono text-[11px] mt-0.5",
                      state === "pass" ? "text-teal-400" : state === "fail" ? "text-coral-400" : "text-purple-300"
                    )}
                  >
                    {state === "running" ? "running..." : state === "pass" ? c.pass : c.fail}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Status */}
        {!isComplete && !isFailed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="font-mono text-[11px] text-purple-300">scanning with 0G compute nodes...</span>
            <span className="animate-blink text-purple-500">█</span>
          </motion.div>
        )}

        {isComplete && (
          <TerminalLine text="scan complete — computing score..." delay={0} color="text-teal-400" />
        )}
      </div>

      {/* Score reveal */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-white/5"
          >
            <ScoreReveal score={score} />
            <div className="px-5 pb-5">
              {score >= 70 ? (
                <div className="rounded-xl p-3 font-mono text-[12px] text-teal-400 flex items-center gap-2"
                  style={{ background: "rgba(29,217,160,0.08)", border: "1px solid rgba(29,217,160,0.2)" }}>
                  <span>✓</span> Dataset verified — ready to certify on 0G Chain
                </div>
              ) : (
                <div className="rounded-xl p-3 font-mono text-[12px] text-coral-400 flex items-center gap-2"
                  style={{ background: "rgba(245,97,74,0.08)", border: "1px solid rgba(245,97,74,0.2)" }}>
                  <span>✕</span> Score {score} below threshold (min 70) — rejected
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isFailed && (
        <div className="px-5 pb-5">
          <div className="rounded-xl p-3 font-mono text-[12px] text-coral-400"
            style={{ background: "rgba(245,97,74,0.08)", border: "1px solid rgba(245,97,74,0.2)" }}>
            ✕ {result.error || "Scan failed — retry"}
          </div>
        </div>
      )}
    </div>
  );
}
