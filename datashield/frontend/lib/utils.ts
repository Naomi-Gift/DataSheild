import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatHash(hash: string, chars = 10): string {
  if (!hash || hash.length < chars + 6) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-6)}`;
}

export function formatScore(score: number): string {
  return String(Math.round(score));
}

export function scoreColor(score: number): "teal" | "amber" | "coral" {
  if (score >= 70) return "teal";
  if (score >= 50) return "amber";
  return "coral";
}

export function scoreTier(score: number): string {
  if (score >= 80) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "MARGINAL";
  return "REJECTED";
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatTimestamp(ts: number | string): string {
  const d = new Date(typeof ts === "string" ? Number(ts) * 1000 : ts * 1000);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function relativeTime(ts: number | string): string {
  const now = Date.now();
  const then = typeof ts === "string" ? Number(ts) * 1000 : ts * 1000;
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
