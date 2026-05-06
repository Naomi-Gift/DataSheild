"use client";
import * as React from "react";
import { useDropzone } from "react-dropzone";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Props = { onUpload: (jobId: string) => void };

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function UploadZone({ onUpload }: Props) {
  const { address, isConnected } = useAccount();
  const [file, setFile]           = React.useState<File | null>(null);
  const [progress, setProgress]   = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError]         = React.useState<string | null>(null);
  const [done, setDone]           = React.useState(false);

  const onDrop = React.useCallback(async (accepted: File[], rejected: any[]) => {
    setError(null); setDone(false); setProgress(0);
    if (rejected.length > 0) {
      const msg = rejected[0]?.errors?.[0]?.message || "File rejected";
      setError(msg); toast.error(msg); return;
    }
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (!isConnected || !address) { setError("Connect wallet to upload."); return; }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) { setError("Missing NEXT_PUBLIC_API_URL."); return; }

    const fd = new FormData();
    fd.append("file", f);
    fd.append("walletAddress", address);
    setUploading(true);
    try {
      const result: { jobId: string } = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiUrl.replace(/\/$/, "")}/api/upload`);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(json);
            else reject(new Error(json?.error || `Upload failed (${xhr.status})`));
          } catch { reject(new Error(`Upload failed (${xhr.status})`)); }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });
      setDone(true);
      toast.success("Upload received. Scan started.");
      onUpload(result.jobId);
    } catch (e: any) {
      const msg = e?.message || "Upload failed";
      setError(msg); toast.error(msg);
    } finally { setUploading(false); }
  }, [address, isConnected, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, maxSize: 500 * 1024 * 1024,
    accept: {
      "text/csv": [".csv"],
      "application/octet-stream": [".parquet"],
      "application/json": [".json"],
      "application/x-ndjson": [".jsonl", ".ndjson"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const borderColor = error ? "rgba(245,97,74,0.5)" : isDragActive ? "rgba(123,110,246,0.8)" : done ? "rgba(29,217,160,0.5)" : "rgba(255,255,255,0.08)";
  const bgColor     = error ? "rgba(245,97,74,0.04)" : isDragActive ? "rgba(123,110,246,0.06)" : done ? "rgba(29,217,160,0.04)" : "rgba(8,10,24,0.6)";

  return (
    <div
      {...getRootProps()}
      className="relative min-h-[260px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-8 text-center overflow-hidden"
      style={{ borderColor, background: bgColor }}
    >
      <input {...getInputProps()} />

      {/* Grid overlay */}
      {isDragActive && (
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(123,110,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(123,110,246,0.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(29,217,160,0.12)", border: "1px solid rgba(29,217,160,0.3)", boxShadow: "0 0 20px rgba(29,217,160,0.2)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1DD9A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="font-mono text-[14px] font-bold text-teal-400">{file?.name}</div>
            <div className="font-mono text-[11px] text-text-muted">{file ? formatBytes(file.size) : ""} · UPLOADED</div>
          </motion.div>
        ) : uploading ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center gap-4">
            <div className="font-mono text-[13px] text-text-secondary">{file?.name}</div>
            <div className="w-full max-w-xs">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7B6EF6, #1DD9A0)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="mt-2 font-mono text-[11px] text-text-muted text-right">{progress}%</div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200"
              style={{
                background: isDragActive ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isDragActive ? "rgba(123,110,246,0.4)" : "rgba(255,255,255,0.06)"}`,
                boxShadow: isDragActive ? "0 0 20px rgba(123,110,246,0.3)" : "none",
              }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={isDragActive ? "#7B6EF6" : "#4A4870"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <div className="font-mono text-[14px] font-semibold text-text-secondary">
              {isDragActive ? "DROP IT 🔥" : "DROP_DATASET_HERE"}
            </div>
            <div className="font-mono text-[11px] text-text-muted">.csv · .json · .jsonl · .txt · .docx · max 500MB</div>
            {error && (
              <div className="mt-2 font-mono text-[11px] text-coral-400 px-4 py-2 rounded-xl"
                style={{ background: "rgba(245,97,74,0.08)", border: "1px solid rgba(245,97,74,0.2)" }}>
                ✕ {error}
              </div>
            )}
            {!isConnected && (
              <div className="mt-1 font-mono text-[11px] text-amber-400 px-4 py-2 rounded-xl"
                style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
                ⚠ Connect wallet to upload
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
